"""
Wind Value Profiles Importer
=============================
Builds a comprehensive wind value analytics dataset from:
  1. Existing performance_monthly data (CF, capture price, revenue) — 2018-present
  2. Existing dispatch_price_daily (regional pool prices) — Aug 2024-present
  3. OpenElectricity API hourly generation (for daily shape profiles)

Output: frontend/public/data/analytics/wind-value.json

Usage:
    # Full run (fetches hourly shape from OE API + computes value analytics):
    python3 pipeline/importers/import_wind_profiles.py

    # Skip OE API (compute from existing DB data only — no daily shape):
    python3 pipeline/importers/import_wind_profiles.py --skip-hourly

    # Sample mode (use fake hourly shapes — for frontend dev without API key):
    python3 pipeline/importers/import_wind_profiles.py --sample
"""

import os
import sys
import json
import math
import time
import argparse
import random
from datetime import datetime, date, timedelta
from difflib import SequenceMatcher
from urllib.request import Request, urlopen
from urllib.parse import quote
from typing import Optional, Dict, List, Any

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection

API_BASE = "https://api.openelectricity.org.au/v4"
BATCH_SIZE = 20

SEASON_MONTHS = {
    "summer": [12, 1, 2],
    "autumn": [3, 4, 5],
    "winter": [6, 7, 8],
    "spring": [9, 10, 11],
}
MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

# Region ID -> state mapping
REGION_TO_STATE = {
    "NSW1": "NSW", "QLD1": "QLD", "SA1": "SA",
    "TAS1": "TAS", "VIC1": "VIC",
}
STATE_TO_REGION = {v: k for k, v in REGION_TO_STATE.items()}


# ============================================================
# HTTP helpers
# ============================================================

def api_get(path: str, api_key: str, params: Optional[dict] = None) -> dict:
    url = f"{API_BASE}{path}"
    if params:
        parts = []
        for k, v in params.items():
            if isinstance(v, list):
                for item in v:
                    parts.append(f"{quote(k)}={quote(str(item))}")
            else:
                parts.append(f"{quote(k)}={quote(str(v))}")
        url += "?" + "&".join(parts)
    req = Request(url, headers={
        "Authorization": f"Bearer {api_key}",
        "User-Agent": "AURES/2.36 wind-profiles",
        "Accept": "application/json",
    })
    resp = urlopen(req, timeout=60)
    return json.loads(resp.read().decode())


# ============================================================
# Facility mapping (reuse pattern from import_openelectricity.py)
# ============================================================

def _normalize(name: str) -> str:
    n = name.lower()
    for suffix in [' wind farm', ' solar farm', ' solar plant', ' bess', ' battery']:
        n = n.replace(suffix, '')
    n = n.replace(' stage ', ' ').replace(' phase ', ' ').replace('_', ' ')
    return n.strip()


def build_wind_facility_map(conn, wind_projects: List[dict], oe_facilities: List[dict]) -> Dict[str, str]:
    """Return project_id -> OE facility_code for operating wind projects."""
    oe_unit_to_fac = {}
    oe_by_name = {}
    for f in oe_facilities:
        oe_by_name[_normalize(f['name'])] = f['code']
        for u in f.get('units', []):
            oe_unit_to_fac[u['code']] = f['code']

    duids = conn.execute("""
        SELECT duid, project_id FROM aemo_generation_info
        WHERE project_id IS NOT NULL AND duid IS NOT NULL
    """).fetchall()
    project_duids: Dict[str, List[str]] = {}
    for d in duids:
        project_duids.setdefault(d['project_id'], []).append(d['duid'])

    matched = {}
    for p in wind_projects:
        pid = p['id']
        oe_code = None
        for duid in project_duids.get(pid, []):
            if duid in oe_unit_to_fac:
                oe_code = oe_unit_to_fac[duid]
                break
        if not oe_code:
            pn = _normalize(p['name'])
            if pn in oe_by_name:
                oe_code = oe_by_name[pn]
            else:
                best_score, best_code = 0.0, None
                for n, code in oe_by_name.items():
                    score = SequenceMatcher(None, pn, n).ratio()
                    if score > best_score:
                        best_score, best_code = score, code
                if best_score >= 0.70:
                    oe_code = best_code
        if oe_code:
            matched[pid] = oe_code
    return matched


# ============================================================
# Hourly shape fetch
# ============================================================

def fetch_hourly_shapes(
    conn, api_key: str, wind_projects: List[dict], mapping: Dict[str, str]
) -> Dict[str, Any]:
    """
    Fetch ~12 months of hourly generation data from OE API (interval=1h, max 32 days/call)
    and aggregate into hourly-of-day shape profiles per project.

    Strategy: chunk the year into 30-day windows, batching 20 facilities per call.
    ~12 time chunks × 4 facility batches = ~48 API calls total.

    Returns: project_id -> { annual, months, seasons, data_period }
    each value is a 24-element list of CF% by hour-of-day (AEST, 0-23).
    """
    # Date range: last 360 days (keep inside free-plan 367-day limit)
    end_date = date.today() - timedelta(days=1)
    start_date = end_date - timedelta(days=359)
    date_start = start_date.strftime("%Y-%m-%d")
    date_end = end_date.strftime("%Y-%m-%d")
    print(f"  Hourly shape period: {date_start} to {date_end}")

    # Build 30-day time chunks (API max is 32 days per call for 1h interval)
    time_chunks = []
    chunk_start = date.fromisoformat(date_start)
    end_date_obj = date.fromisoformat(date_end)
    while chunk_start <= end_date_obj:
        chunk_end = min(chunk_start + timedelta(days=29), end_date_obj)
        time_chunks.append((chunk_start.isoformat(), chunk_end.isoformat()))
        chunk_start = chunk_end + timedelta(days=1)
    print(f"  Time chunks: {len(time_chunks)} × 30-day windows")

    # Build facility_code -> [project_ids] reverse map
    fac_to_projects: Dict[str, List[str]] = {}
    for pid, fcode in mapping.items():
        fac_to_projects.setdefault(fcode, []).append(pid)

    # capacity per project (for CF calculation)
    cap_by_pid = {p['id']: p['capacity_mw'] for p in wind_projects}

    # Build unit_code -> facility lookup from OE facilities
    print("  Fetching OE facility list for unit→facility lookup...")
    fac_data = api_get("/facilities/", api_key, {"network_id": "NEM", "status_id": "operating"})
    unit_to_fac: Dict[str, str] = {}
    unit_to_fueltech: Dict[str, str] = {}  # unit_code -> fueltech_id (from facility metadata)
    fac_capacity: Dict[str, float] = {}  # facility_code -> total registered capacity
    for f in fac_data.get('data', []):
        fcode = f['code']
        cap = sum(u.get('capacity_registered', 0) or 0 for u in f.get('units', []) if 'wind' in (u.get('fueltech_id') or ''))
        if cap > 0:
            fac_capacity[fcode] = cap
        for u in f.get('units', []):
            unit_to_fac[u['code']] = fcode
            unit_to_fueltech[u['code']] = u.get('fueltech_id', '')

    # Accumulate half-hourly buckets: project_id -> hour_of_day (0-23) -> month (1-12) -> [mwh values]
    # We store mwh sums and counts to compute averages later
    # Structure: pid -> { 'annual': {h: [vals]}, 'monthly': {m: {h: [vals]}} }
    buckets: Dict[str, Dict] = {}
    for pid in mapping:
        buckets[pid] = {
            'annual': {h: [] for h in range(24)},
            'monthly': {m: {h: [] for h in range(24)} for m in range(1, 13)},
        }

    facility_codes = list(set(mapping.values()))
    total_fac_batches = (len(facility_codes) + BATCH_SIZE - 1) // BATCH_SIZE
    total_calls = total_fac_batches * len(time_chunks)
    print(f"  Fetching hourly data: {len(facility_codes)} facilities × "
          f"{len(time_chunks)} time chunks = {total_calls} API calls...")

    call_num = 0
    for i in range(0, len(facility_codes), BATCH_SIZE):
        batch = facility_codes[i:i + BATCH_SIZE]
        fac_batch_num = i // BATCH_SIZE + 1

        for chunk_start_str, chunk_end_str in time_chunks:
            call_num += 1
            try:
                data = api_get("/data/facilities/NEM", api_key, {
                    "facility_code": batch,
                    "metrics": ["energy"],
                    "interval": "1h",
                    "date_start": chunk_start_str,
                    "date_end": chunk_end_str,
                })

                for series in data.get('data', []):
                    for result in series.get('results', []):
                        unit_code = result.get('columns', {}).get('unit_code', '')
                        # fueltech_id is NOT in response columns — look it up from facility metadata
                        fueltech = unit_to_fueltech.get(unit_code, '')
                        if 'wind' not in (fueltech or '').lower():
                            continue
                        fac_code = unit_to_fac.get(unit_code)
                        if not fac_code:
                            continue
                        project_ids = fac_to_projects.get(fac_code, [])
                        if not project_ids:
                            continue

                        for ts_mwh in result.get('data', []):
                            if len(ts_mwh) < 2 or ts_mwh[1] is None:
                                continue
                            ts_str, mwh = ts_mwh[0], float(ts_mwh[1])
                            if mwh < 0:
                                mwh = 0.0
                            # Parse AEST timestamp (API returns +10:00 or +11:00)
                            try:
                                base = ts_str[:19]
                                offset_str = ts_str[19:] if len(ts_str) > 19 else '+10:00'
                                sign = -1 if offset_str.startswith('-') else 1
                                off_h = int(offset_str.replace('+', '').replace('-', '').split(':')[0])
                                dt = datetime.fromisoformat(base)
                                # Convert to fixed AEST (UTC+10)
                                dt_aest = dt + timedelta(hours=sign * (10 - off_h))
                                hour = dt_aest.hour
                                month = dt_aest.month
                            except (ValueError, IndexError):
                                continue

                            for pid in project_ids:
                                buckets[pid]['annual'][hour].append(mwh)
                                buckets[pid]['monthly'][month][hour].append(mwh)

                if call_num % 10 == 0 or call_num == total_calls:
                    print(f"    {call_num}/{total_calls} calls done "
                          f"(fac batch {fac_batch_num}/{total_fac_batches}, "
                          f"chunk {chunk_start_str})")
                time.sleep(0.3)

            except Exception as e:
                print(f"    Call {call_num} FAILED ({chunk_start_str}→{chunk_end_str}): {e}")
                continue

    # Aggregate buckets to CF% profiles
    shapes: Dict[str, Any] = {}
    for pid, pid_buckets in buckets.items():
        cap = cap_by_pid.get(pid, 0)
        if not cap or cap <= 0:
            continue

        def _cf_array(hour_buckets: Dict[int, List[float]], interval_hours: float = 1.0) -> List[Optional[float]]:
            """Convert hour->mwh_values dict to 24-element CF% array."""
            result = []
            for h in range(24):
                vals = hour_buckets[h]
                if not vals:
                    result.append(None)
                else:
                    avg_mwh = sum(vals) / len(vals)
                    cf = avg_mwh / (cap * interval_hours) * 100
                    result.append(round(cf, 2))
            return result

        annual_cf = _cf_array(pid_buckets['annual'])
        monthly_cf = {}
        for m in range(1, 13):
            monthly_cf[str(m)] = _cf_array(pid_buckets['monthly'][m])

        # Seasonal (aggregate months)
        seasonal_cf: Dict[str, List[Optional[float]]] = {}
        for season, months in SEASON_MONTHS.items():
            combined: Dict[int, List[float]] = {h: [] for h in range(24)}
            for m in months:
                for h in range(24):
                    combined[h].extend(pid_buckets['monthly'].get(m, {}).get(h, []))
            seasonal_cf[season] = _cf_array(combined)

        shapes[pid] = {
            "annual": annual_cf,
            "months": monthly_cf,
            "seasons": seasonal_cf,
            "data_period": f"{date_start} to {date_end}",
        }

    print(f"  Hourly shapes computed for {len(shapes)} projects.")
    return shapes


def generate_sample_shapes(wind_projects: List[dict]) -> Dict[str, Any]:
    """Generate synthetic hourly profiles for testing without API calls."""
    shapes = {}
    for p in wind_projects:
        state = p.get('state', 'NSW')
        # Wind is relatively flat day/night with slight daytime dip and nighttime peak
        # Coastal states (SA, TAS) have stronger overnight wind
        base_cf = random.uniform(22, 38)

        def _shape(seasonal_boost: float = 0) -> List[float]:
            hourly = []
            for h in range(24):
                # Slight overnight/early-morning peak, slight daytime dip
                diurnal = -4 * math.sin((h - 14) * math.pi / 12)  # peak at ~2am
                noise = random.uniform(-2, 2)
                cf = max(5, min(70, base_cf + seasonal_boost + diurnal + noise))
                hourly.append(round(cf, 1))
            return hourly

        months = {str(m): _shape(
            seasonal_boost=(3 if m in [6, 7, 8] else -2 if m in [12, 1, 2] else 0)
        ) for m in range(1, 13)}
        seasons = {
            "summer": _shape(-3),
            "autumn": _shape(1),
            "winter": _shape(5),
            "spring": _shape(2),
        }
        annual = _shape(0)

        shapes[p['id']] = {
            "annual": annual,
            "months": months,
            "seasons": seasons,
            "data_period": "sample (not real)",
        }
    return shapes


# ============================================================
# Value analytics from DB
# ============================================================

def load_monthly_data(conn) -> Dict[str, List[dict]]:
    """Load performance_monthly for all operating wind projects."""
    rows = conn.execute("""
        SELECT pm.project_id, pm.year, pm.month,
               pm.energy_mwh, pm.capacity_factor_pct,
               pm.energy_price_received, pm.revenue_aud
        FROM performance_monthly pm
        JOIN projects p ON pm.project_id = p.id
        WHERE p.technology = 'wind' AND p.status = 'operating'
        ORDER BY pm.project_id, pm.year, pm.month
    """).fetchall()
    by_project: Dict[str, List[dict]] = {}
    for r in rows:
        pid = r['project_id']
        by_project.setdefault(pid, []).append(dict(r))
    return by_project


def load_pool_prices(conn) -> Dict[str, Dict[str, float]]:
    """
    Load dispatch_price_daily and compute monthly regional averages.
    Returns: region -> "YYYY-MM" -> avg_rrp
    """
    rows = conn.execute("""
        SELECT region,
               strftime('%Y', date) || '-' || strftime('%m', date) as ym,
               AVG(avg_rrp) as avg_price
        FROM dispatch_price_daily
        GROUP BY region, ym
    """).fetchall()
    result: Dict[str, Dict[str, float]] = {}
    for r in rows:
        region = r['region']
        result.setdefault(region, {})[r['ym']] = round(r['avg_price'], 2)
    return result


def load_wind_projects(conn) -> List[dict]:
    rows = conn.execute("""
        SELECT id, name, technology, capacity_mw, state, cod_current
        FROM projects
        WHERE technology = 'wind' AND status = 'operating'
        AND capacity_mw >= 5
        ORDER BY capacity_mw DESC
    """).fetchall()
    return [dict(r) for r in rows]


def compute_monthly_cf_stddev(monthly_data: List[dict]) -> float:
    """Annualised standard deviation of monthly CF across years."""
    cf_vals = [m['capacity_factor_pct'] for m in monthly_data if m.get('capacity_factor_pct') is not None]
    if len(cf_vals) < 3:
        return 0.0
    mean = sum(cf_vals) / len(cf_vals)
    variance = sum((v - mean) ** 2 for v in cf_vals) / len(cf_vals)
    return round(math.sqrt(variance), 2)


def get_season(month: int) -> str:
    for s, months in SEASON_MONTHS.items():
        if month in months:
            return s
    return "unknown"


def compute_project_analytics(
    project: dict,
    monthly: List[dict],
    pool_prices: Dict[str, Dict[str, float]],
) -> dict:
    """Compute all value metrics for one wind project."""
    pid = project['id']
    state = project['state']
    cap = project['capacity_mw']
    region = STATE_TO_REGION.get(state, "NSW1")

    # ---- monthly enriched (add pool_price, value_factor) ----
    monthly_enriched = []
    for m in monthly:
        ym = f"{m['year']}-{m['month']:02d}"
        pool_p = pool_prices.get(region, {}).get(ym)
        cf = m.get('capacity_factor_pct')
        cap_price = m.get('energy_price_received')
        vf = round(cap_price / pool_p, 3) if (cap_price and pool_p and pool_p > 0) else None
        monthly_enriched.append({
            "year": m['year'],
            "month": m['month'],
            "cf_pct": cf,
            "capture_price": round(cap_price, 2) if cap_price else None,
            "energy_mwh": round(m['energy_mwh'], 0) if m.get('energy_mwh') else None,
            "revenue_aud": round(m['revenue_aud'], 0) if m.get('revenue_aud') else None,
            "pool_price": round(pool_p, 2) if pool_p else None,
            "value_factor": vf,
        })

    # ---- annual summary ----
    years_map: Dict[int, List[dict]] = {}
    for m in monthly_enriched:
        years_map.setdefault(m['year'], []).append(m)

    annual_data = []
    for y in sorted(years_map.keys()):
        entries = years_map[y]
        n = len(entries)
        if n < 6:
            continue  # skip incomplete years
        total_e = sum(e['energy_mwh'] or 0 for e in entries)
        total_r = sum(e['revenue_aud'] or 0 for e in entries)
        avg_cf = sum(e['cf_pct'] or 0 for e in entries) / n
        # capture price = revenue / energy (more accurate than avg of monthly)
        cap_p = total_r / total_e if total_e > 0 else None
        annual_data.append({
            "year": y,
            "months": n,
            "cf_pct": round(avg_cf, 2),
            "capture_price": round(cap_p, 2) if cap_p else None,
            "energy_mwh": round(total_e, 0),
            "revenue_aud": round(total_r, 0),
            "revenue_per_mw": round(total_r / cap, 0) if cap > 0 else None,
        })

    # ---- seasonal averages ----
    seasonal_buckets: Dict[str, Dict[str, List]] = {
        s: {"cf": [], "capture_price": [], "energy_mwh": [], "revenue_aud": [], "value_factor": []}
        for s in SEASON_MONTHS
    }
    for m in monthly_enriched:
        season = get_season(m['month'])
        b = seasonal_buckets[season]
        if m['cf_pct'] is not None:
            b['cf'].append(m['cf_pct'])
        if m['capture_price'] is not None:
            b['capture_price'].append(m['capture_price'])
        if m['energy_mwh'] is not None:
            b['energy_mwh'].append(m['energy_mwh'])
        if m['revenue_aud'] is not None:
            b['revenue_aud'].append(m['revenue_aud'])
        if m['value_factor'] is not None:
            b['value_factor'].append(m['value_factor'])

    total_energy_all = sum(m['energy_mwh'] or 0 for m in monthly_enriched)
    seasonal_averages = {}
    for season, b in seasonal_buckets.items():
        avg_cf = round(sum(b['cf']) / len(b['cf']), 2) if b['cf'] else None
        avg_cp = round(sum(b['capture_price']) / len(b['capture_price']), 2) if b['capture_price'] else None
        avg_vf = round(sum(b['value_factor']) / len(b['value_factor']), 3) if b['value_factor'] else None
        season_energy = sum(b['energy_mwh'])
        pct_annual = round(season_energy / total_energy_all * 100, 1) if total_energy_all > 0 else None
        seasonal_averages[season] = {
            "months": SEASON_MONTHS[season],
            "avg_cf_pct": avg_cf,
            "avg_capture_price": avg_cp,
            "avg_value_factor": avg_vf,
            "pct_of_annual_energy": pct_annual,
        }

    # ---- monthly averages (averaged across years) ----
    monthly_avg_buckets: Dict[int, Dict[str, List]] = {m: {"cf": [], "cp": [], "vf": []} for m in range(1, 13)}
    for m in monthly_enriched:
        mo = m['month']
        if m['cf_pct'] is not None:
            monthly_avg_buckets[mo]['cf'].append(m['cf_pct'])
        if m['capture_price'] is not None:
            monthly_avg_buckets[mo]['cp'].append(m['capture_price'])
        if m['value_factor'] is not None:
            monthly_avg_buckets[mo]['vf'].append(m['value_factor'])
    monthly_averages = {}
    for mo, b in monthly_avg_buckets.items():
        monthly_averages[str(mo)] = {
            "label": MONTH_LABELS[mo - 1],
            "avg_cf_pct": round(sum(b['cf']) / len(b['cf']), 2) if b['cf'] else None,
            "avg_capture_price": round(sum(b['cp']) / len(b['cp']), 2) if b['cp'] else None,
            "avg_value_factor": round(sum(b['vf']) / len(b['vf']), 3) if b['vf'] else None,
        }

    # ---- value summary ----
    all_cf = [m['cf_pct'] for m in monthly_enriched if m['cf_pct'] is not None]
    all_cp = [m['capture_price'] for m in monthly_enriched if m['capture_price'] is not None]
    all_vf = [m['value_factor'] for m in monthly_enriched if m['value_factor'] is not None]
    all_annual_cf = [a['cf_pct'] for a in annual_data]
    all_annual_r = [a['revenue_per_mw'] for a in annual_data if a['revenue_per_mw']]

    avg_cf = round(sum(all_cf) / len(all_cf), 2) if all_cf else None
    avg_cp = round(sum(all_cp) / len(all_cp), 2) if all_cp else None
    avg_vf = round(sum(all_vf) / len(all_vf), 3) if all_vf else None

    # CF trend: compare first 3 years vs last 3 years average
    cf_trend = "stable"
    if len(annual_data) >= 4:
        first_avg = sum(a['cf_pct'] for a in annual_data[:3]) / 3
        last_avg = sum(a['cf_pct'] for a in annual_data[-3:]) / 3
        delta = last_avg - first_avg
        if delta > 2:
            cf_trend = "improving"
        elif delta < -2:
            cf_trend = "declining"

    # Best/worst capture price month (averaged across years)
    cp_by_month = [
        (mo, monthly_averages[str(mo)]['avg_capture_price'])
        for mo in range(1, 13)
        if monthly_averages[str(mo)]['avg_capture_price'] is not None
    ]
    best_cp_month = max(cp_by_month, key=lambda x: x[1])[0] if cp_by_month else None
    worst_cp_month = min(cp_by_month, key=lambda x: x[1])[0] if cp_by_month else None
    best_cf_month = max(cp_by_month, key=lambda x: (
        monthly_averages[str(x[0])].get('avg_cf_pct') or 0
    ))[0] if cp_by_month else None

    # Annual CF variability
    cf_variability = None
    if len(all_annual_cf) >= 3:
        mean = sum(all_annual_cf) / len(all_annual_cf)
        var = sum((v - mean) ** 2 for v in all_annual_cf) / len(all_annual_cf)
        cf_variability = round(math.sqrt(var), 2)

    latest_year_r_mw = annual_data[-1]['revenue_per_mw'] if annual_data else None

    # ---- data completeness & ramp-up detection ----
    commissioning_year = None
    if project.get('cod_current'):
        try:
            commissioning_year = int(str(project['cod_current'])[:4])
        except (ValueError, TypeError):
            pass

    # Ramp-up year: first data year CF < 40% of subsequent-years avg (or < 8% absolute)
    # Typical cause: farm commissioned mid-year or turbines rolled out progressively
    ramp_year: Optional[int] = None
    ramp_year_cf: Optional[float] = None
    if len(annual_data) >= 2:
        first = annual_data[0]
        rest_cf = [a['cf_pct'] for a in annual_data[1:] if a['cf_pct'] is not None]
        if rest_cf and first.get('cf_pct') is not None:
            rest_avg = sum(rest_cf) / len(rest_cf)
            threshold = min(rest_avg * 0.40, 8.0)
            if first['cf_pct'] < threshold:
                ramp_year = first['year']
                ramp_year_cf = first['cf_pct']

    # Clean averages excluding ramp year
    clean_monthly = [m for m in monthly_enriched if m['year'] != ramp_year]
    clean_annual = [a for a in annual_data if a['year'] != ramp_year]
    clean_cf_vals = [m['cf_pct'] for m in clean_monthly if m['cf_pct'] is not None]
    avg_cf_excl_ramp = round(sum(clean_cf_vals) / len(clean_cf_vals), 2) if clean_cf_vals else avg_cf

    current_year = date.today().year
    years_since_cod = (current_year - commissioning_year) if commissioning_year else None
    # How many full calendar years of clean data vs age of farm
    data_completeness_pct: Optional[float] = None
    if years_since_cod and years_since_cod > 0:
        data_completeness_pct = round(min(len(annual_data) / years_since_cod * 100, 100), 0)

    data_years_clean = len(clean_annual)
    data_confidence = 'low' if data_years_clean < 1 else ('medium' if data_years_clean < 3 else 'high')

    value_summary = {
        "avg_cf_pct": avg_cf,
        "avg_capture_price": avg_cp,
        "avg_value_factor": avg_vf,
        "cf_trend": cf_trend,
        "best_capture_month": best_cp_month,
        "worst_capture_month": worst_cp_month,
        "best_cf_month": best_cf_month,
        "annual_cf_variability": cf_variability,
        "latest_revenue_per_mw": latest_year_r_mw,
        "data_years": len(annual_data),
        "data_first_year": annual_data[0]['year'] if annual_data else None,
        "data_last_year": annual_data[-1]['year'] if annual_data else None,
        # completeness metadata
        "commissioning_year": commissioning_year,
        "data_months_available": len(monthly_enriched),
        "data_years_clean": data_years_clean,
        "ramp_year": ramp_year,
        "ramp_year_cf_pct": ramp_year_cf,
        "avg_cf_excl_ramp": avg_cf_excl_ramp,
        "data_completeness_pct": data_completeness_pct,
        "years_since_cod": years_since_cod,
        "data_confidence": data_confidence,
    }

    return {
        "id": pid,
        "name": project['name'],
        "state": state,
        "capacity_mw": cap,
        "cod": project.get('cod_current'),
        "monthly_data": monthly_enriched,
        "annual_data": annual_data,
        "seasonal_averages": seasonal_averages,
        "monthly_averages": monthly_averages,
        "value_summary": value_summary,
        "hourly_shape": None,  # populated later by hourly fetch
        "state_rank": None,    # populated later by compute_rankings
        "pros_cons": None,     # populated later by generate_pros_cons
    }


# ============================================================
# State averages and rankings
# ============================================================

def compute_state_averages(projects_analytics: Dict[str, dict]) -> Dict[str, dict]:
    """Compute state-level benchmark statistics."""
    state_buckets: Dict[str, Dict[str, List]] = {}
    for pid, pa in projects_analytics.items():
        s = pa['state']
        vs = pa['value_summary']
        state_buckets.setdefault(s, {
            "cf": [], "capture_price": [], "value_factor": [],
            "revenue_per_mw": [], "variability": [],
        })
        b = state_buckets[s]
        if vs.get('avg_cf_pct'): b['cf'].append(vs['avg_cf_pct'])
        if vs.get('avg_capture_price'): b['capture_price'].append(vs['avg_capture_price'])
        if vs.get('avg_value_factor'): b['value_factor'].append(vs['avg_value_factor'])
        if vs.get('latest_revenue_per_mw'): b['revenue_per_mw'].append(vs['latest_revenue_per_mw'])
        if vs.get('annual_cf_variability'): b['variability'].append(vs['annual_cf_variability'])

    result = {}
    for state, b in state_buckets.items():
        def avg_list(lst):
            return round(sum(lst) / len(lst), 2) if lst else None
        def med_list(lst):
            if not lst: return None
            s = sorted(lst)
            n = len(s)
            return round((s[n // 2] + s[(n - 1) // 2]) / 2, 2)
        result[state] = {
            "wind_count": len(b['cf']),
            "avg_cf_pct": avg_list(b['cf']),
            "median_cf_pct": med_list(b['cf']),
            "avg_capture_price": avg_list(b['capture_price']),
            "avg_value_factor": avg_list(b['value_factor']),
            "avg_revenue_per_mw": avg_list(b['revenue_per_mw']),
        }
    return result


def compute_rankings(projects_analytics: Dict[str, dict], state_averages: Dict[str, dict]) -> None:
    """Add state_rank to each project in-place."""
    # Group by state
    by_state: Dict[str, List[str]] = {}
    for pid, pa in projects_analytics.items():
        by_state.setdefault(pa['state'], []).append(pid)

    for state, pids in by_state.items():
        # Sort by CF descending → rank 1 = best CF
        cf_sorted = sorted(pids,
            key=lambda p: projects_analytics[p]['value_summary'].get('avg_cf_pct') or 0,
            reverse=True)
        cp_sorted = sorted(pids,
            key=lambda p: projects_analytics[p]['value_summary'].get('avg_capture_price') or 0,
            reverse=True)
        rv_sorted = sorted(pids,
            key=lambda p: projects_analytics[p]['value_summary'].get('latest_revenue_per_mw') or 0,
            reverse=True)
        n = len(pids)
        for pid in pids:
            cf_rank = cf_sorted.index(pid) + 1
            cp_rank = cp_sorted.index(pid) + 1
            rv_rank = rv_sorted.index(pid) + 1
            projects_analytics[pid]['state_rank'] = {
                "cf_rank": cf_rank,
                "cf_total": n,
                "cf_percentile": round((n - cf_rank) / n * 100),
                "capture_price_rank": cp_rank,
                "capture_price_total": n,
                "capture_price_percentile": round((n - cp_rank) / n * 100),
                "revenue_per_mw_rank": rv_rank,
                "revenue_per_mw_total": n,
            }


# ============================================================
# Pros / Cons generator
# ============================================================

def generate_pros_cons(pa: dict, state_avg: Optional[dict]) -> dict:
    """Generate textual valuation insights with pros and cons."""
    pros: List[str] = []
    cons: List[str] = []
    score = 3.0

    vs = pa['value_summary']
    sr = pa.get('state_rank') or {}
    sa = pa.get('seasonal_averages') or {}
    state = pa['state']
    name = pa['name']
    cap = pa.get('capacity_mw', 0)

    avg_cf = vs.get('avg_cf_pct')
    avg_cp = vs.get('avg_capture_price')
    avg_vf = vs.get('avg_value_factor')
    cf_trend = vs.get('cf_trend', 'stable')
    cf_var = vs.get('annual_cf_variability')
    data_years = vs.get('data_years', 0)
    state_avg_cf = state_avg.get('avg_cf_pct') if state_avg else None
    state_avg_cp = state_avg.get('avg_capture_price') if state_avg else None

    # CF vs state peer
    if avg_cf and state_avg_cf:
        diff = avg_cf - state_avg_cf
        if diff >= 5:
            pros.append(
                f"Above-average capacity factor ({avg_cf:.1f}% vs {state_avg_cf:.1f}% state avg) — "
                f"stronger volume output increases total energy sold"
            )
            score += 0.5
        elif diff <= -4:
            cons.append(
                f"Below-average capacity factor ({avg_cf:.1f}% vs {state_avg_cf:.1f}% state avg) — "
                f"lower volume reduces total revenue, particularly for fixed-cost projects"
            )
            score -= 0.4

    # Capture price vs state avg
    if avg_cp and state_avg_cp:
        diff_cp = avg_cp - state_avg_cp
        if diff_cp >= 8:
            pros.append(
                f"Captures a premium price (${avg_cp:.0f}/MWh vs ${state_avg_cp:.0f}/MWh state avg) — "
                f"location or dispatch timing reduces cannibalisation impact"
            )
            score += 0.5
        elif diff_cp <= -8:
            cons.append(
                f"Below-average capture price (${avg_cp:.0f}/MWh vs ${state_avg_cp:.0f}/MWh state avg) — "
                f"high wind penetration in {state} drives down prices when this farm generates"
            )
            score -= 0.5

    # Value factor
    if avg_vf is not None:
        if avg_vf >= 0.95:
            pros.append(
                f"High value factor ({avg_vf:.2f}) — output timing aligns well with price periods, "
                f"capturing close to full pool price on average"
            )
            score += 0.3
        elif avg_vf <= 0.70:
            cons.append(
                f"Low value factor ({avg_vf:.2f}) — wind is generating heavily during low-price periods, "
                f"a structural risk that worsens as {state} adds more wind capacity"
            )
            score -= 0.5

    # CF trend
    if data_years >= 5:
        if cf_trend == "improving":
            pros.append(
                "Capacity factor trend is improving over time — suggests good maintenance regime "
                "or improving local wind conditions"
            )
            score += 0.3
        elif cf_trend == "declining":
            cons.append(
                "Capacity factor trending lower over recent years — possible equipment ageing, "
                "increased curtailment, or deteriorating dispatch conditions as the region fills with wind"
            )
            score -= 0.4

    # CF variability (year-to-year)
    if cf_var is not None:
        if cf_var >= 5:
            cons.append(
                f"High year-to-year CF variability (±{cf_var:.1f}%) — revenue is harder to forecast, "
                f"which increases financing risk and PPA pricing margin requirements"
            )
            score -= 0.2

    # Seasonal analysis
    winter_cf = sa.get('winter', {}).get('avg_cf_pct')
    summer_cf = sa.get('summer', {}).get('avg_cf_pct')
    winter_cp = sa.get('winter', {}).get('avg_capture_price')
    summer_cp = sa.get('summer', {}).get('avg_capture_price')
    winter_energy_pct = sa.get('winter', {}).get('pct_of_annual_energy')

    if winter_cf and summer_cf and winter_cf > summer_cf + 8:
        pros.append(
            f"Strong winter bias (CF {winter_cf:.1f}% winter vs {summer_cf:.1f}% summer) — "
            f"winter typically has higher NEM spot prices, improving revenue timing"
        )
        score += 0.3

    if winter_cp and summer_cp and winter_cp > summer_cp + 15:
        pros.append(
            f"Revenue concentrated in high-price seasons (${winter_cp:.0f}/MWh winter vs "
            f"${summer_cp:.0f}/MWh summer) — strong seasonal revenue alignment"
        )
        score += 0.2

    # Best/worst month insights
    best_cp_m = vs.get('best_capture_month')
    worst_cp_m = vs.get('worst_capture_month')
    if best_cp_m and worst_cp_m:
        best_label = MONTH_LABELS[best_cp_m - 1]
        worst_label = MONTH_LABELS[worst_cp_m - 1]
        best_data = pa.get('monthly_averages', {}).get(str(best_cp_m), {})
        worst_data = pa.get('monthly_averages', {}).get(str(worst_cp_m), {})
        best_price = best_data.get('avg_capture_price')
        worst_price = worst_data.get('avg_capture_price')
        if best_price and worst_price and (best_price - worst_price) > 40:
            cons.append(
                f"Wide intra-year price spread ({worst_label} ${worst_price:.0f}/MWh vs "
                f"{best_label} ${best_price:.0f}/MWh) — revenue is concentrated in a few months, "
                f"increasing cashflow luminess"
            )

    # Scale / importance
    if cap >= 300:
        pros.append(
            f"Large-scale project ({cap:.0f} MW) — benefits from economies of scale in O&M, "
            f"stronger grid connection and potentially better PPA terms"
        )
        score += 0.1
    elif cap < 50:
        cons.append(
            f"Small project ({cap:.0f} MW) — higher per-MW overhead costs and less pricing power "
            f"in merchant market or PPA negotiations"
        )
        score -= 0.1

    # SA-specific structural warning
    if state == "SA":
        cons.append(
            "South Australia has the highest wind penetration in the NEM (~70% annual wind share) — "
            "structural cannibalisation risk will increase as more wind is added; "
            "value factor may continue declining"
        )

    # Peer rankings
    cf_pct = sr.get('cf_percentile')
    cp_pct = sr.get('capture_price_percentile')
    if cf_pct is not None and cf_pct >= 75:
        pros.append(
            f"Top quartile capacity factor in {state} (#{sr.get('cf_rank')} of "
            f"{sr.get('cf_total')} wind farms) — consistently strong wind resource"
        )
    if cp_pct is not None and cp_pct >= 75:
        pros.append(
            f"Top quartile capture price in {state} (#{sr.get('capture_price_rank')} of "
            f"{sr.get('capture_price_total')} wind farms) — favourable market positioning"
        )
    if cp_pct is not None and cp_pct <= 25:
        cons.append(
            f"Bottom quartile capture price in {state} (#{sr.get('capture_price_rank')} of "
            f"{sr.get('capture_price_total')} wind farms) — most exposed to cannibalisation in its peer group"
        )

    # Data quality note
    if data_years < 3:
        cons.append(
            f"Limited operating history ({data_years} {'year' if data_years == 1 else 'years'} of data) — "
            f"performance estimates are less reliable; use with caution"
        )

    score = round(max(1.0, min(5.0, score)), 1)

    # Letter grade
    if score >= 4.5:
        grade = "A+"
    elif score >= 4.0:
        grade = "A"
    elif score >= 3.5:
        grade = "B+"
    elif score >= 3.0:
        grade = "B"
    elif score >= 2.5:
        grade = "C+"
    elif score >= 2.0:
        grade = "C"
    else:
        grade = "D"

    return {"pros": pros, "cons": cons, "score": score, "grade": grade}


# ============================================================
# Main
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="Import wind value profiles")
    parser.add_argument("--skip-hourly", action="store_true",
                        help="Skip OE API calls — compute from existing DB data only")
    parser.add_argument("--sample", action="store_true",
                        help="Use synthetic hourly shapes (no API key needed)")
    args = parser.parse_args()

    conn = get_connection()

    print("=== Wind Value Profiles Importer ===")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Load base data
    print("\n[1] Loading operating wind projects...")
    wind_projects = load_wind_projects(conn)
    print(f"    {len(wind_projects)} operating wind projects found")

    print("\n[2] Loading monthly performance data...")
    monthly_by_project = load_monthly_data(conn)
    n_projects_with_data = sum(1 for p in wind_projects if p['id'] in monthly_by_project)
    print(f"    Monthly data available for {n_projects_with_data}/{len(wind_projects)} projects")

    print("\n[3] Loading regional pool prices...")
    pool_prices = load_pool_prices(conn)
    total_months = sum(len(v) for v in pool_prices.values())
    print(f"    {total_months} region-months of pool price data")

    print("\n[4] Computing project value analytics...")
    projects_analytics: Dict[str, dict] = {}
    for p in wind_projects:
        monthly = monthly_by_project.get(p['id'], [])
        if not monthly:
            print(f"    SKIP {p['name']} — no monthly data")
            continue
        pa = compute_project_analytics(p, monthly, pool_prices)
        projects_analytics[p['id']] = pa
    print(f"    Computed analytics for {len(projects_analytics)} projects")

    print("\n[5] Computing state averages and rankings...")
    state_averages = compute_state_averages(projects_analytics)
    compute_rankings(projects_analytics, state_averages)
    for state, sa in state_averages.items():
        print(f"    {state}: {sa['wind_count']} projects, "
              f"avg CF {sa['avg_cf_pct']}%, "
              f"avg capture ${sa['avg_capture_price']}/MWh")

    print("\n[6] Generating pros/cons insights...")
    for pid, pa in projects_analytics.items():
        state = pa['state']
        pa['pros_cons'] = generate_pros_cons(pa, state_averages.get(state))

    # ---- Hourly shapes ----
    shapes: Dict[str, Any] = {}
    if args.sample:
        print("\n[7] Generating synthetic hourly shapes (sample mode)...")
        shapes = generate_sample_shapes(wind_projects)
    elif args.skip_hourly:
        print("\n[7] Skipping hourly shape fetch (--skip-hourly)")
    else:
        api_key = os.environ.get('OPENELECTRICITY_API_KEY')
        if not api_key:
            print("\n[7] WARNING: OPENELECTRICITY_API_KEY not set — skipping hourly shapes")
            print("    Run with --sample to generate synthetic shapes for testing")
        else:
            print("\n[7] Fetching hourly shapes from OpenElectricity API...")
            try:
                me = api_get("/me", api_key)
                remaining = (me.get('data', {}).get('credits', {}).get('remaining')
                             or me.get('data', {}).get('meta', {}).get('remaining', 0))
                print(f"    API quota remaining: {remaining}")
                if remaining < 20:
                    print("    WARNING: Low API quota, skipping hourly fetch")
                else:
                    fac_data = api_get("/facilities/", api_key, {
                        "network_id": "NEM", "status_id": "operating"
                    })
                    oe_facilities = fac_data.get('data', [])
                    mapping = build_wind_facility_map(conn, wind_projects, oe_facilities)
                    print(f"    Facility mapping: {len(mapping)}/{len(wind_projects)} wind projects matched")
                    shapes = fetch_hourly_shapes(conn, api_key, wind_projects, mapping)
            except Exception as e:
                print(f"    Hourly fetch failed: {e}")
                print("    Continuing without hourly shapes...")

    # Merge shapes into analytics
    for pid in projects_analytics:
        if pid in shapes:
            projects_analytics[pid]['hourly_shape'] = shapes[pid]

    # ---- Build regional pool price summary ----
    pool_price_summary: Dict[str, Dict[str, float]] = {}
    for region, months_map in pool_prices.items():
        pool_price_summary[region] = {ym: v for ym, v in sorted(months_map.items())}

    # ---- Output ----
    output_path = os.path.join(
        os.path.dirname(__file__), '..', '..',
        'frontend', 'public', 'data', 'analytics', 'wind-value.json'
    )
    output_path = os.path.normpath(output_path)

    print(f"\n[8] Writing {output_path}...")
    output = {
        "generated_at": date.today().isoformat(),
        "data_note": (
            "Value analytics sourced from OpenElectricity API (performance_monthly). "
            "Pool prices from AEMO MMSDM dispatch_price_daily (Aug 2024 onward). "
            "Hourly shape profiles from OpenElectricity 1-hour facility dispatch data."
        ),
        "pool_prices": pool_price_summary,
        "state_averages": state_averages,
        "projects": projects_analytics,
    }
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)

    size_kb = os.path.getsize(output_path) // 1024
    print(f"    Written {size_kb} KB — {len(projects_analytics)} projects")
    print(f"\nDone. {datetime.now().strftime('%H:%M:%S')}")


if __name__ == "__main__":
    main()
