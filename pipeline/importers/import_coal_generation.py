#!/usr/bin/env python3
"""
Import coal generation and market value data from Open Electricity API.

Fetches facility-level annual and monthly data for NSW coal plants:
  - Eraring (ERARING)
  - Bayswater (BAYSW)
  - Vales Point (VP)
  - Mt Piper (MTPIPER)

Metrics: energy (MWh), market_value (AUD)
Intervals: 1y (annual), 1M (monthly for seasonal analysis)

Outputs: frontend/public/data/analytics/coal-watch.json

Usage:
  python3 pipeline/importers/import_coal_generation.py
  python3 pipeline/importers/import_coal_generation.py --sample  # Generate sample data only
"""

import os
import sys
import json
import math
import argparse
import requests
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict

# ============================================================
# Config
# ============================================================

API_BASE = "https://api.openelectricity.org.au/v4"
API_KEY = os.environ.get("OPENELECTRICITY_API_KEY", "")

NSW_COAL_PLANTS = [
    {
        "name": "Eraring Power Station",
        "facility_code": "ERARING",
        "owner": "Origin Energy",
        "capacity_mw": 2880,
        "units": 4,
        "unit_size_mw": 720,
        "fuel": "Black coal",
        "commissioned": 1982,
        "closure_date": "2029-04-30",
        "closure_note": "Extended from Aug 2025 → Aug 2027 → Apr 2029. Origin cited slower renewables rollout.",
        "battery_replacement": "Eraring Big Battery 700 MW / 3,160 MWh (Stage 1 operating, full by Q1 2027)",
        "duids": ["ER01", "ER02", "ER03", "ER04"],
    },
    {
        "name": "Bayswater Power Station",
        "facility_code": "BAYSW",
        "owner": "AGL Energy",
        "capacity_mw": 2715,
        "units": 4,
        "unit_size_mw": 679,
        "fuel": "Black coal",
        "commissioned": 1985,
        "closure_date": "2033-06-30",
        "closure_note": "AGL indicated 2030-2033 window. MoU with SunDrive for solar manufacturing at site.",
        "battery_replacement": "Liddell BESS 500 MW (nearby, commissioning 2026) + Tomago BESS 500 MW (2027)",
        "duids": ["BW01", "BW02", "BW03", "BW04"],
    },
    {
        "name": "Vales Point B Power Station",
        "facility_code": "VP",
        "owner": "Delta Electricity / Sunset Power International",
        "capacity_mw": 1320,
        "units": 2,
        "unit_size_mw": 660,
        "fuel": "Black coal",
        "commissioned": 1978,
        "closure_date": "2033-12-31",
        "closure_note": "Expected 2033. VP5 had lengthy unplanned outage from Aug 2025 (turbine vibrations).",
        "battery_replacement": None,
        "duids": ["VP5", "VP6"],
    },
    {
        "name": "Mt Piper Power Station",
        "facility_code": "MTPIPER",
        "owner": "EnergyAustralia",
        "capacity_mw": 1400,
        "units": 2,
        "unit_size_mw": 700,
        "fuel": "Black coal",
        "commissioned": 1993,
        "closure_date": "2040-12-31",
        "closure_note": "Latest closure among NSW plants (2040). Has had recurring availability issues.",
        "battery_replacement": None,
        "duids": ["MPP_1", "MPP_2"],
    },
]

# Seasons (Australian meteorological)
SEASONS = {
    "summer": [12, 1, 2],
    "autumn": [3, 4, 5],
    "winter": [6, 7, 8],
    "spring": [9, 10, 11],
}

OUTPUT_PATH = Path(__file__).parent.parent.parent / "frontend" / "public" / "data" / "analytics" / "coal-watch.json"


def get_headers():
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json",
    }


# ============================================================
# API fetching
# ============================================================

def fetch_facility_data(facility_codes, metrics, interval, date_start, date_end):
    """Fetch data from Open Electricity facilities endpoint."""
    params = {
        "facility_code": facility_codes,
        "metrics": metrics,
        "interval": interval,
        "date_start": date_start,
        "date_end": date_end,
    }
    url = f"{API_BASE}/data/facilities/NEM"
    print(f"  Fetching {url} interval={interval} {date_start} to {date_end} ...")
    resp = requests.get(url, params=params, headers=get_headers(), timeout=60)
    if resp.status_code != 200:
        print(f"  ERROR {resp.status_code}: {resp.text[:200]}")
        return None
    return resp.json()


def process_facility_response(response_data, metric_name):
    """
    Process API response into {facility_code: {period: value}} structure.
    Handles the OpenElectricity response format: data[0].results[].columns + data[]
    """
    result = defaultdict(lambda: defaultdict(float))

    if not response_data or "data" not in response_data:
        return result

    for series in response_data.get("data", []):
        results = series.get("results", [series])  # Handle both formats
        for r in results:
            columns = r.get("columns", {})
            facility_code = columns.get("facility_code", "")
            metric = columns.get("metric", "")

            if metric != metric_name:
                continue

            for point in r.get("data", []):
                if len(point) >= 2 and point[1] is not None:
                    timestamp = point[0]
                    value = float(point[1])
                    # Extract year or year-month from timestamp
                    dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                    period_key = dt.strftime("%Y") if "1y" in str(r.get("interval", "")) else dt.strftime("%Y-%m")
                    result[facility_code][period_key] += value

    return result


def compute_annual_data(plant, energy_by_period, market_value_by_period):
    """Compute annual statistics for a plant."""
    annual_data = []
    facility_code = plant["facility_code"]
    capacity_mw = plant["capacity_mw"]

    for year_str, energy_mwh in sorted(energy_by_period.get(facility_code, {}).items()):
        year = int(year_str)
        generation_gwh = energy_mwh / 1000
        hours_in_year = 8760 if year % 4 != 0 else 8784
        capacity_factor_pct = round((energy_mwh / (capacity_mw * hours_in_year)) * 100, 1)

        market_value = market_value_by_period.get(facility_code, {}).get(year_str, 0)
        est_revenue_m_aud = round(market_value / 1_000_000, 0)
        avg_price_aud_mwh = round(market_value / energy_mwh, 0) if energy_mwh > 0 else 0

        annual_data.append({
            "year": year,
            "generation_gwh": round(generation_gwh, 0),
            "capacity_factor_pct": capacity_factor_pct,
            "est_revenue_m_aud": est_revenue_m_aud,
            "avg_price_aud_mwh": avg_price_aud_mwh,
        })

    return annual_data


def compute_seasonal_data(plant, monthly_energy, monthly_market_value):
    """Compute seasonal aggregates from monthly data."""
    seasonal_data = []
    facility_code = plant["facility_code"]

    # Group monthly data by year-season
    year_season = defaultdict(lambda: {"energy_mwh": 0, "market_value": 0})

    for period_key, energy_mwh in monthly_energy.get(facility_code, {}).items():
        year, month = int(period_key.split("-")[0]), int(period_key.split("-")[1])
        # Find season
        season = None
        for s, months in SEASONS.items():
            if month in months:
                season = s
                break
        if not season:
            continue
        # For summer, Dec belongs to next year's summer
        season_year = year if month != 12 else year + 1
        key = f"{season_year}-{season}"
        year_season[key]["energy_mwh"] += energy_mwh
        mv = monthly_market_value.get(facility_code, {}).get(period_key, 0)
        year_season[key]["market_value"] += mv

    for key in sorted(year_season.keys()):
        year_str, season = key.split("-")
        d = year_season[key]
        generation_gwh = d["energy_mwh"] / 1000
        avg_price = round(d["market_value"] / d["energy_mwh"], 0) if d["energy_mwh"] > 0 else 0
        seasonal_data.append({
            "year": int(year_str),
            "season": season,
            "generation_gwh": round(generation_gwh, 0),
            "avg_price_aud_mwh": avg_price,
        })

    return seasonal_data


# ============================================================
# Main
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="Import coal generation data from Open Electricity API")
    parser.add_argument("--sample", action="store_true", help="Skip API calls, use existing sample data")
    parser.add_argument("--start-year", type=int, default=2020, help="Start year (default: 2020)")
    parser.add_argument("--end-year", type=int, default=2026, help="End year (default: 2026)")
    args = parser.parse_args()

    if args.sample:
        print("Sample mode — coal-watch.json already contains curated sample data.")
        print(f"File: {OUTPUT_PATH}")
        return

    if not API_KEY:
        print("ERROR: OPENELECTRICITY_API_KEY environment variable not set.")
        print("Set it with: export OPENELECTRICITY_API_KEY=your_key_here")
        sys.exit(1)

    # Validate date range (free plan: last 367 days)
    today = datetime.now()
    earliest_allowed = today - timedelta(days=365)
    start_year = max(args.start_year, earliest_allowed.year)
    end_year = min(args.end_year, today.year)

    print(f"Fetching coal generation data for {start_year}-{end_year}")

    facility_codes = [p["facility_code"] for p in NSW_COAL_PLANTS]

    # Fetch annual data
    print("\n=== Annual Data (energy + market_value) ===")
    annual_response = fetch_facility_data(
        facility_codes,
        metrics=["energy", "market_value"],
        interval="1y",
        date_start=f"{start_year}-01-01",
        date_end=f"{end_year}-12-31",
    )

    annual_energy = process_facility_response(annual_response, "energy") if annual_response else {}
    annual_market_value = process_facility_response(annual_response, "market_value") if annual_response else {}

    # Fetch monthly data for seasonal analysis
    print("\n=== Monthly Data (energy + market_value) ===")
    monthly_response = fetch_facility_data(
        facility_codes,
        metrics=["energy", "market_value"],
        interval="1M",
        date_start=f"{start_year}-01-01",
        date_end=f"{end_year}-12-31",
    )

    monthly_energy = process_facility_response(monthly_response, "energy") if monthly_response else {}
    monthly_market_value = process_facility_response(monthly_response, "market_value") if monthly_response else {}

    # Build output
    print("\n=== Building coal-watch.json ===")

    # Load existing curated data for context fields
    existing_data = {}
    if OUTPUT_PATH.exists():
        with open(OUTPUT_PATH) as f:
            existing_data = json.load(f)

    plants_output = []
    for plant in NSW_COAL_PLANTS:
        p_annual = compute_annual_data(plant, annual_energy, annual_market_value)
        p_seasonal = compute_seasonal_data(plant, monthly_energy, monthly_market_value)

        plants_output.append({
            **plant,
            "annual_data": p_annual if p_annual else existing_data.get("nsw_coal_plants", [{}])[0].get("annual_data", []),
            "seasonal_data": p_seasonal if p_seasonal else existing_data.get("nsw_coal_plants", [{}])[0].get("seasonal_data", []),
        })

    # Compute fleet totals
    fleet_total = defaultdict(lambda: {"generation_mwh": 0, "market_value": 0})
    for fc in facility_codes:
        for year_str, energy in annual_energy.get(fc, {}).items():
            fleet_total[year_str]["generation_mwh"] += energy
            fleet_total[year_str]["market_value"] += annual_market_value.get(fc, {}).get(year_str, 0)

    fleet_total_list = []
    for year_str in sorted(fleet_total.keys()):
        d = fleet_total[year_str]
        gen_twh = d["generation_mwh"] / 1_000_000
        rev_b = d["market_value"] / 1_000_000_000
        avg_price = round(d["market_value"] / d["generation_mwh"], 0) if d["generation_mwh"] > 0 else 0
        fleet_total_list.append({
            "year": int(year_str),
            "generation_twh": round(gen_twh, 1),
            "est_revenue_b_aud": round(rev_b, 1),
            "avg_price_aud_mwh": avg_price,
        })

    output = {
        "generated_at": today.strftime("%Y-%m-%d"),
        "data_source": "openelectricity",
        "note": "Real generation and market value data from Open Electricity API.",
        "nsw_coal_plants": plants_output,
        # Preserve curated context fields
        "nem_coal_summary": existing_data.get("nem_coal_summary", {}),
        "battery_vs_coal_context": existing_data.get("battery_vs_coal_context", {}),
        "revenue_watch": {
            "note": "Revenue from Open Electricity market_value metric (energy × spot price).",
            "nsw_fleet_total": fleet_total_list if fleet_total_list else existing_data.get("revenue_watch", {}).get("nsw_fleet_total", []),
        },
        "insights": existing_data.get("insights", []),
        "sources": existing_data.get("sources", []),
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nWritten to {OUTPUT_PATH}")
    for p in plants_output:
        years = len(p["annual_data"])
        seasons = len(p["seasonal_data"])
        print(f"  {p['name']}: {years} annual records, {seasons} seasonal records")


if __name__ == "__main__":
    main()
