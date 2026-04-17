"""Import NEM-wide + per-state battery power data at 5-minute resolution
from the OpenElectricity v4 API, compute daily aggregates, and update
battery records.

Used by v2.28.0 'Battery Records + Live Activity' feature on
/intelligence/bess-portfolio.

Data model — no raw 5-minute storage (would explode DB size). Instead:
  - `battery_daily_scada`  — one row per (date, region) with total MWh
    discharged + charged, peak 5-min discharge/charge MW, and time of
    each peak.
  - `battery_records`      — one row per (metric, region) holding the
    all-time record: max_discharge_5min, max_charge_5min,
    max_daily_discharge, max_daily_charge. Updated incrementally.

Usage:
    # Pull last 30 days (recommended for first run after schema)
    python3 pipeline/importers/import_battery_scada.py --days 30

    # Pull last 7 days (incremental catch-up)
    python3 pipeline/importers/import_battery_scada.py --days 7

    # Pull a specific historical range
    python3 pipeline/importers/import_battery_scada.py \\
        --date-start 2025-01-01 --date-end 2025-12-31

Requires:
    - OPENELECTRICITY_API_KEY environment variable (free plan works;
      this importer is efficient: 1 request per month of history since
      we use network-level aggregated endpoint).
"""
from __future__ import annotations

import argparse
import json
import os
import sqlite3
import sys
from datetime import date, datetime, timedelta
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection  # type: ignore

API_BASE = 'https://api.openelectricity.org.au/v4'

REGIONS = ['NSW1', 'VIC1', 'QLD1', 'SA1', 'TAS1']


# ---------------------------------------------------------------------
# HTTP helper (same style as import_openelectricity.py)
# ---------------------------------------------------------------------

def api_get(path: str, api_key: str, params: dict | None = None):
    url = f'{API_BASE}{path}'
    if params:
        parts = []
        for k, v in params.items():
            if isinstance(v, list):
                for item in v:
                    parts.append(f'{quote(k)}={quote(str(item))}')
            else:
                parts.append(f'{quote(k)}={quote(str(v))}')
        url += '?' + '&'.join(parts)
    req = Request(url, headers={
        'Authorization': f'Bearer {api_key}',
        'Accept': 'application/json',
        'User-Agent': 'AURES/2.28 (battery scada importer)',
    })
    with urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())


# ---------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------

def ensure_schema(conn: sqlite3.Connection):
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS battery_daily_scada (
            id                    INTEGER PRIMARY KEY AUTOINCREMENT,
            settlement_date       TEXT NOT NULL,
            region                TEXT NOT NULL,
            discharged_mwh        REAL DEFAULT 0,
            charged_mwh           REAL DEFAULT 0,
            peak_discharge_mw     REAL,
            peak_charge_mw        REAL,
            peak_discharge_time   TEXT,
            peak_charge_time      TEXT,
            intervals_counted     INTEGER,
            created_at            TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(settlement_date, region)
        );
        CREATE INDEX IF NOT EXISTS idx_bat_daily_region ON battery_daily_scada(region);
        CREATE INDEX IF NOT EXISTS idx_bat_daily_date ON battery_daily_scada(settlement_date);

        CREATE TABLE IF NOT EXISTS battery_records (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            metric            TEXT NOT NULL,
            region            TEXT NOT NULL,
            value             REAL NOT NULL,
            unit              TEXT,
            recorded_at       TEXT,
            settlement_date   TEXT,
            details           TEXT,
            updated_at        TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(metric, region)
        );
        CREATE INDEX IF NOT EXISTS idx_bat_rec_region ON battery_records(region);
    """)


# ---------------------------------------------------------------------
# API query
# ---------------------------------------------------------------------

def fetch_network_battery_power(api_key: str, date_start: str, date_end: str):
    """Pull NEM + per-region 5-minute battery power data from OpenElectricity.

    Uses the `/data/network/NEM` endpoint with:
      metrics=power
      interval=5m
      primary_grouping=network_region
      secondary_grouping=fueltech
      fueltech=battery_charging,battery_discharging

    Returns the raw API response dict.
    """
    params = {
        'metrics': 'power',
        'interval': '5m',
        'primary_grouping': 'network_region',
        'secondary_grouping': 'fueltech',
        'fueltech': ['battery_charging', 'battery_discharging'],
        'date_start': date_start,
        'date_end': date_end,
    }
    print(f'  GET /data/network/NEM  {date_start} → {date_end}')
    return api_get('/data/network/NEM', api_key, params)


def parse_series(resp: dict):
    """Iterate the OE response and yield (region, fueltech, datetime, power_mw)."""
    data = resp.get('data') if isinstance(resp, dict) else None
    if not data:
        return
    for entry in data:
        region = entry.get('columns', {}).get('network_region') or entry.get('network_region')
        fueltech = entry.get('columns', {}).get('fueltech') or entry.get('fueltech')
        if not region or not fueltech:
            continue
        results = entry.get('results') or entry.get('data') or []
        for point in results:
            # API may return [timestamp, value] pairs or {date, value} objects
            if isinstance(point, list) and len(point) >= 2:
                ts, val = point[0], point[1]
            elif isinstance(point, dict):
                ts = point.get('date') or point.get('timestamp') or point.get('interval')
                val = point.get('value') or point.get('v')
            else:
                continue
            if ts is None or val is None:
                continue
            try:
                val_f = float(val)
            except (TypeError, ValueError):
                continue
            yield region, fueltech, ts, val_f


# ---------------------------------------------------------------------
# Aggregation
# ---------------------------------------------------------------------

def aggregate_daily(series):
    """Given a list of (region, fueltech, ts, mw) points, compute daily
    aggregates keyed by (date, region). Region 'NEM' is synthesised by
    summing all five NEM regions at each interval.
    """
    # Pivot by (ts, region, fueltech) → mw so we can build NEM totals
    per_interval: dict[tuple[str, str, str], float] = {}
    for region, fueltech, ts, mw in series:
        per_interval[(ts, region, fueltech)] = mw

    # Synthesise NEM per interval
    timestamps = sorted({k[0] for k in per_interval})
    for ts in timestamps:
        for ft in ('battery_charging', 'battery_discharging'):
            total = sum(
                per_interval.get((ts, r, ft), 0.0) for r in REGIONS
            )
            per_interval[(ts, 'NEM', ft)] = total

    # Daily aggregates per (date, region)
    agg: dict[tuple[str, str], dict] = {}
    for (ts, region, ft), mw in per_interval.items():
        # Parse ts to date and datetime — accept ISO with or without 'Z'
        try:
            dt = datetime.fromisoformat(ts.replace('Z', '+00:00')) if isinstance(ts, str) else ts
        except Exception:
            continue
        d = dt.date().isoformat()
        key = (d, region)
        bucket = agg.setdefault(key, {
            'discharged_mwh': 0.0,
            'charged_mwh': 0.0,
            'peak_discharge_mw': 0.0,
            'peak_charge_mw': 0.0,
            'peak_discharge_time': None,
            'peak_charge_time': None,
            'intervals': 0,
        })
        bucket['intervals'] += 1
        # 5-min interval = 1/12 hour → MWh = MW / 12
        if ft == 'battery_discharging':
            bucket['discharged_mwh'] += mw / 12.0
            if mw > (bucket['peak_discharge_mw'] or 0.0):
                bucket['peak_discharge_mw'] = mw
                bucket['peak_discharge_time'] = dt.isoformat()
        elif ft == 'battery_charging':
            bucket['charged_mwh'] += mw / 12.0
            if mw > (bucket['peak_charge_mw'] or 0.0):
                bucket['peak_charge_mw'] = mw
                bucket['peak_charge_time'] = dt.isoformat()
    return agg


def upsert_daily(conn, agg):
    cur = conn.cursor()
    n = 0
    for (d, region), data in agg.items():
        cur.execute("""
            INSERT INTO battery_daily_scada
              (settlement_date, region, discharged_mwh, charged_mwh,
               peak_discharge_mw, peak_charge_mw,
               peak_discharge_time, peak_charge_time, intervals_counted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(settlement_date, region) DO UPDATE SET
                discharged_mwh = excluded.discharged_mwh,
                charged_mwh = excluded.charged_mwh,
                peak_discharge_mw = excluded.peak_discharge_mw,
                peak_charge_mw = excluded.peak_charge_mw,
                peak_discharge_time = excluded.peak_discharge_time,
                peak_charge_time = excluded.peak_charge_time,
                intervals_counted = excluded.intervals_counted,
                created_at = datetime('now')
        """, (
            d, region, data['discharged_mwh'], data['charged_mwh'],
            data['peak_discharge_mw'], data['peak_charge_mw'],
            data['peak_discharge_time'], data['peak_charge_time'],
            data['intervals'],
        ))
        n += 1
    conn.commit()
    return n


# ---------------------------------------------------------------------
# Records recomputation
# ---------------------------------------------------------------------

def recompute_records(conn: sqlite3.Connection):
    """Refresh the battery_records table by scanning battery_daily_scada."""
    cur = conn.cursor()
    cur.execute('DELETE FROM battery_records')

    # Max single-interval records come from the peak_*_mw columns
    cur.execute("""
        INSERT INTO battery_records (metric, region, value, unit, recorded_at, settlement_date, details)
        SELECT 'max_discharge_5min' AS metric,
               region,
               MAX(peak_discharge_mw) AS value,
               'MW' AS unit,
               (SELECT peak_discharge_time FROM battery_daily_scada AS b2
                WHERE b2.region = b1.region
                  AND b2.peak_discharge_mw = MAX(b1.peak_discharge_mw)
                LIMIT 1) AS recorded_at,
               (SELECT settlement_date FROM battery_daily_scada AS b2
                WHERE b2.region = b1.region
                  AND b2.peak_discharge_mw = MAX(b1.peak_discharge_mw)
                LIMIT 1) AS settlement_date,
               NULL AS details
        FROM battery_daily_scada AS b1
        WHERE peak_discharge_mw IS NOT NULL
        GROUP BY region
    """)
    cur.execute("""
        INSERT INTO battery_records (metric, region, value, unit, recorded_at, settlement_date, details)
        SELECT 'max_charge_5min',
               region,
               MAX(peak_charge_mw),
               'MW',
               (SELECT peak_charge_time FROM battery_daily_scada AS b2
                WHERE b2.region = b1.region
                  AND b2.peak_charge_mw = MAX(b1.peak_charge_mw)
                LIMIT 1),
               (SELECT settlement_date FROM battery_daily_scada AS b2
                WHERE b2.region = b1.region
                  AND b2.peak_charge_mw = MAX(b1.peak_charge_mw)
                LIMIT 1),
               NULL
        FROM battery_daily_scada AS b1
        WHERE peak_charge_mw IS NOT NULL
        GROUP BY region
    """)
    cur.execute("""
        INSERT INTO battery_records (metric, region, value, unit, settlement_date, details)
        SELECT 'max_daily_discharge',
               region,
               MAX(discharged_mwh),
               'MWh',
               (SELECT settlement_date FROM battery_daily_scada AS b2
                WHERE b2.region = b1.region
                  AND b2.discharged_mwh = MAX(b1.discharged_mwh)
                LIMIT 1),
               NULL
        FROM battery_daily_scada AS b1
        WHERE discharged_mwh > 0
        GROUP BY region
    """)
    cur.execute("""
        INSERT INTO battery_records (metric, region, value, unit, settlement_date, details)
        SELECT 'max_daily_charge',
               region,
               MAX(charged_mwh),
               'MWh',
               (SELECT settlement_date FROM battery_daily_scada AS b2
                WHERE b2.region = b1.region
                  AND b2.charged_mwh = MAX(b1.charged_mwh)
                LIMIT 1),
               NULL
        FROM battery_daily_scada AS b1
        WHERE charged_mwh > 0
        GROUP BY region
    """)
    conn.commit()
    n_rec = cur.execute('SELECT COUNT(*) FROM battery_records').fetchone()[0]
    print(f'  refreshed battery_records: {n_rec} rows')


# ---------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    g = parser.add_mutually_exclusive_group(required=True)
    g.add_argument('--days', type=int, help='Last N days from today (AEST)')
    g.add_argument('--date-start', dest='start', help='YYYY-MM-DD')
    parser.add_argument('--date-end', dest='end', help='YYYY-MM-DD (required with --date-start)')
    args = parser.parse_args()

    if args.days is not None:
        today = date.today()
        args.start = (today - timedelta(days=args.days)).isoformat()
        args.end = today.isoformat()
    elif not args.end:
        parser.error('--date-end is required when --date-start is used')

    api_key = os.environ.get('OPENELECTRICITY_API_KEY')
    if not api_key:
        print('ERROR: OPENELECTRICITY_API_KEY not set. Sign up at https://platform.openelectricity.org.au')
        sys.exit(1)

    conn = get_connection()
    ensure_schema(conn)

    try:
        resp = fetch_network_battery_power(api_key, args.start, args.end)
    except Exception as e:
        print(f'! API request failed: {e}')
        sys.exit(2)

    points = list(parse_series(resp))
    if not points:
        print('! No data points returned. API endpoint shape may have changed. See docstring.')
        sys.exit(3)
    print(f'  Parsed {len(points)} raw 5-min points')

    agg = aggregate_daily(points)
    n = upsert_daily(conn, agg)
    print(f'  Upserted {n} daily-region rows')
    recompute_records(conn)


if __name__ == '__main__':
    main()
