"""BESS Value Analytics Exporter

Builds a comprehensive BESS value dataset from:
  1. performance_monthly  — monthly charge/discharge prices, revenue (2018–present)
  2. performance_annual   — annual cycles, utilisation, round-trip efficiency
  3. dispatch_price_daily — regional pool prices (Aug 2024–present)
  4. bess_band_capture    — 5-min price × dispatch correlation (GEN + LOAD directions)

Key BESS metrics computed:
  - Arbitrage spread (discharge price − charge price)
  - Spread trend — is the spread narrowing as more BESS enters the market?
  - Capture efficiency — discharge price vs. daily peak pool price ratio
  - Charge optimisation — charge price vs. daily average pool price ratio
  - Round-trip efficiency — actual MWh discharged / MWh charged
  - Discharge price bands — what price events does it capture?
  - Charge price bands — how cheap does it buy?
  - State ranking vs. peers

Output: frontend/public/data/analytics/intelligence/bess-value.json

Usage:
    python3 pipeline/importers/export_bess_value.py
    python3 pipeline/importers/export_bess_value.py --min-months 6
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional, Any

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection

ROOT_DIR    = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUTPUT_DIR  = os.path.join(ROOT_DIR, 'frontend', 'public', 'data', 'analytics', 'intelligence')
OUTPUT_PATH = os.path.join(OUTPUT_DIR, 'bess-value.json')

REGION_TO_STATE = {
    'NSW1': 'NSW', 'QLD1': 'QLD', 'SA1': 'SA', 'TAS1': 'TAS', 'VIC1': 'VIC',
}
STATE_TO_REGION = {v: k for k, v in REGION_TO_STATE.items()}


# ============================================================
# Data loaders
# ============================================================

def load_bess_projects(conn) -> List[dict]:
    rows = conn.execute("""
        SELECT p.id, p.name, p.state, p.capacity_mw, p.storage_mwh, p.cod,
               COALESCE(p.region, '') as region
        FROM projects p
        WHERE p.technology = 'bess' AND p.status = 'operating'
          AND p.capacity_mw IS NOT NULL AND p.capacity_mw > 0
        ORDER BY p.state, p.capacity_mw DESC
    """).fetchall()
    result = []
    for r in rows:
        d = dict(r)
        if not d['region'] and d['state']:
            d['region'] = STATE_TO_REGION.get(d['state'], '')
        # Compute duration
        if d['capacity_mw'] and d['storage_mwh']:
            d['duration_h'] = round(d['storage_mwh'] / d['capacity_mw'], 2)
        else:
            d['duration_h'] = None
        result.append(d)
    return result


def load_monthly_data(conn) -> Dict[str, List[dict]]:
    rows = conn.execute("""
        SELECT pm.project_id, pm.year, pm.month,
               pm.energy_mwh, pm.energy_discharged_mwh, pm.energy_charged_mwh,
               pm.avg_discharge_price, pm.avg_charge_price, pm.revenue_aud
        FROM performance_monthly pm
        JOIN projects p ON pm.project_id = p.id
        WHERE p.technology = 'bess' AND p.status = 'operating'
        ORDER BY pm.project_id, pm.year, pm.month
    """).fetchall()
    by_project: Dict[str, List[dict]] = {}
    for r in rows:
        by_project.setdefault(r['project_id'], []).append(dict(r))
    return by_project


def load_annual_data(conn) -> Dict[str, List[dict]]:
    rows = conn.execute("""
        SELECT pa.project_id, pa.year,
               pa.energy_discharged_mwh, pa.energy_charged_mwh,
               pa.avg_discharge_price, pa.avg_charge_price,
               pa.utilisation_pct, pa.cycles, pa.revenue_aud, pa.revenue_per_mw,
               pa.market_value_aud
        FROM performance_annual pa
        JOIN projects p ON pa.project_id = p.id
        WHERE p.technology = 'bess' AND p.status = 'operating'
        ORDER BY pa.project_id, pa.year
    """).fetchall()
    by_project: Dict[str, List[dict]] = {}
    for r in rows:
        by_project.setdefault(r['project_id'], []).append(dict(r))
    return by_project


def load_pool_prices(conn) -> Dict[str, Dict[str, float]]:
    """Returns {region: {"YYYY-MM": avg_rrp}}."""
    try:
        rows = conn.execute("""
            SELECT region,
                   strftime('%Y', date) || '-' || printf('%02d', CAST(strftime('%m', date) AS INTEGER)) as ym,
                   AVG(avg_rrp) as avg_price,
                   MAX(peak_rrp) as peak_price
            FROM dispatch_price_daily
            GROUP BY region, ym
        """).fetchall()
    except Exception:
        return {}
    avg_result: Dict[str, Dict[str, float]] = {}
    for r in rows:
        avg_result.setdefault(r['region'], {})[r['ym']] = round(r['avg_price'], 2)
    return avg_result


def load_bess_band_data(conn) -> Dict[str, Dict[str, Dict[str, List[dict]]]]:
    """Load bess_band_capture data.

    Returns {project_id: {"YYYY-MM": {"GEN": [band_dicts], "LOAD": [band_dicts]}}}
    """
    try:
        rows = conn.execute("""
            SELECT bbc.project_id, bbc.year, bbc.month, bbc.direction,
                   bbc.band_label, bbc.band_min, bbc.band_max,
                   SUM(bbc.energy_mwh) as energy_mwh,
                   CASE WHEN SUM(bbc.energy_mwh) > 0
                        THEN SUM(bbc.energy_mwh * COALESCE(bbc.avg_price, 0)) / SUM(bbc.energy_mwh)
                        ELSE NULL END as avg_price
            FROM bess_band_capture bbc
            JOIN projects p ON bbc.project_id = p.id
            WHERE p.technology = 'bess' AND bbc.project_id IS NOT NULL
            GROUP BY bbc.project_id, bbc.year, bbc.month, bbc.direction, bbc.band_label
            ORDER BY bbc.project_id, bbc.year, bbc.month, bbc.direction, bbc.band_min
        """).fetchall()
    except Exception:
        return {}

    raw: Dict[str, Dict[str, Dict[str, Dict[str, dict]]]] = {}
    for r in rows:
        pid = r['project_id']
        ym  = f"{r['year']}-{r['month']:02d}"
        raw.setdefault(pid, {}).setdefault(ym, {}).setdefault(r['direction'], {})[r['band_label']] = {
            'label':      r['band_label'],
            'band_min':   r['band_min'],
            'band_max':   r['band_max'],
            'energy_mwh': round(r['energy_mwh'], 3),
            'avg_price':  round(r['avg_price'], 2) if r['avg_price'] is not None else None,
        }

    result: Dict[str, Dict[str, Dict[str, List[dict]]]] = {}
    for pid, months in raw.items():
        result[pid] = {}
        for ym, directions in months.items():
            result[pid][ym] = {}
            for direction, bands_by_label in directions.items():
                total_mwh = sum(b['energy_mwh'] for b in bands_by_label.values())
                band_list = []
                for label, b in sorted(bands_by_label.items(), key=lambda x: x[1]['band_min']):
                    band_list.append({
                        **b,
                        'energy_pct': round(b['energy_mwh'] / total_mwh * 100, 2) if total_mwh > 0 else 0.0,
                    })
                result[pid][ym][direction] = band_list
    return result


# ============================================================
# Analytics
# ============================================================

def _safe_mean(vals: list) -> Optional[float]:
    v = [x for x in vals if x is not None]
    return round(sum(v) / len(v), 3) if v else None


def _linear_trend(xs: list, ys: list) -> Optional[float]:
    pts = [(x, y) for x, y in zip(xs, ys) if y is not None]
    if len(pts) < 2:
        return None
    n = len(pts)
    sx  = sum(p[0] for p in pts)
    sy  = sum(p[1] for p in pts)
    sxy = sum(p[0] * p[1] for p in pts)
    sx2 = sum(p[0] ** 2 for p in pts)
    denom = n * sx2 - sx ** 2
    return round((n * sxy - sx * sy) / denom, 4) if denom != 0 else None


def compute_project_analytics(
    project: dict,
    monthly_rows: List[dict],
    annual_rows: List[dict],
    pool_prices: Dict[str, Dict[str, float]],
    bess_band_data: Dict[str, Dict[str, List[dict]]],
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
        dis_p = r.get('avg_discharge_price')
        chg_p = r.get('avg_charge_price')
        spread = (round(dis_p - chg_p, 2)
                  if dis_p is not None and chg_p is not None else None)
        dis_mwh = r.get('energy_discharged_mwh')
        chg_mwh = r.get('energy_charged_mwh')
        rte = (round(dis_mwh / chg_mwh * 100, 2)
               if dis_mwh and chg_mwh and chg_mwh > 0 else None)
        # Capture efficiency: how close to pool peak did we discharge?
        capture_eff = (round(dis_p / pool * 100, 1)
                       if dis_p is not None and pool and pool > 0 else None)
        monthly_data.append({
            'year':               r['year'],
            'month':              r['month'],
            'energy_discharged_mwh': round(dis_mwh) if dis_mwh is not None else None,
            'energy_charged_mwh':    round(chg_mwh) if chg_mwh is not None else None,
            'avg_discharge_price':   round(dis_p, 2) if dis_p is not None else None,
            'avg_charge_price':      round(chg_p, 2) if chg_p is not None else None,
            'spread':                spread,
            'round_trip_efficiency': rte,
            'pool_price':            round(pool, 2) if pool is not None else None,
            'capture_efficiency_pct': capture_eff,
            'revenue_aud':           round(r['revenue_aud']) if r.get('revenue_aud') is not None else None,
        })

    # ---- Annual data ----
    annual_data = []
    for r in annual_rows:
        dis_p = r.get('avg_discharge_price')
        chg_p = r.get('avg_charge_price')
        dis_mwh = r.get('energy_discharged_mwh')
        chg_mwh = r.get('energy_charged_mwh')
        annual_data.append({
            'year':                 r['year'],
            'energy_discharged_mwh': round(dis_mwh) if dis_mwh is not None else None,
            'energy_charged_mwh':    round(chg_mwh) if chg_mwh is not None else None,
            'avg_discharge_price':   round(dis_p, 2) if dis_p is not None else None,
            'avg_charge_price':      round(chg_p, 2) if chg_p is not None else None,
            'spread':                round(dis_p - chg_p, 2) if dis_p is not None and chg_p is not None else None,
            'round_trip_efficiency': round(dis_mwh / chg_mwh * 100, 2) if dis_mwh and chg_mwh and chg_mwh > 0 else None,
            'utilisation_pct':      round(r['utilisation_pct'], 2) if r.get('utilisation_pct') is not None else None,
            'cycles':               round(r['cycles'], 1) if r.get('cycles') is not None else None,
            'revenue_aud':          round(r['revenue_aud']) if r.get('revenue_aud') is not None else None,
            'revenue_per_mw':       round(r['revenue_per_mw']) if r.get('revenue_per_mw') is not None else None,
        })

    # ---- Value summary ----
    spreads    = [r['spread'] for r in monthly_data if r['spread'] is not None]
    dis_prices = [r['avg_discharge_price'] for r in monthly_data if r['avg_discharge_price'] is not None]
    chg_prices = [r['avg_charge_price'] for r in monthly_data if r['avg_charge_price'] is not None]
    rtes       = [r['round_trip_efficiency'] for r in monthly_data if r['round_trip_efficiency'] is not None]
    cap_effs   = [r['capture_efficiency_pct'] for r in monthly_data if r['capture_efficiency_pct'] is not None]
    utils      = [r['utilisation_pct'] for r in annual_rows if r.get('utilisation_pct') is not None]
    cycles_ann = [r['cycles'] for r in annual_rows if r.get('cycles') is not None]
    rev_mw     = [r['revenue_per_mw'] for r in annual_rows if r.get('revenue_per_mw') is not None]

    # Spread trend (is arbitrage being squeezed?)
    spread_xs    = list(range(len(spreads)))
    spread_trend_slope = _linear_trend(spread_xs, spreads)
    spread_trend: str
    if spread_trend_slope is None or len(spreads) < 6:
        spread_trend = 'insufficient_data'
    elif spread_trend_slope < -2:
        spread_trend = 'declining'
    elif spread_trend_slope > 2:
        spread_trend = 'improving'
    else:
        spread_trend = 'stable'

    data_years = sorted(set(r['year'] for r in monthly_rows))

    value_summary = {
        'avg_spread':             _safe_mean(spreads),
        'avg_discharge_price':    _safe_mean(dis_prices),
        'avg_charge_price':       _safe_mean(chg_prices),
        'spread_trend':           spread_trend,
        'avg_round_trip_efficiency': _safe_mean(rtes),
        'avg_capture_efficiency': _safe_mean(cap_effs),
        'avg_utilisation_pct':    _safe_mean(utils),
        'avg_cycles_per_year':    _safe_mean(cycles_ann),
        'avg_revenue_per_mw':     _safe_mean(rev_mw),
        'data_first_year':        data_years[0] if data_years else None,
        'data_last_year':         data_years[-1] if data_years else None,
        'data_months_available':  len(monthly_rows),
        'data_confidence':        ('high' if len(monthly_rows) >= 18
                                   else 'medium' if len(monthly_rows) >= 6 else 'low'),
    }

    # ---- BESS band data ----
    bb_data = bess_band_data.get(pid)
    bess_band_summary = None
    if bb_data:
        all_months = list(bb_data.keys())
        bess_band_summary = {
            'source':         '5min_nemweb',
            'coverage_start': min(all_months) if all_months else None,
            'coverage_end':   max(all_months) if all_months else None,
            'monthly':        bb_data,
        }

    # ---- Pros/cons ----
    pros_cons = compute_pros_cons(value_summary, project)

    return {
        'id':               pid,
        'name':             project['name'],
        'state':            state,
        'capacity_mw':      project['capacity_mw'],
        'storage_mwh':      project['storage_mwh'],
        'duration_h':       project['duration_h'],
        'cod':              project['cod'],
        'monthly_data':     monthly_data,
        'annual_data':      annual_data,
        'value_summary':    value_summary,
        'bess_band_data':   bess_band_summary,
        'state_rank':       None,  # filled by compute_state_ranks()
        'pros_cons':        pros_cons,
    }


def compute_pros_cons(vs: dict, project: dict) -> Optional[dict]:
    spread = vs.get('avg_spread')
    rte    = vs.get('avg_round_trip_efficiency')
    util   = vs.get('avg_utilisation_pct')
    spread_trend = vs.get('spread_trend')

    if spread is None and util is None:
        return None

    score = 0.0
    pros, cons = [], []

    # Spread component (40%)
    if spread is not None:
        if spread >= 200:
            score += 2.0; pros.append(f'Strong arbitrage spread ${spread:.0f}/MWh — effective price capture')
        elif spread >= 100:
            score += 1.0; pros.append(f'Moderate arbitrage spread ${spread:.0f}/MWh')
        else:
            cons.append(f'Low arbitrage spread ${spread:.0f}/MWh — limited profit margin after costs')

    # Spread trend (20%)
    if spread_trend == 'declining':
        score -= 0.5; cons.append('Spread narrowing — increasing BESS competition squeezing arbitrage margins')
    elif spread_trend == 'improving':
        score += 0.5; pros.append('Spread widening — market conditions improving for storage')

    # Utilisation (20%)
    if util is not None:
        if util >= 50:
            score += 1.0; pros.append(f'High utilisation ({util:.0f}%) — asset well-deployed')
        elif util >= 25:
            score += 0.5
        else:
            cons.append(f'Low utilisation ({util:.0f}%) — check FCAS revenue or curtailment')

    # RTE (20%)
    if rte is not None:
        if rte >= 88:
            score += 0.5; pros.append(f'Strong round-trip efficiency ({rte:.1f}%)')
        elif rte < 80:
            cons.append(f'Below-expected round-trip efficiency ({rte:.1f}%) — check losses or metering')

    score = max(0.0, min(score, 4.0))
    grade = ('A+' if score >= 3.5 else 'A' if score >= 3.0 else
             'B+' if score >= 2.5 else 'B' if score >= 2.0 else
             'C+' if score >= 1.5 else 'C' if score >= 1.0 else 'D')

    return {'grade': grade, 'score': round(score + 1.0, 1), 'pros': pros, 'cons': cons}


def compute_state_ranks(projects_out: Dict[str, dict]) -> None:
    by_state: Dict[str, List[dict]] = {}
    for p in projects_out.values():
        by_state.setdefault(p['state'], []).append(p)

    for state, peers in by_state.items():
        n = len(peers)

        def rank_metric(key):
            vals = [(p['id'], p['value_summary'].get(key)) for p in peers]
            with_data = [(pid, v) for pid, v in vals if v is not None]
            with_data.sort(key=lambda x: x[1], reverse=True)
            return {pid: (i + 1, len(with_data)) for i, (pid, _) in enumerate(with_data)}

        spread_ranks = rank_metric('avg_spread')
        util_ranks   = rank_metric('avg_utilisation_pct')
        rev_ranks    = rank_metric('avg_revenue_per_mw')

        def pct(rank, total):
            return round((total - rank) / total * 100) if rank and total > 0 else None

        for p in peers:
            pid = p['id']
            sr, st = spread_ranks.get(pid, (None, n))
            ur, ut = util_ranks.get(pid,   (None, n))
            rr, rt = rev_ranks.get(pid,    (None, n))
            p['state_rank'] = {
                'spread_rank':        sr, 'spread_total':        st, 'spread_percentile':        pct(sr, st),
                'utilisation_rank':   ur, 'utilisation_total':   ut, 'utilisation_percentile':   pct(ur, ut),
                'revenue_per_mw_rank': rr, 'revenue_per_mw_total': rt,
            }


def compute_state_averages(projects_out: Dict[str, dict]) -> Dict[str, dict]:
    by_state: Dict[str, List[dict]] = {}
    for p in projects_out.values():
        by_state.setdefault(p['state'], []).append(p)

    result = {}
    for state, peers in by_state.items():
        spreads = [p['value_summary']['avg_spread'] for p in peers if p['value_summary']['avg_spread'] is not None]
        dis_ps  = [p['value_summary']['avg_discharge_price'] for p in peers if p['value_summary']['avg_discharge_price'] is not None]
        chg_ps  = [p['value_summary']['avg_charge_price'] for p in peers if p['value_summary']['avg_charge_price'] is not None]
        utils   = [p['value_summary']['avg_utilisation_pct'] for p in peers if p['value_summary']['avg_utilisation_pct'] is not None]
        rtes    = [p['value_summary']['avg_round_trip_efficiency'] for p in peers if p['value_summary']['avg_round_trip_efficiency'] is not None]
        revs    = [p['value_summary']['avg_revenue_per_mw'] for p in peers if p['value_summary']['avg_revenue_per_mw'] is not None]

        def median(lst):
            if not lst: return None
            s = sorted(lst)
            mid = len(s) // 2
            return round(s[mid] if len(s) % 2 else (s[mid - 1] + s[mid]) / 2, 2)

        result[state] = {
            'bess_count':               len(peers),
            'median_spread':            median(spreads),
            'median_discharge_price':   median(dis_ps),
            'median_charge_price':      median(chg_ps),
            'median_utilisation_pct':   median(utils),
            'median_round_trip_efficiency': median(rtes),
            'median_revenue_per_mw':    median(revs),
        }
    return result


# ============================================================
# Main
# ============================================================

def main() -> None:
    parser = argparse.ArgumentParser(description='Export BESS value analytics JSON')
    parser.add_argument('--min-months', type=int, default=6,
                        help='Minimum months of data to include a project (default: 6)')
    args = parser.parse_args()

    conn = get_connection()
    print('Loading BESS projects...')
    projects = load_bess_projects(conn)
    print(f'  {len(projects)} operating BESS projects found')

    print('Loading monthly performance data...')
    monthly_by_project = load_monthly_data(conn)

    print('Loading annual performance data...')
    annual_by_project = load_annual_data(conn)

    print('Loading pool prices...')
    pool_prices = load_pool_prices(conn)

    print('Loading 5-min BESS band capture data...')
    bess_band_data = load_bess_band_data(conn)
    print(f'  {len(bess_band_data)} projects have 5-min charge/discharge band data')

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
            pool_prices, bess_band_data,
        )
        projects_out[pid] = result

    print(f'  {len(projects_out)} projects computed, {skipped} skipped (< {args.min_months} months data)')

    print('Computing state rankings...')
    compute_state_ranks(projects_out)

    print('Computing state averages...')
    state_averages = compute_state_averages(projects_out)

    output = {
        'generated_at':  datetime.utcnow().isoformat() + 'Z',
        'data_note':     (
            'BESS value analytics. Charge/discharge prices and revenue from OpenElectricity API. '
            'Pool prices from AEMO MMSDM dispatch_price_daily (Aug 2024+). '
            'Spread = avg discharge price − avg charge price. '
            'Price band data requires running import_bess_band_capture.py.'
        ),
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
