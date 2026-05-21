"""
Export commissioning-ramp analysis for solar / wind / hybrid operating projects.

Produces:
  frontend/public/data/analytics/intelligence/commissioning-ramp.json

The window of interest is between an asset's first AEMO dispatch
(generation_daily) and the point it reaches stable full output (defined as the
first month with capacity factor >= 80% of the asset's own lifetime median
monthly CF). Revenue inside that window is taken from performance_monthly where
the OpenElectricity importer has settled it; everything else is modelled from
generation_daily.gen_mwh x dispatch_price_daily.avg_rrp and clearly flagged.
"""
import json
import os
import statistics
import sys
from collections import defaultdict
from datetime import date, datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection, DB_PATH

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'data')
INTEL_DIR = os.path.join(DATA_DIR, 'analytics', 'intelligence')

# Lifetime CF baseline window
LIFETIME_CF_MONTHS = 18
# Stable-output threshold: a month qualifies once its capacity factor reaches
# this fraction of the asset's lifetime median monthly CF.
STABLE_OUTPUT_FRACTION = 0.80
# Don't call any month within the first three months of generation "stable",
# even if CF momentarily clears the threshold (e.g. a single high-irradiance week).
MIN_RAMP_MONTHS = 3
# Daily generation must clear this MWh threshold to count as "real" first gen
# (filters out registration tests and noise).
FIRST_GEN_MIN_MWH = 0.1
# Generation data cutoff (AEMO daily snapshot starts here in this DB).
DATA_CUTOFF_DATE = '2021-01-01'

REGION_BY_STATE = {
    'NSW': 'NSW1', 'VIC': 'VIC1', 'QLD': 'QLD1', 'SA': 'SA1', 'TAS': 'TAS1',
}

TECHS_INCLUDED = ('solar', 'wind', 'hybrid')


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def write_json(path, data):
    ensure_dir(os.path.dirname(path))
    with open(path, 'w') as f:
        json.dump(data, f, indent=2, default=str)


def _stats_summary(values):
    vals = [v for v in values if v is not None]
    if not vals:
        return {'count': 0, 'mean': None, 'median': None, 'p25': None, 'p75': None}
    vs = sorted(vals)
    n = len(vs)
    return {
        'count': n,
        'mean': round(sum(vs) / n, 1),
        'median': round(statistics.median(vs), 1),
        'p25': round(vs[max(0, n // 4 - 1)], 1) if n >= 4 else round(vs[0], 1),
        'p75': round(vs[min(n - 1, 3 * n // 4)], 1) if n >= 4 else round(vs[-1], 1),
    }


def _ym(d):
    """YYYY-MM string from datetime/date."""
    return d.strftime('%Y-%m')


def _month_start(year, month):
    return date(year, month, 1)


def _month_end(year, month):
    if month == 12:
        return date(year, 12, 31)
    return date(year, month + 1, 1) - timedelta(days=1)


def _months_in_window(start_date, end_date):
    """Inclusive list of (year, month) tuples spanning the two dates."""
    out = []
    y, m = start_date.year, start_date.month
    while (y, m) <= (end_date.year, end_date.month):
        out.append((y, m))
        m += 1
        if m == 13:
            m = 1
            y += 1
    return out


def _hours_in_month(year, month):
    s = _month_start(year, month)
    e = _month_end(year, month)
    return ((e - s).days + 1) * 24


def get_target_projects(conn):
    """Operating solar/wind/hybrid projects with at least one linked DUID."""
    rows = conn.execute(f"""
        SELECT p.id, p.name, p.technology, p.state, p.capacity_mw,
               p.cod_current, p.cod_original
        FROM projects p
        WHERE p.status = 'operating'
          AND p.technology IN ({','.join('?'*len(TECHS_INCLUDED))})
        ORDER BY p.name
    """, TECHS_INCLUDED).fetchall()
    return [dict(r) for r in rows]


def get_duids_for_project(conn, project_id):
    rows = conn.execute("""
        SELECT duid, region, full_year_commissioning, registered_capacity_mw
        FROM aemo_generation_info
        WHERE project_id = ? AND duid IS NOT NULL
    """, (project_id,)).fetchall()
    return [dict(r) for r in rows]


def get_daily_generation(conn, duids):
    """Aggregate daily gen_mwh across all DUIDs for a project."""
    if not duids:
        return {}
    placeholders = ','.join('?' * len(duids))
    rows = conn.execute(f"""
        SELECT date, SUM(gen_mwh) AS gen_mwh
        FROM generation_daily
        WHERE duid IN ({placeholders})
        GROUP BY date
        ORDER BY date
    """, duids).fetchall()
    return {r['date']: (r['gen_mwh'] or 0.0) for r in rows}


def get_monthly_perf(conn, project_id):
    rows = conn.execute("""
        SELECT year, month, energy_mwh, capacity_factor_pct,
               energy_price_received, revenue_aud, data_source
        FROM performance_monthly
        WHERE project_id = ?
        ORDER BY year, month
    """, (project_id,)).fetchall()
    return [dict(r) for r in rows]


def get_region_prices(conn, region):
    """Daily avg RRP for a region, indexed by ISO date."""
    if not region:
        return {}
    rows = conn.execute("""
        SELECT date, avg_rrp
        FROM dispatch_price_daily
        WHERE region = ?
    """, (region,)).fetchall()
    return {r['date']: r['avg_rrp'] for r in rows if r['avg_rrp'] is not None}


def get_cod(conn, project):
    """Pick the best COD with a basis label."""
    # Prefer an explicit timeline COD event over the projects.cod_current field
    # because timeline events tend to be sourced from announcements.
    row = conn.execute("""
        SELECT date FROM timeline_events
        WHERE project_id = ? AND event_type = 'cod'
        ORDER BY date DESC LIMIT 1
    """, (project['id'],)).fetchone()
    if row and row['date']:
        return row['date'], 'timeline_cod_event'
    if project.get('cod_current'):
        return project['cod_current'], 'projects.cod_current'
    if project.get('cod_original'):
        return project['cod_original'], 'projects.cod_original'
    return None, 'none'


def detect_first_generation(daily_gen):
    """Find first day with gen above the noise threshold."""
    for d in sorted(daily_gen.keys()):
        if daily_gen[d] > FIRST_GEN_MIN_MWH:
            return d
    return None


def monthly_cf_series(monthly_perf):
    """Yield (year, month, cf_pct) in chronological order, skipping null CF."""
    return [
        (m['year'], m['month'], m['capacity_factor_pct'])
        for m in monthly_perf
        if m['capacity_factor_pct'] is not None
    ]


def compute_lifetime_cf(monthly_perf):
    """Median monthly CF across the asset's last 18 months. Returns (cf, basis)."""
    cf_rows = monthly_cf_series(monthly_perf)
    if not cf_rows:
        return None, 'no_data'
    recent = cf_rows[-LIFETIME_CF_MONTHS:]
    cf = statistics.median([r[2] for r in recent])
    if len(recent) >= LIFETIME_CF_MONTHS:
        basis = 'high'
    elif len(recent) >= 9:
        basis = 'medium'
    else:
        basis = 'low'
    return round(cf, 2), basis


def detect_stable_output(monthly_perf, lifetime_cf, first_gen_date):
    """First month with CF >= 80% of lifetime CF and at least MIN_RAMP_MONTHS
    months after first generation. Returns ISO end-of-month date or None."""
    if lifetime_cf is None or not first_gen_date:
        return None
    threshold = lifetime_cf * STABLE_OUTPUT_FRACTION
    fg = _parse_iso(first_gen_date)
    if not fg:
        return None
    cf_rows = monthly_cf_series(monthly_perf)
    for (yr, mo, cf) in cf_rows:
        if cf < threshold:
            continue
        eom = _month_end(yr, mo)
        if (eom - fg).days < MIN_RAMP_MONTHS * 28:
            continue
        return eom.isoformat()
    return None


def _parse_iso(s):
    if not s:
        return None
    try:
        return datetime.strptime(s[:10], '%Y-%m-%d').date()
    except ValueError:
        return None


def build_monthly_ramp(first_gen_date, end_date, daily_gen, monthly_perf,
                       region_prices, capacity_mw):
    """Build month-by-month ramp record between first_gen and end_date inclusive."""
    fg = _parse_iso(first_gen_date)
    if not fg:
        return []
    end = _parse_iso(end_date) if isinstance(end_date, str) else end_date
    if not end:
        # Use the last day for which we have generation data.
        if not daily_gen:
            return []
        end = _parse_iso(max(daily_gen.keys()))
    settled_lookup = {(m['year'], m['month']): m for m in monthly_perf}
    ramp = []
    for (yr, mo) in _months_in_window(fg, end):
        ms = _month_start(yr, mo)
        me = _month_end(yr, mo)
        # Window-clip the first / last month to the ramp boundaries.
        wstart = max(ms, fg)
        wend = min(me, end)
        # Aggregate gen + modelled revenue across the clipped window.
        gen_sum = 0.0
        modelled_rev = 0.0
        modelled_priced_days = 0
        day = wstart
        while day <= wend:
            iso = day.isoformat()
            g = daily_gen.get(iso, 0.0) or 0.0
            gen_sum += g
            price = region_prices.get(iso)
            if price is not None and g > 0:
                modelled_rev += g * price
                modelled_priced_days += 1
            day += timedelta(days=1)
        # Capacity factor for the month (using clipped hours).
        hours = ((wend - wstart).days + 1) * 24
        cf_pct = None
        if capacity_mw and hours > 0:
            cf_pct = round(100.0 * gen_sum / (capacity_mw * hours), 2)
        # Settled vs modelled revenue: settled overrides if present.
        settled = settled_lookup.get((yr, mo))
        if settled and settled.get('revenue_aud') is not None:
            revenue_aud = settled['revenue_aud']
            basis = 'settled'
            energy_mwh = settled.get('energy_mwh') or gen_sum
        else:
            revenue_aud = round(modelled_rev) if modelled_priced_days > 0 else None
            basis = 'modelled' if revenue_aud is not None else 'unavailable'
            energy_mwh = round(gen_sum, 1)
        ramp.append({
            'ym': f'{yr:04d}-{mo:02d}',
            'energy_mwh': round(energy_mwh, 1) if energy_mwh is not None else None,
            'cf_pct': cf_pct,
            'revenue_aud': revenue_aud,
            'revenue_basis': basis,
            'partial_month': (ms < fg) or (me > end),
        })
    return ramp


def analyse_project(conn, project):
    """Return one asset record or None if the project has no usable data."""
    duid_rows = get_duids_for_project(conn, project['id'])
    duids = [d['duid'] for d in duid_rows]
    if not duids:
        return None
    daily_gen = get_daily_generation(conn, duids)
    if not daily_gen:
        return None

    first_gen = detect_first_generation(daily_gen)
    if not first_gen:
        return None

    flags = []
    if first_gen <= DATA_CUTOFF_DATE:
        # Generation was already happening when the AEMO daily snapshot starts:
        # we can't see the true first day, so the ramp window is censored.
        flags.append('pre-2021-cutoff')

    monthly_perf = get_monthly_perf(conn, project['id'])
    lifetime_cf, cf_basis = compute_lifetime_cf(monthly_perf)
    if cf_basis == 'low':
        flags.append('short-history')
    if not monthly_perf:
        flags.append('no-settled-revenue')

    stable_output = detect_stable_output(monthly_perf, lifetime_cf, first_gen)
    if not stable_output:
        flags.append('not-yet-stable')

    cod_declared, cod_basis = get_cod(conn, project)
    if not cod_declared:
        flags.append('no-cod')

    # Days from first gen to stable output (None if not reached).
    ramp_days = None
    if stable_output:
        ramp_days = (_parse_iso(stable_output) - _parse_iso(first_gen)).days

    # AEMO region lookup: try aemo_generation_info first, else map from state.
    region = None
    for d in duid_rows:
        if d.get('region'):
            region = d['region']
            break
    if not region and project.get('state'):
        region = REGION_BY_STATE.get(project['state'])
    region_prices = get_region_prices(conn, region) if region else {}

    monthly_ramp = build_monthly_ramp(
        first_gen, stable_output, daily_gen, monthly_perf, region_prices,
        project.get('capacity_mw'),
    )

    # Aggregate the ramp window.
    early_energy = sum((m['energy_mwh'] or 0) for m in monthly_ramp)
    settled_rev = sum((m['revenue_aud'] or 0) for m in monthly_ramp if m['revenue_basis'] == 'settled')
    modelled_rev = sum((m['revenue_aud'] or 0) for m in monthly_ramp if m['revenue_basis'] == 'modelled')
    early_rev = settled_rev + modelled_rev
    total_rev = early_rev if early_rev > 0 else None
    basis_mix = None
    if total_rev:
        basis_mix = {
            'settled': round(settled_rev / total_rev, 3),
            'modelled': round(modelled_rev / total_rev, 3),
        }

    # Early-period output as % of theoretical (capacity x hours x lifetime CF).
    early_output_pct = None
    if ramp_days and lifetime_cf and project.get('capacity_mw'):
        theoretical = project['capacity_mw'] * 24 * (lifetime_cf / 100.0) * ramp_days
        if theoretical > 0:
            early_output_pct = round(100.0 * early_energy / theoretical, 1)

    commissioning_year = None
    fg_d = _parse_iso(first_gen)
    if fg_d:
        commissioning_year = fg_d.year

    early_revenue_per_mw = None
    if early_rev and project.get('capacity_mw'):
        early_revenue_per_mw = round(early_rev / project['capacity_mw'])

    return {
        'project_id': project['id'],
        'name': project['name'],
        'tech': project['technology'],
        'state': project['state'],
        'region': region,
        'capacity_mw': project.get('capacity_mw'),
        'cod_declared': cod_declared,
        'cod_basis': cod_basis,
        'first_generation_date': first_gen,
        'stable_output_date': stable_output,
        'ramp_days': ramp_days,
        'commissioning_year': commissioning_year,
        'lifetime_cf_pct': lifetime_cf,
        'lifetime_cf_basis': cf_basis,
        'early_energy_mwh': round(early_energy, 1) if early_energy else 0,
        'early_revenue_aud': round(early_rev) if early_rev else None,
        'early_revenue_per_mw': early_revenue_per_mw,
        'early_output_pct': early_output_pct,
        'early_revenue_basis_mix': basis_mix,
        'monthly_ramp': monthly_ramp,
        'data_quality_flags': flags,
    }


def build_rollups(assets):
    """Build aggregate rollups for the fleet by various groupings."""
    def metric_collector():
        return {
            'ramp_days': [], 'early_revenue_aud': [],
            'early_revenue_per_mw': [], 'early_output_pct': [],
        }

    def fill(target, asset):
        if asset['ramp_days'] is not None:
            target['ramp_days'].append(asset['ramp_days'])
        if asset['early_revenue_aud'] is not None:
            target['early_revenue_aud'].append(asset['early_revenue_aud'])
        if asset['early_revenue_per_mw'] is not None:
            target['early_revenue_per_mw'].append(asset['early_revenue_per_mw'])
        if asset['early_output_pct'] is not None:
            target['early_output_pct'].append(asset['early_output_pct'])

    by_state_year = defaultdict(metric_collector)
    by_tech_year = defaultdict(metric_collector)
    by_state = defaultdict(metric_collector)
    by_tech = defaultdict(metric_collector)

    for a in assets:
        s = a['state'] or 'Unknown'
        t = a['tech']
        y = a['commissioning_year']
        if y:
            fill(by_state_year[(s, t, y)], a)
            fill(by_tech_year[(t, y)], a)
        fill(by_state[(s, t)], a)
        fill(by_tech[t], a)

    def serialise(group_dict, key_names):
        out = []
        for key, metrics in sorted(group_dict.items(), key=lambda kv: tuple(str(p) for p in kv[0])):
            entry = dict(zip(key_names, key))
            entry['asset_count'] = max(
                len(metrics['ramp_days']),
                len(metrics['early_revenue_aud']),
                len(metrics['early_output_pct']),
            )
            entry['ramp_days'] = _stats_summary(metrics['ramp_days'])
            entry['early_revenue_aud'] = _stats_summary(metrics['early_revenue_aud'])
            entry['early_revenue_per_mw'] = _stats_summary(metrics['early_revenue_per_mw'])
            entry['early_output_pct'] = _stats_summary(metrics['early_output_pct'])
            out.append(entry)
        return out

    return {
        'by_state_year': serialise(by_state_year, ('state', 'tech', 'year')),
        'by_tech_year': serialise(by_tech_year, ('tech', 'year')),
        'by_state': serialise(by_state, ('state', 'tech')),
        'by_tech': serialise(by_tech, ('tech',)),
    }


def build_quality_summary(assets):
    flag_counts = defaultdict(int)
    cf_basis_counts = defaultdict(int)
    cod_basis_counts = defaultdict(int)
    for a in assets:
        for f in a['data_quality_flags']:
            flag_counts[f] += 1
        cf_basis_counts[a['lifetime_cf_basis']] += 1
        cod_basis_counts[a['cod_basis']] += 1
    return {
        'asset_count': len(assets),
        'flag_counts': dict(flag_counts),
        'lifetime_cf_basis_counts': dict(cf_basis_counts),
        'cod_basis_counts': dict(cod_basis_counts),
    }


def export_commissioning_ramp(conn):
    """Compute the commissioning-ramp dataset and write it to disk."""
    projects = get_target_projects(conn)
    assets = []
    skipped = 0
    for p in projects:
        record = analyse_project(conn, p)
        if record is None:
            skipped += 1
            continue
        assets.append(record)

    rollups = build_rollups(assets)
    quality = build_quality_summary(assets)

    out = {
        'generated_at': datetime.now().isoformat(timespec='seconds'),
        'definition_version': 1,
        'definitions': {
            'first_generation_date': f'First day in generation_daily where gen_mwh > {FIRST_GEN_MIN_MWH} MWh for any linked DUID.',
            'lifetime_cf_pct': f'Median monthly capacity factor across the last {LIFETIME_CF_MONTHS} months.',
            'stable_output_date': f'First calendar month-end where CF >= {int(STABLE_OUTPUT_FRACTION*100)}% of lifetime_cf_pct, at least {MIN_RAMP_MONTHS} months after first generation.',
            'early_revenue_aud': 'Sum of monthly revenue inside the ramp window. Uses settled performance_monthly.revenue_aud where available, else modelled = gen_mwh x dispatch_price_daily.avg_rrp for the asset region.',
            'early_output_pct': 'early_energy_mwh / (capacity_mw x 24h x lifetime_cf_pct x ramp_days).',
        },
        'data_sources': {
            'generation_daily': 'AEMO 5-min dispatch via Open Electricity, aggregated to daily MWh per DUID. Coverage from 2021-01-01 onwards.',
            'performance_monthly': "Open Electricity monthly settled energy/revenue. Importer filters to projects.status='operating' — commissioning-phase months are NOT in this table.",
            'dispatch_price_daily': 'Daily regional average RRP from AEMO dispatch prices. Coverage from 2024-08 onwards.',
            'projects.cod_current / timeline_events': 'Curated COD declarations sourced from announcements and AEMO Generation Information.',
            'aemo_generation_info.full_year_commissioning': 'AEMO-declared full-year commissioning date. Often future-dated for committed assets.',
        },
        'known_gaps': [
            'No data field currently captures Practical Completion or Commercial Operations Date distinct from COD. Could be enriched from ASX/developer press releases.',
            'Modelled revenue uses regional average RRP, not asset volume-weighted captured price — typically over-estimates solar (sun-coincident price suppression) and is unavailable before 2024-08.',
            'Only 3 projects have an explicit commissioning timeline event; ramp dates are inferred from generation_daily for the rest.',
            'Projects whose first generation pre-dates 2021-01-01 have censored ramp curves (flag: pre-2021-cutoff).',
        ],
        'quality_summary': quality,
        'skipped_count': skipped,
        'assets': assets,
        'rollups': rollups,
    }

    path = os.path.join(INTEL_DIR, 'commissioning-ramp.json')
    write_json(path, out)
    size_kb = os.path.getsize(path) / 1024
    print(
        f'commissioning-ramp.json: {len(assets)} assets ({skipped} skipped) — '
        f'{size_kb:.1f} KB'
    )


def main():
    conn = get_connection()
    try:
        export_commissioning_ramp(conn)
    finally:
        conn.close()


if __name__ == '__main__':
    main()
