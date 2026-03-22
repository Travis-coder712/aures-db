"""
Generation Profile Importer (Time-of-Day Stacks)
=================================================
Fetches hourly generation data from OpenElectricity API and computes
average generation profiles by time of day, per NEM region, per season.

This powers the "Generation Stack" tab in the Energy Mix Transition page,
showing how the daily generation pattern is evolving year-on-year as
batteries, solar and wind displace gas and coal.

Usage:
    # Set API key:
    export OPENELECTRICITY_API_KEY=your_key_here

    # Import all regions, all seasons for recent years:
    python3 pipeline/importers/import_generation_profiles.py

    # Import specific region:
    python3 pipeline/importers/import_generation_profiles.py --region SA1

    # Import specific year range:
    python3 pipeline/importers/import_generation_profiles.py --start-year 2022 --end-year 2025

    # Generate sample data (no API key needed):
    python3 pipeline/importers/import_generation_profiles.py --sample
"""

import os
import sys
import json
import time
import argparse
import math
import random
from datetime import datetime, date
from urllib.request import Request, urlopen
from urllib.parse import quote

# ============================================================
# Configuration
# ============================================================

API_BASE = "https://api.openelectricity.org.au/v4"

REGIONS = {
    'SA1':  'South Australia',
    'VIC1': 'Victoria',
    'NSW1': 'New South Wales',
    'QLD1': 'Queensland',
    'TAS1': 'Tasmania',
}

# Season definitions (month ranges)
# Summer uses Dec of previous year + Jan-Feb of the stated year
SEASONS = {
    'summer': {'label': 'Summer', 'months': [12, 1, 2]},
    'autumn': {'label': 'Autumn', 'months': [3, 4, 5]},
    'winter': {'label': 'Winter', 'months': [6, 7, 8]},
    'spring': {'label': 'Spring', 'months': [9, 10, 11]},
}

# Fuel technologies to track (maps API fueltech codes to display labels)
FUELTECH_MAP = {
    'coal_black':           'coal',
    'coal_brown':           'coal',
    'gas_ccgt':             'gas',
    'gas_ocgt':             'gas',
    'gas_recip':            'gas',
    'gas_steam':            'gas',
    'gas_wcmg':             'gas',
    'solar_utility':        'solar_utility',
    'solar_rooftop':        'solar_rooftop',
    'wind':                 'wind',
    'battery_discharging':  'battery',
    'battery_charging':     'battery_charging',
    'hydro':                'hydro',
    'pumps':                'pumps',
    'imports':              'imports',
    'exports':              'exports',
    'bioenergy_biogas':     'bioenergy',
    'bioenergy_biomass':    'bioenergy',
    'distillate':           'distillate',
}

# Display order for stacking (bottom to top)
STACK_ORDER = [
    'coal', 'gas', 'battery', 'hydro', 'solar_rooftop', 'solar_utility',
    'wind', 'imports', 'bioenergy', 'distillate',
]

STACK_COLOURS = {
    'coal':           '#4a5568',
    'gas':            '#c05621',
    'battery':        '#5b21b6',
    'battery_charging': '#7c3aed',
    'hydro':          '#2563eb',
    'solar_utility':  '#d69e2e',
    'solar_rooftop':  '#ecc94b',
    'wind':           '#588157',
    'imports':        '#9f1239',
    'exports':        '#dc2626',
    'bioenergy':      '#65a30d',
    'distillate':     '#78716c',
    'pumps':          '#6366f1',
}

STACK_LABELS = {
    'coal':           'Coal',
    'gas':            'Gas',
    'battery':        'Battery',
    'battery_charging': 'Battery Charging',
    'hydro':          'Hydro',
    'solar_utility':  'Solar',
    'solar_rooftop':  'Rooftop Solar',
    'wind':           'Wind',
    'imports':        'Imports',
    'exports':        'Exports',
    'bioenergy':      'Bioenergy',
    'distillate':     'Distillate',
    'pumps':          'Pumps',
}

OUTPUT_DIR = os.path.join(
    os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'data', 'analytics'
)


# ============================================================
# HTTP Helper
# ============================================================

def api_get(path, api_key, params=None):
    """Make an authenticated GET request to the OpenElectricity API."""
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
        "User-Agent": "AURES-Pipeline/1.0",
        "Accept": "application/json",
    })
    resp = urlopen(req, timeout=60)
    return json.loads(resp.read().decode())


# ============================================================
# Season date ranges
# ============================================================

def get_season_date_ranges(year, season_key):
    """Return list of (start, end) date strings for a season.

    Each chunk is <= 31 days to stay within the API's 1h interval limit (32 days).
    """
    months = SEASONS[season_key]['months']
    chunks = []

    for month in months:
        # For summer, December belongs to the previous year
        yr = year - 1 if month == 12 and season_key == 'summer' else year

        # Get last day of month
        if month in [1, 3, 5, 7, 8, 10, 12]:
            last_day = 31
        elif month in [4, 6, 9, 11]:
            last_day = 30
        elif month == 2:
            last_day = 29 if (yr % 4 == 0 and (yr % 100 != 0 or yr % 400 == 0)) else 28

        start = f"{yr}-{month:02d}-01T00:00:00"
        end = f"{yr}-{month:02d}-{last_day}T23:59:59"

        # Don't request future dates
        today = date.today()
        end_date = date(yr, month, last_day)
        if end_date > today:
            if date(yr, month, 1) > today:
                continue  # Skip entirely future months
            end = f"{today.year}-{today.month:02d}-{today.day:02d}T23:59:59"

        chunks.append((start, end))

    return chunks


def get_season_label(year, season_key):
    """Human-readable season label."""
    if season_key == 'summer':
        return f"Summer {year-1}/{str(year)[-2:]}"
    return f"{SEASONS[season_key]['label']} {year}"


def get_season_period(year, season_key):
    """Human-readable period string."""
    month_names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    months = SEASONS[season_key]['months']
    if season_key == 'summer':
        return f"Dec {year-1} – Feb {year}"
    return f"{month_names[months[0]-1]} – {month_names[months[-1]-1]} {year}"


# ============================================================
# API Data Fetching
# ============================================================

def fetch_hourly_generation(api_key, region, date_start, date_end):
    """Fetch hourly generation data for a region, grouped by fuel technology."""
    params = {
        'metrics': 'power',
        'interval': '1h',
        'date_start': date_start,
        'date_end': date_end,
        'network_region': region,
        'secondary_grouping': 'fueltech',
    }
    return api_get('/data/network/NEM', api_key, params)


def fetch_hourly_price(api_key, region, date_start, date_end):
    """Fetch hourly price data for a region."""
    params = {
        'metrics': 'price',
        'interval': '1h',
        'date_start': date_start,
        'date_end': date_end,
        'network_region': region,
    }
    return api_get('/market/network/NEM', api_key, params)


# ============================================================
# Data Processing — matches actual OpenElectricity v4 response
# ============================================================
#
# Actual API response structure:
# {
#   "data": [{
#     "results": [
#       {
#         "columns": { "region": "SA1", "fueltech": "battery_discharging" },
#         "data": [ ["2025-12-01T00:00:00+10:00", 490.96], ... ]
#       },
#       ...
#     ]
#   }]
# }

def process_generation_response(response_data, target_region=None):
    """Extract hourly generation by fuel tech from API response.

    Args:
        response_data: Raw API JSON response
        target_region: If set, only process results matching this region (e.g. 'SA1')

    Returns dict of { mapped_fuel: { hour_of_day: [values] } }
    """
    hourly_by_fuel = {}
    debug_fueltechs = set()

    data_list = response_data.get('data', [])
    if not data_list:
        return hourly_by_fuel

    # Process ALL envelopes in data (not just data[0])
    for envelope in data_list:
        results = envelope.get('results', [])

        for series in results:
            columns = series.get('columns', {})
            fueltech = columns.get('fueltech', '')
            region = columns.get('region', '')

            # Filter by region if specified — critical for correct per-state data
            if target_region and region and region != target_region:
                continue

            debug_fueltechs.add(fueltech)

            # Map to our display category
            mapped = FUELTECH_MAP.get(fueltech)
            if not mapped:
                continue

            # Skip charging, pumps, exports (we only want generation/imports)
            if mapped in ('battery_charging', 'pumps', 'exports'):
                continue

            if mapped not in hourly_by_fuel:
                hourly_by_fuel[mapped] = {h: [] for h in range(24)}

            # Data points are [timestamp_str, value] pairs
            for point in series.get('data', []):
                if not isinstance(point, list) or len(point) < 2:
                    continue
                ts_str, val = point[0], point[1]
                if val is None:
                    continue

                # Parse hour from timestamp (format: "2025-12-01T00:00:00+10:00")
                try:
                    hour = int(ts_str[11:13])
                except (ValueError, IndexError):
                    continue

                hourly_by_fuel[mapped][hour].append(val)

    return hourly_by_fuel


def process_price_response(response_data, target_region=None):
    """Process price API response.

    Returns dict of { hour: [price_values...] }
    """
    hourly_prices = {h: [] for h in range(24)}

    data_list = response_data.get('data', [])
    if not data_list:
        return hourly_prices

    for envelope in data_list:
        results = envelope.get('results', [])

        for series in results:
            columns = series.get('columns', {})
            region = columns.get('region', '')
            if target_region and region and region != target_region:
                continue

            for point in series.get('data', []):
                if not isinstance(point, list) or len(point) < 2:
                    continue
                ts_str, val = point[0], point[1]
                if val is None:
                    continue
                try:
                    hour = int(ts_str[11:13])
                except (ValueError, IndexError):
                    continue
                hourly_prices[hour].append(val)

    return hourly_prices


def compute_averages(hourly_by_fuel):
    """Compute average MW for each hour across all days in the period."""
    result = {}
    for fuel, hours in hourly_by_fuel.items():
        result[fuel] = []
        for h in range(24):
            vals = hours[h]
            avg = sum(vals) / len(vals) if vals else 0
            result[fuel].append(round(avg, 1))
    return result


def compute_price_averages(hourly_prices):
    """Compute average price for each hour."""
    result = []
    for h in range(24):
        vals = hourly_prices[h]
        avg = sum(vals) / len(vals) if vals else 0
        result.append(round(avg, 2))
    return result


# ============================================================
# Sample Data Generation
# ============================================================

def generate_sample_profiles():
    """Generate realistic sample generation profiles for all regions/seasons.

    Based on typical NEM generation patterns — useful for frontend dev without API key.
    """
    result = {}

    # Regional characteristics
    region_profiles = {
        'SA1': {
            'has_coal': False, 'wind_cf': 0.38, 'solar_cf': 0.24,
            'gas_base': 300, 'battery_peak': 350, 'import_base': 200,
            'peak_demand': 2500, 'rooftop_share': 0.6,
        },
        'VIC1': {
            'has_coal': True, 'coal_base': 3500, 'wind_cf': 0.32, 'solar_cf': 0.20,
            'gas_base': 400, 'battery_peak': 200, 'import_base': -200,
            'peak_demand': 6500, 'rooftop_share': 0.4,
        },
        'NSW1': {
            'has_coal': True, 'coal_base': 5000, 'wind_cf': 0.30, 'solar_cf': 0.23,
            'gas_base': 500, 'battery_peak': 150, 'import_base': 100,
            'peak_demand': 9000, 'rooftop_share': 0.35,
        },
        'QLD1': {
            'has_coal': True, 'coal_base': 4500, 'wind_cf': 0.28, 'solar_cf': 0.26,
            'gas_base': 800, 'battery_peak': 100, 'import_base': -100,
            'peak_demand': 7000, 'rooftop_share': 0.5,
        },
        'TAS1': {
            'has_coal': False, 'wind_cf': 0.40, 'solar_cf': 0.16,
            'gas_base': 50, 'battery_peak': 20, 'hydro_base': 1200,
            'import_base': -300, 'peak_demand': 1500, 'rooftop_share': 0.15,
        },
    }

    # Season multipliers
    season_multipliers = {
        'summer': {'solar': 1.35, 'wind': 0.85, 'demand': 1.1, 'rooftop': 1.4},
        'autumn': {'solar': 0.95, 'wind': 1.05, 'demand': 0.95, 'rooftop': 1.0},
        'winter': {'solar': 0.60, 'wind': 1.15, 'demand': 1.05, 'rooftop': 0.55},
        'spring': {'solar': 1.10, 'wind': 1.10, 'demand': 0.90, 'rooftop': 1.15},
    }

    # Year-on-year trends (more solar, more battery, less gas/coal)
    year_trends = {
        2022: {'solar': 0.75, 'battery': 0.15, 'rooftop': 0.80, 'gas': 1.3, 'coal': 1.05, 'wind': 0.90},
        2023: {'solar': 0.85, 'battery': 0.35, 'rooftop': 0.88, 'gas': 1.15, 'coal': 1.0, 'wind': 0.93},
        2024: {'solar': 0.92, 'battery': 0.60, 'rooftop': 0.95, 'gas': 1.0, 'coal': 0.95, 'wind': 0.96},
        2025: {'solar': 1.0,  'battery': 0.85, 'rooftop': 1.0,  'gas': 0.85, 'coal': 0.90, 'wind': 1.0},
        2026: {'solar': 1.05, 'battery': 1.0,  'rooftop': 1.05, 'gas': 0.75, 'coal': 0.85, 'wind': 1.02},
    }

    # Hourly shape profiles (normalised 0-1)
    solar_profile = [0, 0, 0, 0, 0, 0.02, 0.15, 0.40, 0.65, 0.85, 0.95, 1.0,
                     0.98, 0.90, 0.75, 0.55, 0.30, 0.08, 0, 0, 0, 0, 0, 0]
    wind_profile =  [0.42, 0.44, 0.45, 0.44, 0.42, 0.38, 0.34, 0.30, 0.28, 0.27,
                     0.28, 0.30, 0.32, 0.33, 0.34, 0.35, 0.36, 0.37, 0.38, 0.39,
                     0.40, 0.41, 0.42, 0.42]
    demand_profile =[0.68, 0.63, 0.60, 0.58, 0.60, 0.65, 0.75, 0.88, 0.93, 0.95,
                     0.92, 0.88, 0.86, 0.85, 0.87, 0.92, 0.97, 1.00, 0.97, 0.90,
                     0.82, 0.78, 0.74, 0.70]
    # Battery: charges midday, discharges morning + evening peaks
    battery_charge =   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0.3, 0.7, 1.0,
                        0.9, 0.6, 0.2, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    battery_discharge =[0.2, 0.1, 0, 0, 0, 0, 0.5, 0.9, 1.0, 0.3, 0, 0,
                        0, 0, 0, 0, 0.2, 0.7, 1.0, 0.8, 0.4, 0.2, 0.1, 0.05]

    price_profile = [55, 45, 38, 35, 38, 50, 75, 95, 85, 55, 25, 10,
                     8, 15, 25, 40, 60, 90, 110, 85, 65, 55, 50, 48]

    for region_code, rp in region_profiles.items():
        region_data = {'name': REGIONS[region_code], 'seasons': []}

        for year in sorted(year_trends.keys()):
            yt = year_trends[year]

            for season_key in ['summer', 'autumn', 'winter', 'spring']:
                sm = season_multipliers[season_key]

                # Check if season is in the future
                today = date.today()
                season_months = SEASONS[season_key]['months']
                last_month = season_months[-1]
                season_yr = year - 1 if last_month == 12 and season_key == 'summer' else year
                if date(season_yr if last_month != 12 else season_yr, last_month, 1) > today:
                    continue

                profiles = {}

                # Solar utility
                capacity_solar = rp['peak_demand'] * 0.5 * rp['solar_cf'] * yt['solar'] * sm['solar']
                profiles['solar_utility'] = [
                    round(solar_profile[h] * capacity_solar * (1 + random.uniform(-0.03, 0.03)), 1)
                    for h in range(24)
                ]

                # Rooftop solar
                capacity_rooftop = capacity_solar * rp['rooftop_share'] * yt['rooftop'] * sm['rooftop']
                profiles['solar_rooftop'] = [
                    round(solar_profile[h] * capacity_rooftop * (1 + random.uniform(-0.03, 0.03)), 1)
                    for h in range(24)
                ]

                # Wind
                capacity_wind = rp['peak_demand'] * 0.4 * rp['wind_cf'] * yt['wind'] * sm['wind']
                profiles['wind'] = [
                    round(wind_profile[h] * capacity_wind * 2.5 * (1 + random.uniform(-0.05, 0.05)), 1)
                    for h in range(24)
                ]

                # Battery
                batt_cap = rp['battery_peak'] * yt['battery']
                profiles['battery'] = [
                    round(battery_discharge[h] * batt_cap * (1 + random.uniform(-0.05, 0.05)), 1)
                    for h in range(24)
                ]

                # Gas
                gas_cap = rp['gas_base'] * yt['gas'] * sm.get('demand', 1.0)
                wind_avg = sum(profiles['wind']) / 24
                solar_avg = sum(profiles['solar_utility']) / 24
                re_factor = max(0.3, 1 - (wind_avg + solar_avg) / rp['peak_demand'])
                profiles['gas'] = [
                    round(max(0, gas_cap * demand_profile[h] * re_factor * (1 + random.uniform(-0.05, 0.05))), 1)
                    for h in range(24)
                ]

                # Coal (if applicable)
                if rp.get('has_coal'):
                    coal_cap = rp.get('coal_base', 0) * yt.get('coal', 1.0)
                    profiles['coal'] = [
                        round(coal_cap * (0.85 + 0.15 * demand_profile[h]) * (1 + random.uniform(-0.02, 0.02)), 1)
                        for h in range(24)
                    ]

                # Hydro (mainly TAS)
                if rp.get('hydro_base', 0) > 0:
                    hydro_base = rp['hydro_base']
                    profiles['hydro'] = [
                        round(hydro_base * (0.7 + 0.3 * demand_profile[h]) * (1 + random.uniform(-0.03, 0.03)), 1)
                        for h in range(24)
                    ]

                # Imports (interconnector)
                import_base = rp.get('import_base', 0)
                profiles['imports'] = [
                    round(max(0, import_base * (0.8 + 0.4 * demand_profile[h]) * (1 + random.uniform(-0.1, 0.1))), 1)
                    for h in range(24)
                ]

                # Demand (sum of all generation roughly)
                demand = [
                    round(rp['peak_demand'] * demand_profile[h] * sm.get('demand', 1.0) * (1 + random.uniform(-0.02, 0.02)), 1)
                    for h in range(24)
                ]

                # Price
                price = [
                    round(price_profile[h] * sm.get('demand', 1.0) * (1 + random.uniform(-0.1, 0.1)), 2)
                    for h in range(24)
                ]

                season_entry = {
                    'key': f"{season_key}_{year}",
                    'label': get_season_label(year, season_key),
                    'year': year,
                    'season': season_key,
                    'period': get_season_period(year, season_key),
                    'profiles': {k: v for k, v in profiles.items() if any(x > 0 for x in v)},
                    'demand': demand,
                    'price': price,
                }

                region_data['seasons'].append(season_entry)

        result[region_code] = region_data

    return result


# ============================================================
# API-based Import
# ============================================================

def import_generation_profiles(api_key, regions=None, start_year=2022, end_year=None):
    """Fetch and process generation profiles from the OpenElectricity API."""

    if end_year is None:
        end_year = date.today().year

    if regions is None:
        regions = list(REGIONS.keys())

    # Check API plan limits — free plan allows last 367 days only
    today = date.today()
    earliest_allowed = today - __import__('datetime').timedelta(days=365)
    earliest_year = earliest_allowed.year
    earliest_month = earliest_allowed.month

    if start_year < earliest_year:
        print(f"Note: API plan limits data to last ~12 months (from {earliest_allowed.isoformat()}).")
        print(f"  Adjusting start from {start_year} to {earliest_year}.")
        start_year = earliest_year

    # Check quota
    me = api_get("/me", api_key)
    plan_data = me.get('data', {})
    print(f"API plan: {plan_data.get('plan_name', 'unknown')}")

    # Estimate required calls
    total_seasons = 0
    for year in range(start_year, end_year + 1):
        for season_key in SEASONS:
            chunks = get_season_date_ranges(year, season_key)
            # Filter out chunks before the earliest allowed date
            valid_chunks = []
            for cs, ce in chunks:
                chunk_date = date(int(cs[:4]), int(cs[5:7]), int(cs[8:10]))
                if chunk_date >= earliest_allowed:
                    valid_chunks.append((cs, ce))
            if valid_chunks:
                total_seasons += 1

    estimated_calls = len(regions) * total_seasons * 3 * 2  # gen + price per chunk
    print(f"Estimated API calls: ~{estimated_calls} ({total_seasons} seasons × {len(regions)} regions)")

    result = {}

    for region_code in regions:
        print(f"\n{'='*60}")
        print(f"Region: {region_code} ({REGIONS[region_code]})")
        print(f"{'='*60}")

        region_data = {'name': REGIONS[region_code], 'seasons': []}

        for year in range(start_year, end_year + 1):
            for season_key in ['summer', 'autumn', 'winter', 'spring']:
                chunks = get_season_date_ranges(year, season_key)
                if not chunks:
                    print(f"  Skipping {season_key} {year} (future)")
                    continue

                # Filter out chunks before the API plan's earliest allowed date
                valid_chunks = []
                for cs, ce in chunks:
                    chunk_date = date(int(cs[:4]), int(cs[5:7]), int(cs[8:10]))
                    if chunk_date >= earliest_allowed:
                        valid_chunks.append((cs, ce))
                    else:
                        pass  # silently skip — too old for plan

                if not valid_chunks:
                    continue

                label = get_season_label(year, season_key)
                print(f"\n  {label} ({len(valid_chunks)} month chunks)...")

                # Accumulate hourly data across all chunks
                combined_fuel = {}
                combined_price = {h: [] for h in range(24)}

                for chunk_start, chunk_end in valid_chunks:
                    print(f"    Fetching {chunk_start[:10]} to {chunk_end[:10]}...")

                    try:
                        # Fetch generation
                        gen_response = fetch_hourly_generation(api_key, region_code, chunk_start, chunk_end)
                        chunk_fuel = process_generation_response(gen_response, target_region=region_code)

                        for fuel, hours in chunk_fuel.items():
                            if fuel not in combined_fuel:
                                combined_fuel[fuel] = {h: [] for h in range(24)}
                            for h in range(24):
                                combined_fuel[fuel][h].extend(hours[h])

                        time.sleep(0.5)

                        # Fetch price
                        try:
                            price_response = fetch_hourly_price(api_key, region_code, chunk_start, chunk_end)
                            chunk_price = process_price_response(price_response, target_region=region_code)
                            for h in range(24):
                                combined_price[h].extend(chunk_price[h])
                        except Exception as e:
                            print(f"    Warning: Price fetch failed: {e}")

                        time.sleep(0.5)

                    except Exception as e:
                        print(f"    ERROR fetching chunk: {e}")
                        continue

                # Compute averages
                if combined_fuel:
                    profiles = compute_averages(combined_fuel)
                    price = compute_price_averages(combined_price)

                    # Compute demand as sum of all generation
                    demand = [0.0] * 24
                    for fuel, hourly in profiles.items():
                        for h in range(24):
                            demand[h] += hourly[h]
                    demand = [round(d, 1) for d in demand]

                    # Only keep fuels with meaningful generation
                    filtered_profiles = {}
                    for fuel, hourly in profiles.items():
                        if max(hourly) > 1:  # More than 1 MW peak
                            filtered_profiles[fuel] = hourly

                    season_entry = {
                        'key': f"{season_key}_{year}",
                        'label': label,
                        'year': year,
                        'season': season_key,
                        'period': get_season_period(year, season_key),
                        'profiles': filtered_profiles,
                        'demand': demand,
                        'price': price,
                    }

                    data_points = sum(len(hours[0]) for hours in combined_fuel.values() if hours[0])
                    print(f"    ✓ {len(filtered_profiles)} fuel types, ~{data_points} data points/hour")
                    region_data['seasons'].append(season_entry)
                else:
                    print(f"    ✗ No data returned")

        result[region_code] = region_data

    return result


# ============================================================
# Main
# ============================================================

def main():
    parser = argparse.ArgumentParser(description='Import NEM generation profiles by time of day')
    parser.add_argument('--region', help='Specific region to import (e.g., SA1)')
    parser.add_argument('--start-year', type=int, default=2022, help='Start year (default: 2022)')
    parser.add_argument('--end-year', type=int, default=None, help='End year (default: current)')
    parser.add_argument('--sample', action='store_true', help='Generate sample data without API')
    args = parser.parse_args()

    if args.sample:
        print("Generating sample generation profile data...")
        data = generate_sample_profiles()
    else:
        api_key = os.environ.get('OPENELECTRICITY_API_KEY')
        if not api_key:
            print("ERROR: OPENELECTRICITY_API_KEY environment variable not set.")
            print("Sign up at https://platform.openelectricity.org.au/sign-up")
            print("\nUse --sample to generate sample data for development.")
            sys.exit(1)

        regions = [args.region] if args.region else None
        data = import_generation_profiles(api_key, regions, args.start_year, args.end_year)

    # Build output
    output = {
        'generated_at': datetime.now().isoformat(),
        'regions': data,
        'stack_order': STACK_ORDER,
        'colours': STACK_COLOURS,
        'labels': STACK_LABELS,
    }

    # Write output
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUT_DIR, 'generation-profiles.json')
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)

    # Summary
    total_seasons = sum(len(r['seasons']) for r in data.values())
    print(f"\n{'='*60}")
    print(f"Done! {len(data)} regions, {total_seasons} season profiles")
    print(f"Output: {output_path}")
    print(f"File size: {os.path.getsize(output_path) / 1024:.0f} KB")


if __name__ == '__main__':
    main()
