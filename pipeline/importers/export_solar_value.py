"""Solar Value Analytics Exporter

Builds a comprehensive solar value dataset from:
  1. performance_monthly  — monthly CF, capture price, revenue (2018–present)
  2. performance_annual   — annual summaries
  3. dispatch_price_daily — regional pool prices (Aug 2024–present)
  4. price_band_capture   — 5-min price × generation correlation for solar DUIDs

Key solar-specific metrics computed:
  - Value factor (capture price / pool price) — the "solar cannibalisation" signal
  - Cannibalisation trend — is value factor declining as fleet grows?
  - Degradation rate — annual CF decline (panels lose ~0.3–0.5%/yr)
  - Best/worst capture months — winter wins, summer cannibalises
  - State ranking vs. peers

Output: frontend/public/data/analytics/intelligence/solar-value.json

Usage:
    python3 pipeline/importers/export_solar_value.py
    python3 pipeline/importers/export_solar_value.py --min-months 12
"""
from __future__ import annotations

import argparse
import json
import math
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional, Any

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection

ROOT_DIR   = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUTPUT_DIR = os.path.join(ROOT_DIR, 'frontend', 'public', 'data', 'analytics', 'intelligence')
OUTPUT_PATH = os.path.join(OUTPUT_DIR, 'solar-value.json')

MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

SEASON_MONTHS = {
    'summer': [12, 1, 2],
    'autumn': [3, 4, 5],
    'winter': [6, 7, 8],
    'spring': [9, 10, 11],
}

REGION_TO_STATE = {
    'NSW1': 'NSW', 'QLD1': 'QLD', 'SA1': 'SA', 'TAS1': 'TAS', 'VIC1': 'VIC',
}
STATE_TO_REGION = {v: k for k, v in REGION_TO_STATE.items()}


# ============================================================
# Data loaders
# ============================================================

def load_solar_projects(conn) -> List[dict]:
    rows = conn.execute("""
        SELECT p.id, p.name, p.state, p.capacity_mw, p.cod,
               COALESCE(p.region, ?) as region
        FROM projects p
        WHERE p.technology = 'solar' AND p.status = 'operating'
          AND p.capacity_mw IS NOT NULL AND p.capacity_mw > 0
        ORDER BY p.state, p.name
    """, ('',)).fetchall()
    result = []
    for r in rows:
        d = dict(r)
        # Infer region from state if missing
        if not d['region'] and d['state']:
            d['region'] = STATE_TO_REGION.get(d['state'], '')
        result.append(d)
    return result


def load_monthly_data(conn) -> Dict[str, List[dict]]:
    rows = conn.execute("""
        SELECT pm.project_id, pm.year, pm.month,
               pm.energy_mwh, pm.capacity_factor_pct,
               pm.energy_price_received, pm.revenue_aud
        FROM performance_monthly pm
        JOIN projects p ON pm.project_id = p.id
        WHERE p.technology = 'solar' AND p.status = 'operating'
        ORDER BY pm.project_id, pm.year, pm.month
    """).fetchall()
    by_project: Dict[str, List[dict]] = {}
    for r in rows:
        by_project.setdefault(r['project_id'], []).append(dict(r))
    return by_project


def load_annual_data(conn) -> Dict[str, List[dict]]:
    rows = conn.execute("""
        SELECT pa.project_id, pa.year,
               pa.energy_mwh, pa.capacity_factor_pct, pa.curtailment_pct,
               pa.energy_price_received, pa.revenue_aud, pa.revenue_per_mw
        FROM performance_annual pa
        JOIN projects p ON pa.project_id = p.id
        WHERE p.technology = 'solar' AND p.status = 'operating'
        ORDER BY pa.project_id, pa.year
    """).fetchall()
    by_project: Dict[str, List[dict]] = {}
    for r in rows:
        by_project.setdefault(r['project_id'], []).append(dict(r))
    return by_project


def load_pool_prices(conn) -> Dict[str, Dict[str, float]]:
    """Monthly average pool price per region. Returns {region: {"YYYY-MM": avg_rrp}}."""
    try:
        rows = conn.execute("""
            SELECT region,
                   strftime('%Y', date) || '-' || printf('%02d', CAST(strftime('%m', date) AS INTEGER)) as ym,
                   AVG(avg_rrp) as avg_price
            FROM dispatch_price_daily
            GROUP BY region, ym
        """).fetchall()
    except Exception:
        return {}
    result: Dict[str, Dict[str, float]] = {}
    for r in rows:
        result.setdefault(r['region'], {})[r['ym']] = round(r['avg_price'], 2)
    return result


def load_price_band_data(conn) -> Dict[str, Dict[str, List[dict]]]:
    """Load solar price band capture. Returns {project_id: {"YYYY-MM": [band_dict]}}."""
    try:
        rows = conn.execute("""
            SELECT pbc.project_id, pbc.year, pbc.month,
                   pbc.band_label, pbc.band_min, pbc.band_max,
                   SUM(pbc.gen_mwh) as gen_mwh,
                   CASE WHEN SUM(pbc.gen_mwh) > 0
                        THEN SUM(pbc.gen_mwh * COALESCE(pbc.avg_price, 0)) / SUM(pbc.gen_mwh)
                        ELSE NULL END as avg_price
            FROM price_band_capture pbc
            JOIN projects p ON pbc.project_id = p.id
            WHERE p.technology = 'solar' AND pbc.project_id IS NOT NULL
            GROUP BY pbc.project_id, pbc.year, pbc.month, pbc.band_label
            ORDER BY pbc.project_id, pbc.year, pbc.month, pbc.band_min
        """).fetchall()
    except Exception:
        return {}

    raw: Dict[str, Dict[str, Dict[str, dict]]] = {}
    for r in rows:
        pid = r['project_id']
        ym  = f"{r['year']}-{r['month']:02d}"
        raw.setdefault(pid, {}).setdefault(ym, {})[r['band_label']] = {
            'label':    r['band_label'],
            'band_min': r['band_min'],
            'band_max': r['band_max'],
            'gen_mwh':  round(r['gen_mwh'], 3),
            'avg_price': round(r['avg_price'], 2) if r['avg_price'] is not None else None,
        }

    result: Dict[str, Dict[str, List[dict]]] = {}
    for pid, months in raw.items():
        result[pid] = {}
        for ym, bands_by_label in months.items():
            total_mwh = sum(b['gen_mwh'] for b in bands_by_label.values())
            band_list = []
            for label, b in sorted(bands_by_label.items(), key=lambda x: x[1]['band_min']):
                band_list.append({
                    **b,
                    'gen_pct': round(b['gen_mwh'] / total_mwh * 100, 2) if total_mwh > 0 else 0.0,
                })
            result[pid][ym] = band_list
    return result


# ============================================================
# Analytics computation
# ============================================================

def _safe_mean(vals: list) -> Optional[float]:
    v = [x for x in vals if x is not None]
    return round(sum(v) / len(v), 3) if v else None


def _linear_trend(xs: list, ys: list) -> Optional[float]:
    """Return slope of least-squares line (ys per unit of xs). None if < 2 points."""
    pts = [(x, y) for x, y in zip(xs, ys) if y is not None]
    if len(pts) < 2:
        return None
    n = len(pts)
    sx  = sum(p[0] for p in pts)
    sy  = sum(p[1] for p in pts)
    sxy = sum(p[0] * p[1] for p in pts)
    sx2 = sum(p[0] ** 2 for p in pts)
    denom = n * sx2 - sx ** 2
    if denom == 0:
        return None
    return round((n * sxy - sx * sy) / denom, 4)


def compute_value_factor(capture_price: Optional[float], pool_price: Optional[float]) -> Optional[float]:
    if capture_price is None or pool_price is None or pool_price == 0:
        return None
    return round(capture_price / pool_price, 4)


def compute_project_analytics(
    project: dict,
    monthly_rows: List[dict],
    annual_rows: List[dict],
    pool_prices: Dict[str, Dict[str, float]],
    price_band_data: Dict[str, List[dict]],
    all_projects: List[dict],
) -> dict:
    pid    = project['id']
    state  = project['state'] or ''
    region = project['region'] or STATE_TO_REGION.get(state, '')
    region_prices = pool_prices.get(region, {})

    # ---- Monthly data ----
    monthly_data = []
    for r in monthly_rows:
        ym = f"{r['year']}-{r['month']:02d}"
        pool = region_prices.get(ym)
        vf   = compute_value_factor(r['energy_price_received'], pool)
        monthly_data.append({
            'year':          r['year'],
            'month':         r['month'],
            'cf_pct':        round(r['capacity_factor_pct'], 3) if r['capacity_factor_pct'] is not None else None,
            'capture_price': round(r['energy_price_received'], 2) if r['energy_price_received'] is not None else None,
            'revenue_aud':   round(r['revenue_aud']) if r['revenue_aud'] is not None else None,
            'pool_price':    round(pool, 2) if pool is not None else None,
            'value_factor':  vf,
        })

    # ---- Annual data ----
    annual_data = []
    for r in annual_rows:
        annual_data.append({
            'year':          r['year'],
            'cf_pct':        round(r['capacity_factor_pct'], 2) if r['capacity_factor_pct'] is not None else None,
            'capture_price': round(r['energy_price_received'], 2) if r['energy_price_received'] is not None else None,
            'energy_mwh':    round(r['energy_mwh']) if r['energy_mwh'] is not None else None,
            'revenue_aud':   round(r['revenue_aud']) if r['revenue_aud'] is not None else None,
            'revenue_per_mw': round(r['revenue_per_mw']) if r['revenue_per_mw'] is not None else None,
            'curtailment_pct': round(r['curtailment_pct'], 2) if r['curtailment_pct'] is not None else None,
        })

    # ---- Seasonal averages ----
    seasonal_averages: Dict[str, dict] = {}
    total_energy = sum(r['energy_mwh'] or 0 for r in monthly_rows if r['energy_mwh'])
    for season, months in SEASON_MONTHS.items():
        season_rows = [r for r in monthly_rows if r['month'] in months]
        cfs         = [r['capacity_factor_pct'] for r in season_rows if r['capacity_factor_pct'] is not None]
        caps        = [r['energy_price_received'] for r in season_rows if r['energy_price_received'] is not None]
        pools       = [region_prices.get(f"{r['year']}-{r['month']:02d}") for r in season_rows]
        vfs         = [compute_value_factor(c, p) for c, p in zip(caps, [p for p in pools if p is not None]) if c is not None]
        season_mwh  = sum(r['energy_mwh'] or 0 for r in season_rows if r['energy_mwh'])
        seasonal_averages[season] = {
            'avg_cf_pct':         _safe_mean(cfs),
            'avg_capture_price':  _safe_mean(caps),
            'avg_value_factor':   _safe_mean(vfs),
            'pct_of_annual_energy': round(season_mwh / total_energy * 100, 1) if total_energy > 0 else None,
        }

    # ---- Monthly averages (Jan–Dec) ----
    monthly_averages: Dict[str, dict] = {}
    for m in range(1, 13):
        m_rows = [r for r in monthly_rows if r['month'] == m]
        cfs    = [r['capacity_factor_pct'] for r in m_rows if r['capacity_factor_pct'] is not None]
        caps   = [r['energy_price_received'] for r in m_rows if r['energy_price_received'] is not None]
        pools  = [region_prices.get(f"{r['year']}-{r['month']:02d}") for r in m_rows]
        vfs    = [compute_value_factor(c, p) for c, p in zip(
                    [r['energy_price_received'] for r in m_rows if r['energy_price_received'] is not None],
                    [p for p in pools if p is not None]) if c is not None]
        monthly_averages[str(m)] = {
            'avg_cf_pct':        _safe_mean(cfs),
            'avg_capture_price': _safe_mean(caps),
            'avg_value_factor':  _safe_mean(vfs),
        }

    # ---- Value summary ----
    all_cf      = [r['capacity_factor_pct'] for r in monthly_rows if r['capacity_factor_pct'] is not None]
    all_cap     = [r['energy_price_received'] for r in monthly_rows if r['energy_price_received'] is not None]
    all_vf      = [r['value_factor'] for r in monthly_data if r['value_factor'] is not None]
    all_rev_mw  = [r['revenue_per_mw'] for r in annual_rows if r.get('revenue_per_mw') is not None]

    # Degradation: slope of annual CF over years
    annual_years = [r['year'] for r in annual_rows]
    annual_cfs   = [r['capacity_factor_pct'] for r in annual_rows]
    degradation_rate = _linear_trend(annual_years, annual_cfs)

    # CF trend label
    cf_trend: str
    if degradation_rate is None:
        cf_trend = 'insufficient_data'
    elif degradation_rate < -0.3:
        cf_trend = 'declining'
    elif degradation_rate > 0.3:
        cf_trend = 'improving'
    else:
        cf_trend = 'stable'

    # Value factor trend (cannibalisation signal)
    vf_months  = [r for r in monthly_data if r['value_factor'] is not None]
    vf_xs      = list(range(len(vf_months)))
    vf_ys      = [r['value_factor'] for r in vf_months]
    vf_trend_slope = _linear_trend(vf_xs, vf_ys)
    vf_trend: str
    if vf_trend_slope is None:
        vf_trend = 'insufficient_data'
    elif vf_trend_slope < -0.001:
        vf_trend = 'worsening'   # cannibalisation increasing
    elif vf_trend_slope > 0.001:
        vf_trend = 'improving'
    else:
        vf_trend = 'stable'

    # Best/worst capture month
    month_avgs_cap = {m: monthly_averages[str(m)]['avg_capture_price']
                      for m in range(1, 13) if monthly_averages[str(m)]['avg_capture_price'] is not None}
    best_cap_m  = MONTH_LABELS[max(month_avgs_cap, key=month_avgs_cap.get) - 1] if month_avgs_cap else None
    worst_cap_m = MONTH_LABELS[min(month_avgs_cap, key=month_avgs_cap.get) - 1] if month_avgs_cap else None

    data_years  = sorted(set(r['year'] for r in monthly_rows))
    avg_cf_excl_ramp = _safe_mean([r['capacity_factor_pct'] for r in monthly_rows
                                    if r['capacity_factor_pct'] is not None and r['year'] > (data_years[0] if data_years else 0)])

    value_summary = {
        'avg_cf_pct':           _safe_mean(all_cf),
        'avg_capture_price':    _safe_mean(all_cap),
        'avg_value_factor':     _safe_mean(all_vf),
        'avg_revenue_per_mw':   _safe_mean(all_rev_mw),
        'cf_trend':             cf_trend,
        'degradation_rate_pct_per_yr': degradation_rate,
        'value_factor_trend':   vf_trend,
        'best_capture_month':   best_cap_m,
        'worst_capture_month':  worst_cap_m,
        'data_first_year':      data_years[0] if data_years else None,
        'data_last_year':       data_years[-1] if data_years else None,
        'data_months_available': len(monthly_rows),
        'avg_cf_excl_ramp_year': avg_cf_excl_ramp,
        'data_confidence':      ('high' if len(monthly_rows) >= 24
                                 else 'medium' if len(monthly_rows) >= 12 else 'low'),
    }

    # ---- Price band summary ----
    pb_data = price_band_data.get(pid)
    price_band_summary = None
    if pb_data:
        all_months = list(pb_data.keys())
        price_band_summary = {
            'source':         '5min_nemweb',
            'coverage_start': min(all_months) if all_months else None,
            'coverage_end':   max(all_months) if all_months else None,
            'monthly':        pb_data,
        }

    # ---- State rank (computed later at fleet level) ----
    # Placeholder — filled in by compute_state_ranks()
    state_rank = None

    # ---- Pros/cons ----
    pros_cons = compute_pros_cons(value_summary, project)

    return {
        'id':               pid,
        'name':             project['name'],
        'state':            state,
        'capacity_mw':      project['capacity_mw'],
        'cod':              project['cod'],
        'monthly_data':     monthly_data,
        'annual_data':      annual_data,
        'seasonal_averages': seasonal_averages,
        'monthly_averages': monthly_averages,
        'value_summary':    value_summary,
        'price_band_data':  price_band_summary,
        'state_rank':       state_rank,
        'pros_cons':        pros_cons,
    }


def compute_pros_cons(vs: dict, project: dict) -> Optional[dict]:
    """Grade and describe the project's solar value profile."""
    avg_cf    = vs.get('avg_cf_pct')
    avg_vf    = vs.get('avg_value_factor')
    vf_trend  = vs.get('value_factor_trend')
    cf_trend  = vs.get('cf_trend')
    deg_rate  = vs.get('degradation_rate_pct_per_yr')

    if avg_cf is None:
        return None

    score = 0.0
    pros, cons = [], []

    # CF component (40%)
    if avg_cf >= 28:
        score += 2.0; pros.append(f'Strong capacity factor ({avg_cf:.1f}%) — above typical Australian solar')
    elif avg_cf >= 22:
        score += 1.0; pros.append(f'Moderate capacity factor ({avg_cf:.1f}%)')
    else:
        score += 0.0; cons.append(f'Below-average capacity factor ({avg_cf:.1f}%) — check resource or curtailment')

    # Value factor component (40%)
    if avg_vf is not None:
        if avg_vf >= 0.85:
            score += 2.0; pros.append(f'Low cannibalisation — value factor {avg_vf:.2f} (strong capture relative to pool)')
        elif avg_vf >= 0.70:
            score += 1.0
        else:
            score += 0.0; cons.append(f'High cannibalisation — value factor {avg_vf:.2f} (farm earns well below pool price)')
    else:
        score += 0.5

    # Cannibalisation trend (20%)
    if vf_trend == 'worsening':
        score -= 0.5; cons.append('Value factor declining — solar cannibalisation worsening over time')
    elif vf_trend == 'improving':
        score += 0.5; pros.append('Value factor improving — cannibalisation pressure easing')

    # Degradation
    if deg_rate is not None and deg_rate < -1.0:
        cons.append(f'Above-expected panel degradation ({deg_rate:+.1f}%/yr CF trend)')
    elif deg_rate is not None and -0.5 <= deg_rate <= 0.1:
        pros.append(f'Normal degradation profile ({deg_rate:+.2f}%/yr)')

    # Grade
    score = max(0.0, min(score, 4.0))
    grade = ('A+' if score >= 3.5 else 'A' if score >= 3.0 else
             'B+' if score >= 2.5 else 'B' if score >= 2.0 else
             'C+' if score >= 1.5 else 'C' if score >= 1.0 else 'D')

    return {'grade': grade, 'score': round(score + 1.0, 1), 'pros': pros, 'cons': cons}


def compute_state_ranks(projects_out: Dict[str, dict]) -> None:
    """Compute percentile ranks within each state and inject into each project."""
    by_state: Dict[str, List[dict]] = {}
    for pid, p in projects_out.items():
        by_state.setdefault(p['state'], []).append(p)

    for state, peers in by_state.items():
        n = len(peers)

        def rank_metric(key_path):
            vals = []
            for p in peers:
                v = p['value_summary'].get(key_path)
                vals.append((p['id'], v))
            vals_with_data = [(pid, v) for pid, v in vals if v is not None]
            vals_with_data.sort(key=lambda x: x[1], reverse=True)
            return {pid: (i + 1, len(vals_with_data)) for i, (pid, _) in enumerate(vals_with_data)}

        cf_ranks  = rank_metric('avg_cf_pct')
        cap_ranks = rank_metric('avg_capture_price')
        vf_ranks  = rank_metric('avg_value_factor')
        rev_ranks = rank_metric('avg_revenue_per_mw')

        for p in peers:
            pid = p['id']
            cf_r,  cf_t  = cf_ranks.get(pid,  (None, n))
            cap_r, cap_t = cap_ranks.get(pid, (None, n))
            vf_r,  vf_t  = vf_ranks.get(pid,  (None, n))
            rev_r, rev_t = rev_ranks.get(pid, (None, n))

            def pct(rank, total):
                return round((total - rank) / total * 100) if rank is not None and total > 0 else None

            p['state_rank'] = {
                'cf_rank':              cf_r,  'cf_total':              cf_t,  'cf_percentile':              pct(cf_r, cf_t),
                'capture_price_rank':   cap_r, 'capture_price_total':   cap_t, 'capture_price_percentile':   pct(cap_r, cap_t),
                'value_factor_rank':    vf_r,  'value_factor_total':    vf_t,  'value_factor_percentile':    pct(vf_r, vf_t),
                'revenue_per_mw_rank':  rev_r, 'revenue_per_mw_total':  rev_t,
            }


def compute_state_averages(projects_out: Dict[str, dict]) -> Dict[str, dict]:
    by_state: Dict[str, List[dict]] = {}
    for p in projects_out.values():
        by_state.setdefault(p['state'], []).append(p)

    result = {}
    for state, peers in by_state.items():
        cfs  = [p['value_summary']['avg_cf_pct'] for p in peers if p['value_summary']['avg_cf_pct'] is not None]
        caps = [p['value_summary']['avg_capture_price'] for p in peers if p['value_summary']['avg_capture_price'] is not None]
        vfs  = [p['value_summary']['avg_value_factor'] for p in peers if p['value_summary']['avg_value_factor'] is not None]
        revs = [p['value_summary']['avg_revenue_per_mw'] for p in peers if p['value_summary']['avg_revenue_per_mw'] is not None]

        def median(lst):
            if not lst: return None
            s = sorted(lst)
            mid = len(s) // 2
            return round(s[mid] if len(s) % 2 else (s[mid - 1] + s[mid]) / 2, 3)

        result[state] = {
            'solar_count':         len(peers),
            'avg_cf_pct':          round(sum(cfs) / len(cfs), 2) if cfs else None,
            'median_cf_pct':       median(cfs),
            'avg_capture_price':   round(sum(caps) / len(caps), 2) if caps else None,
            'avg_value_factor':    round(sum(vfs) / len(vfs), 4) if vfs else None,
            'avg_revenue_per_mw':  round(sum(revs) / len(revs)) if revs else None,
        }
    return result


# ============================================================
# Main
# ============================================================

def main() -> None:
    parser = argparse.ArgumentParser(description='Export solar value analytics JSON')
    parser.add_argument('--min-months', type=int, default=6,
                        help='Minimum months of data to include a project (default: 6)')
    args = parser.parse_args()

    conn = get_connection()
    print('Loading solar projects...')
    projects = load_solar_projects(conn)
    print(f'  {len(projects)} operating solar projects found')

    print('Loading monthly performance data...')
    monthly_by_project = load_monthly_data(conn)

    print('Loading annual performance data...')
    annual_by_project = load_annual_data(conn)

    print('Loading pool prices...')
    pool_prices = load_pool_prices(conn)
    n_price_months = sum(len(v) for v in pool_prices.values())
    print(f'  {n_price_months} region-month price records loaded')

    print('Loading 5-min price band capture data (solar)...')
    price_band_data = load_price_band_data(conn)
    print(f'  {len(price_band_data)} projects have 5-min price band data')

    print('Computing project analytics...')
    projects_out: Dict[str, dict] = {}
    skipped = 0
    for project in projects:
        pid = project['id']
        monthly_rows = monthly_by_project.get(pid, [])
        annual_rows  = annual_by_project.get(pid, [])

        if len(monthly_rows) < args.min_months and not annual_rows:
            skipped += 1
            continue

        result = compute_project_analytics(
            project, monthly_rows, annual_rows,
            pool_prices, price_band_data, projects,
        )
        projects_out[pid] = result

    print(f'  {len(projects_out)} projects computed, {skipped} skipped (< {args.min_months} months data)')

    print('Computing state rankings...')
    compute_state_ranks(projects_out)

    print('Computing state averages...')
    state_averages = compute_state_averages(projects_out)

    # Pool price summary for frontend
    pool_price_summary: Dict[str, Dict[str, float]] = {}
    for region, months in pool_prices.items():
        state = REGION_TO_STATE.get(region)
        if not state:
            continue
        by_year: Dict[str, list] = {}
        for ym, price in months.items():
            yr = ym[:4]
            by_year.setdefault(yr, []).append(price)
        pool_price_summary[state] = {yr: round(sum(vs) / len(vs), 2) for yr, vs in by_year.items()}

    output = {
        'generated_at':  datetime.utcnow().isoformat() + 'Z',
        'data_note':     (
            'Solar value analytics. CF and revenue from OpenElectricity API. '
            'Capture price and value factor from Aug 2024+ (AEMO MMSDM). '
            'Value factor = capture price / pool price — the solar cannibalisation signal. '
            'Price band data requires running import_price_band_capture.py --tech solar.'
        ),
        'pool_prices':    pool_price_summary,
        'state_averages': state_averages,
        'projects':       projects_out,
    }

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(output, f, separators=(',', ':'))
    size_kb = os.path.getsize(OUTPUT_PATH) // 1024
    print(f'\nWrote {OUTPUT_PATH} ({size_kb} KB, {len(projects_out)} projects)')
    conn.close()


if __name__ == '__main__':
    main()
