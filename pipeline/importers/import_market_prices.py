"""
NEM Market Price Importer
=========================
Fetches wholesale electricity price data from OpenElectricity API to track:
  - Monthly average prices per NEM region (all available history)
  - Midday (10am-2pm) vs evening peak (4pm-8pm) price split
  - Time-of-day price profiles for the most recent quarter

This data supports the WattClarity analysis tab's "duck curve" and
"battery correlation penalty" analysis.

API Efficiency:
  - 1 call: monthly prices for all regions (no region filter = returns all)
  - 5 calls: hourly prices for 5 NEM regions (last 90 days only)
  - Total: 6 API calls per run

Usage:
    python3 pipeline/importers/import_market_prices.py
    python3 pipeline/importers/import_market_prices.py --dry-run
"""

import os
import sys
import json
import argparse
from datetime import datetime, timedelta
from urllib.request import Request, urlopen

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

API_BASE = "https://api.openelectricity.org.au/v4"
NEM_REGIONS = ['NSW1', 'QLD1', 'VIC1', 'SA1', 'TAS1']
REGION_LABELS = {'NSW1': 'NSW', 'QLD1': 'QLD', 'VIC1': 'VIC', 'SA1': 'SA', 'TAS1': 'TAS'}

OUTPUT_PATH = os.path.join(
    os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'data',
    'analytics', 'intelligence', 'market-prices.json'
)


def api_get(path, api_key, params=None):
    """Make an authenticated GET request to the OpenElectricity API."""
    url = f"{API_BASE}{path}"
    if params:
        from urllib.parse import quote
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
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 AURES/2.8",
        "Accept": "application/json",
    })
    resp = urlopen(req, timeout=60)
    return json.loads(resp.read().decode())


def fetch_monthly_prices(api_key):
    """Fetch monthly average prices for all NEM regions in a single call.
    Returns data for the last ~367 days (free plan limit).
    """
    today = datetime.now()
    start = (today - timedelta(days=365)).strftime('%Y-%m-%d')
    end = today.strftime('%Y-%m-%d')

    print(f"  Fetching monthly prices for all regions ({start} to {end})...")
    return api_get('/market/network/NEM', api_key, {
        'metrics': 'price',
        'interval': '1M',
        'date_start': start,
        'date_end': end,
        'primary_grouping': 'network_region',
    })


def fetch_hourly_prices(api_key, region, days=30):
    """Fetch hourly price data for a specific region (last N days).
    Free plan limit is ~30 days for hourly resolution.
    """
    today = datetime.now()
    start = (today - timedelta(days=days)).strftime('%Y-%m-%d')
    end = today.strftime('%Y-%m-%d')

    print(f"  Fetching hourly prices for {region} ({start} to {end})...")
    return api_get('/market/network/NEM', api_key, {
        'metrics': 'price',
        'interval': '1h',
        'date_start': start,
        'date_end': end,
        'network_region': region,
    })


def parse_results(api_response):
    """Parse OE v4 response structure into region -> [(timestamp, value)] dict."""
    results = {}
    for dataset in api_response.get('data', []):
        for result in dataset.get('results', []):
            columns = result.get('columns', {})
            region = columns.get('network_region', columns.get('region', 'unknown'))
            data_points = result.get('data', [])
            if region not in results:
                results[region] = []
            for point in data_points:
                if len(point) >= 2 and point[1] is not None:
                    results[region].append((point[0], float(point[1])))
    return results


def compute_monthly_trends(monthly_data):
    """Convert monthly price data into structured trends per region."""
    trends = {}
    for region, points in monthly_data.items():
        label = REGION_LABELS.get(region, region)
        months = []
        for ts, price in sorted(points):
            month_str = ts[:7]  # YYYY-MM
            months.append({
                'month': month_str,
                'avg_price': round(price, 2),
            })
        trends[label] = months
    return trends


def compute_time_of_day_profile(hourly_data):
    """Compute average price by hour of day, plus midday vs evening split."""
    profiles = {}
    for region, points in hourly_data.items():
        label = REGION_LABELS.get(region, region)
        hourly_prices = {}  # hour -> [prices]

        for ts, price in points:
            try:
                # Parse hour from timestamp like "2025-12-01T14:00:00+10:00"
                hour = int(ts[11:13])
                hourly_prices.setdefault(hour, []).append(price)
            except (ValueError, IndexError):
                continue

        # Average by hour
        hour_avgs = {}
        for h in range(24):
            prices = hourly_prices.get(h, [])
            if prices:
                hour_avgs[h] = round(sum(prices) / len(prices), 2)

        # Midday (10am-2pm) vs Evening (4pm-8pm) split
        midday_prices = []
        evening_prices = []
        for ts, price in points:
            try:
                hour = int(ts[11:13])
                if 10 <= hour <= 13:
                    midday_prices.append(price)
                elif 16 <= hour <= 19:
                    evening_prices.append(price)
            except (ValueError, IndexError):
                continue

        midday_avg = round(sum(midday_prices) / len(midday_prices), 2) if midday_prices else None
        evening_avg = round(sum(evening_prices) / len(evening_prices), 2) if evening_prices else None

        # Count negative price intervals
        total_intervals = len(points)
        negative_count = sum(1 for _, p in points if p < 0)
        zero_or_neg_count = sum(1 for _, p in points if p <= 0)

        # Count >$300 spike intervals
        spike_count = sum(1 for _, p in points if p > 300)

        profiles[label] = {
            'hourly_avg': hour_avgs,
            'midday_avg': midday_avg,
            'evening_avg': evening_avg,
            'spread_evening_minus_midday': round(evening_avg - midday_avg, 2) if midday_avg and evening_avg else None,
            'negative_pct': round(negative_count / total_intervals * 100, 1) if total_intervals else 0,
            'zero_or_negative_pct': round(zero_or_neg_count / total_intervals * 100, 1) if total_intervals else 0,
            'spike_gt300_pct': round(spike_count / total_intervals * 100, 2) if total_intervals else 0,
            'spike_gt300_count': spike_count,
            'total_intervals': total_intervals,
            'data_days': len(set(ts[:10] for ts, _ in points)),
        }

    return profiles


def main():
    parser = argparse.ArgumentParser(description='Import NEM market prices from OpenElectricity')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done without writing')
    args = parser.parse_args()

    api_key = os.environ.get('OPENELECTRICITY_API_KEY')
    if not api_key:
        print("ERROR: OPENELECTRICITY_API_KEY not set.")
        sys.exit(1)

    # Check quota
    me = api_get("/me", api_key)
    remaining = me.get('data', {}).get('credits', {}).get('remaining',
                me.get('data', {}).get('meta', {}).get('remaining', 0))
    print(f"API quota remaining: {remaining}")
    if remaining < 10:
        print("ERROR: Insufficient API quota (need ~6 calls).")
        sys.exit(1)

    # 1. Monthly prices — single API call for all regions
    print("\n[1/6] Monthly price trends (1 API call)...")
    try:
        monthly_raw = fetch_monthly_prices(api_key)
        monthly_parsed = parse_results(monthly_raw)
        monthly_trends = compute_monthly_trends(monthly_parsed)
        print(f"  Got monthly data for {len(monthly_trends)} regions")
    except Exception as e:
        print(f"  ERROR fetching monthly prices: {e}")
        monthly_trends = {}

    # 2. Hourly prices per region — 5 API calls
    hourly_all = {}
    for i, region in enumerate(NEM_REGIONS):
        print(f"\n[{i+2}/6] Hourly prices for {region}...")
        try:
            raw = fetch_hourly_prices(api_key, region, days=30)
            parsed = parse_results(raw)
            hourly_all.update(parsed)
            count = sum(len(v) for v in parsed.values())
            print(f"  Got {count} hourly data points")
        except Exception as e:
            print(f"  ERROR fetching {region}: {e}")

    # Compute time-of-day profiles
    profiles = compute_time_of_day_profile(hourly_all)

    # Assemble output
    output = {
        'generated_at': datetime.now().isoformat(),
        'data_source': 'openelectricity',
        'api_calls_used': 6,
        'monthly_trends': monthly_trends,
        'time_of_day_profiles': profiles,
        'methodology': {
            'midday_hours': '10:00-13:59 (4 hours)',
            'evening_hours': '16:00-19:59 (4 hours)',
            'spread': 'evening_avg - midday_avg (positive = batteries earn)',
            'negative_pct': 'Percentage of hourly intervals with price < $0',
            'spike_gt300': 'Percentage of intervals with price > $300/MWh',
        },
    }

    if args.dry_run:
        print(f"\n[DRY RUN] Would write to {OUTPUT_PATH}")
        print(f"  Monthly trends: {list(monthly_trends.keys())}")
        print(f"  ToD profiles: {list(profiles.keys())}")
        for label, p in profiles.items():
            print(f"    {label}: midday=${p['midday_avg']}, evening=${p['evening_avg']}, "
                  f"spread=${p['spread_evening_minus_midday']}, neg={p['negative_pct']}%, "
                  f"spikes>$300={p['spike_gt300_pct']}%")
    else:
        os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
        with open(OUTPUT_PATH, 'w') as f:
            json.dump(output, f, indent=2)
        print(f"\nWrote {OUTPUT_PATH}")

    # Final quota check
    me2 = api_get("/me", api_key)
    remaining2 = me2.get('data', {}).get('credits', {}).get('remaining',
                 me2.get('data', {}).get('meta', {}).get('remaining', 0))
    print(f"API quota remaining after: {remaining2} (used {remaining - remaining2})")


if __name__ == '__main__':
    main()
