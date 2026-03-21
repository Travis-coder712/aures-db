#!/usr/bin/env python3
"""
Generate realistic per-project monthly performance data for all projects
in the league tables, using dunkelflaute seasonal patterns to shape monthly
capacity factors around each project's annual average.

Reads:
  - frontend/public/data/performance/league-tables/{tech}-{year}.json
  - frontend/public/data/analytics/intelligence/dunkelflaute.json

Writes:
  - frontend/public/data/performance/monthly/{project-id}.json  (one per project)
  - frontend/public/data/performance/monthly/index.json
"""

import json
import glob
import os
import hashlib
import random
import calendar
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parents[2]
LEAGUE_DIR = REPO_ROOT / "frontend" / "public" / "data" / "performance" / "league-tables"
DUNKELFLAUTE_PATH = (
    REPO_ROOT
    / "frontend"
    / "public"
    / "data"
    / "analytics"
    / "intelligence"
    / "dunkelflaute.json"
)
OUTPUT_DIR = REPO_ROOT / "frontend" / "public" / "data" / "performance" / "monthly"

# For 2026 we only have YTD through March
YTD_YEAR = 2026
YTD_MAX_MONTH = 3

# Hours in each month (non-leap / leap handled via calendar)
def hours_in_month(year: int, month: int) -> int:
    days = calendar.monthrange(year, month)[1]
    return days * 24


# ---------------------------------------------------------------------------
# Load dunkelflaute seasonal monthly data
# ---------------------------------------------------------------------------
def load_seasonal_monthly():
    """Return dict keyed by (state, year) -> list of 12 monthly entries."""
    with open(DUNKELFLAUTE_PATH) as f:
        data = json.load(f)

    lookup = {}
    for entry in data["seasonal_monthly"]:
        key = (entry["state"], entry["year"])
        lookup.setdefault(key, [])
        lookup[key].append(entry)

    # Sort each list by month
    for key in lookup:
        lookup[key].sort(key=lambda e: e["month"])

    return lookup


# ---------------------------------------------------------------------------
# Build average seasonal shape per state from all available years
# ---------------------------------------------------------------------------
def build_avg_seasonal_shape(seasonal_lookup):
    """
    For each state, compute average wind_cf and solar_cf per month across
    all years.  Returns dict: state -> {month -> {wind_cf, solar_cf}}.
    """
    from collections import defaultdict

    accum = defaultdict(lambda: defaultdict(lambda: {"wind_sum": 0, "solar_sum": 0, "count": 0}))

    for (state, year), entries in seasonal_lookup.items():
        for e in entries:
            m = e["month"]
            accum[state][m]["wind_sum"] += e["wind_cf"]
            accum[state][m]["solar_sum"] += e["solar_cf"]
            accum[state][m]["count"] += 1

    result = {}
    for state in accum:
        result[state] = {}
        for m in range(1, 13):
            d = accum[state][m]
            if d["count"] > 0:
                result[state][m] = {
                    "wind_cf": d["wind_sum"] / d["count"],
                    "solar_cf": d["solar_sum"] / d["count"],
                }
            else:
                result[state][m] = {"wind_cf": 25.0, "solar_cf": 20.0}

    return result


# ---------------------------------------------------------------------------
# Load all league table projects
# ---------------------------------------------------------------------------
def load_league_tables():
    """
    Return list of (year, tech, project_dict) for every project across all
    league table files.  Each project may appear in multiple years.
    """
    results = []
    for fp in sorted(LEAGUE_DIR.glob("*.json")):
        if fp.name == "index.json":
            continue
        with open(fp) as f:
            data = json.load(f)
        year = data["year"]
        tech = data["technology"]
        for proj in data["projects"]:
            results.append((year, tech, proj))
    return results


# ---------------------------------------------------------------------------
# Deterministic per-project random seed
# ---------------------------------------------------------------------------
def project_seed(project_id: str, year: int) -> int:
    h = hashlib.md5(f"{project_id}-{year}".encode()).hexdigest()
    return int(h[:8], 16)


# ---------------------------------------------------------------------------
# Generate monthly CF shape for wind / solar / hybrid
# ---------------------------------------------------------------------------
def generate_monthly_cfs(
    project_id: str,
    technology: str,
    state: str,
    year: int,
    annual_cf: float,
    seasonal_lookup: dict,
    avg_shape: dict,
    num_months: int = 12,
):
    """
    Generate monthly capacity factors that:
      - Follow the seasonal pattern from dunkelflaute data
      - Average (weighted by hours-in-month) to the project's annual CF
      - Include slight per-project random noise
    Returns list of (month, cf) tuples.
    """
    rng = random.Random(project_seed(project_id, year))

    # Get seasonal shape: prefer exact (state, year), fall back to avg shape
    key = (state, year)
    if key in seasonal_lookup:
        entries = seasonal_lookup[key]
        shape_by_month = {}
        for e in entries:
            if technology in ("wind", "hybrid"):
                shape_by_month[e["month"]] = e["wind_cf"]
            else:  # solar
                shape_by_month[e["month"]] = e["solar_cf"]
    else:
        # Use average shape for this state
        shape_by_month = {}
        for m in range(1, 13):
            if state in avg_shape and m in avg_shape[state]:
                if technology in ("wind", "hybrid"):
                    shape_by_month[m] = avg_shape[state][m]["wind_cf"]
                else:
                    shape_by_month[m] = avg_shape[state][m]["solar_cf"]
            else:
                shape_by_month[m] = annual_cf

    # Compute hours-weighted average of the shape
    months = list(range(1, num_months + 1))
    total_hours = sum(hours_in_month(year, m) for m in months)
    shape_weighted_avg = sum(
        shape_by_month.get(m, annual_cf) * hours_in_month(year, m) for m in months
    ) / total_hours

    if shape_weighted_avg <= 0:
        shape_weighted_avg = 1.0  # safety

    # Scale factor to shift the shape so it averages to the project's annual CF
    scale = annual_cf / shape_weighted_avg

    results = []
    for m in months:
        base_cf = shape_by_month.get(m, annual_cf) * scale
        # Add noise: +/- 5-10% relative
        noise = rng.gauss(0, 0.07)
        noisy_cf = base_cf * (1 + noise)
        noisy_cf = max(0.5, min(noisy_cf, 95.0))  # clamp
        results.append((m, noisy_cf))

    # Re-scale so the weighted average exactly matches annual_cf
    current_avg = sum(cf * hours_in_month(year, m) for m, cf in results) / total_hours
    if current_avg > 0:
        correction = annual_cf / current_avg
        results = [(m, max(0.1, min(cf * correction, 98.0))) for m, cf in results]

    return results


# ---------------------------------------------------------------------------
# Generate monthly data for BESS projects
# ---------------------------------------------------------------------------
def generate_bess_monthly(
    project_id: str,
    state: str,
    year: int,
    proj: dict,
    seasonal_lookup: dict,
    avg_shape: dict,
    num_months: int = 12,
):
    """
    Generate monthly BESS performance entries.
    BESS has higher spread/utilisation in summer (Dec-Feb) and winter (Jun-Aug)
    because of high demand and low renewables respectively.
    """
    rng = random.Random(project_seed(project_id, year))

    capacity_mw = proj["capacity_mw"]
    storage_mwh = proj.get("storage_mwh", capacity_mw * 2)
    annual_discharged = proj.get("energy_discharged_mwh", proj["energy_mwh"] * 0.45)
    annual_charged = proj.get("energy_charged_mwh", annual_discharged * 1.2)
    annual_avg_charge = proj.get("avg_charge_price", 40.0)
    annual_avg_discharge = proj.get("avg_discharge_price", 200.0)
    annual_utilisation = proj.get("utilisation_pct", 5.0)
    annual_cycles = proj.get("cycles", 300.0)

    # BESS seasonal shape: higher activity in summer and winter peaks
    # Shape multiplier by month (Southern Hemisphere)
    bess_shape = {
        1: 1.25,   # Jan - summer peak
        2: 1.20,   # Feb
        3: 1.05,   # Mar
        4: 0.85,   # Apr - shoulder
        5: 0.80,   # May
        6: 1.05,   # Jun - winter
        7: 1.10,   # Jul - winter peak
        8: 1.00,   # Aug
        9: 0.80,   # Sep - shoulder
        10: 0.85,  # Oct
        11: 0.95,  # Nov
        12: 1.15,  # Dec - summer start
    }

    months = list(range(1, num_months + 1))
    total_hours = sum(hours_in_month(year, m) for m in months)

    # Normalise shape so weighted average = 1.0 over the months we generate
    shape_sum = sum(bess_shape.get(m, 1.0) * hours_in_month(year, m) for m in months)
    norm = total_hours / shape_sum

    entries = []
    for m in months:
        hrs = hours_in_month(year, m)
        month_frac = hrs / total_hours
        shape_mult = bess_shape.get(m, 1.0) * norm

        noise = rng.gauss(0, 0.08)
        mult = shape_mult * (1 + noise)
        mult = max(0.3, min(mult, 2.0))

        discharged = annual_discharged * month_frac * mult
        charged = discharged * (annual_charged / max(annual_discharged, 1))

        # Price spread varies with shape
        spread_mult = 0.8 + 0.4 * (mult / 1.0)
        charge_price = annual_avg_charge * (1 + rng.gauss(0, 0.1))
        discharge_price = annual_avg_discharge * spread_mult * (1 + rng.gauss(0, 0.1))
        charge_price = max(5.0, charge_price)
        discharge_price = max(charge_price + 20, discharge_price)

        utilisation = annual_utilisation * mult * (1 + rng.gauss(0, 0.05))
        utilisation = max(0.5, min(utilisation, 50.0))

        cycles = annual_cycles * month_frac * mult
        cycles = max(1.0, cycles)

        entries.append(
            {
                "year": year,
                "month": m,
                "energy_discharged_mwh": round(discharged, 1),
                "energy_charged_mwh": round(charged, 1),
                "avg_charge_price": round(charge_price, 2),
                "avg_discharge_price": round(discharge_price, 2),
                "utilisation_pct": round(utilisation, 1),
                "cycles": round(cycles, 1),
            }
        )

    # Re-scale discharged/charged so totals match annual values
    total_discharged = sum(e["energy_discharged_mwh"] for e in entries)
    total_charged = sum(e["energy_charged_mwh"] for e in entries)

    if total_discharged > 0:
        d_scale = annual_discharged / total_discharged
        c_scale = annual_charged / total_charged if total_charged > 0 else 1.0
        for e in entries:
            e["energy_discharged_mwh"] = round(e["energy_discharged_mwh"] * d_scale, 1)
            e["energy_charged_mwh"] = round(e["energy_charged_mwh"] * c_scale, 1)

    # Re-scale cycles so total matches
    total_cyc = sum(e["cycles"] for e in entries)
    if total_cyc > 0:
        cyc_scale = annual_cycles / total_cyc
        for e in entries:
            e["cycles"] = round(e["cycles"] * cyc_scale, 1)

    return entries


# ---------------------------------------------------------------------------
# Generate monthly data for pumped_hydro projects
# ---------------------------------------------------------------------------
def generate_hydro_monthly(
    project_id: str,
    state: str,
    year: int,
    proj: dict,
    seasonal_lookup: dict,
    avg_shape: dict,
    num_months: int = 12,
):
    """
    Generate monthly pumped hydro performance.
    Pumped hydro has higher dispatch in peak demand (summer, winter evenings)
    and shoulder-season maintenance/lower dispatch.
    """
    rng = random.Random(project_seed(project_id, year))

    capacity_mw = proj["capacity_mw"]
    annual_cf = proj["capacity_factor_pct"]
    annual_energy = proj["energy_mwh"]
    annual_price = proj["energy_price_received"]
    annual_revenue = proj["revenue_aud"]

    # Pumped hydro shape: peaks in summer/winter, lower in shoulder
    hydro_shape = {
        1: 1.20,   # Jan - summer demand
        2: 1.15,
        3: 1.00,
        4: 0.85,
        5: 0.80,
        6: 1.05,   # Jun - winter
        7: 1.15,   # Jul - winter peak
        8: 1.05,
        9: 0.80,
        10: 0.85,
        11: 0.95,
        12: 1.15,  # Dec
    }

    months = list(range(1, num_months + 1))
    total_hours = sum(hours_in_month(year, m) for m in months)

    # Normalise shape
    shape_sum = sum(hydro_shape.get(m, 1.0) * hours_in_month(year, m) for m in months)
    norm = total_hours / shape_sum

    entries = []
    raw_energies = []
    for m in months:
        hrs = hours_in_month(year, m)
        month_frac = hrs / total_hours
        shape_mult = hydro_shape.get(m, 1.0) * norm

        noise = rng.gauss(0, 0.07)
        mult = shape_mult * (1 + noise)
        mult = max(0.3, min(mult, 2.0))

        energy = annual_energy * month_frac * mult
        raw_energies.append(energy)

    # Scale so total matches annual
    total_raw = sum(raw_energies)
    if total_raw > 0:
        e_scale = annual_energy / total_raw
        raw_energies = [e * e_scale for e in raw_energies]

    for i, m in enumerate(months):
        hrs = hours_in_month(year, m)
        energy = raw_energies[i]
        cf = (energy / (capacity_mw * hrs)) * 100 if capacity_mw > 0 else 0
        cf = max(0.1, min(cf, 100.0))

        # Price varies seasonally — higher in peak months
        price_mult = hydro_shape.get(m, 1.0)
        price = annual_price * price_mult * (1 + rng.gauss(0, 0.08))
        price = max(10.0, price)

        revenue = energy * price
        curtailment = max(0, rng.gauss(1.5, 0.8))

        entries.append(
            {
                "year": year,
                "month": m,
                "capacity_factor_pct": round(cf, 1),
                "energy_mwh": round(energy, 1),
                "revenue_aud": round(revenue, 0),
                "energy_price_received": round(price, 2),
                "curtailment_pct": round(curtailment, 1),
            }
        )

    # Re-scale revenue to match annual total
    total_rev = sum(e["revenue_aud"] for e in entries)
    if total_rev > 0:
        rev_scale = annual_revenue / total_rev
        for e in entries:
            e["revenue_aud"] = round(e["revenue_aud"] * rev_scale, 0)

    return entries


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("Loading dunkelflaute seasonal data...")
    seasonal_lookup = load_seasonal_monthly()
    avg_shape = build_avg_seasonal_shape(seasonal_lookup)

    print("Loading league tables...")
    all_entries = load_league_tables()

    # Group by project_id -> collect (year, tech, proj) tuples
    project_years = {}
    for year, tech, proj in all_entries:
        pid = proj["project_id"]
        project_years.setdefault(pid, [])
        project_years[pid].append((year, tech, proj))

    print(f"Found {len(project_years)} unique projects across all years")

    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    all_project_ids = []
    all_years = set()

    for pid, year_entries in sorted(project_years.items()):
        # Use the first entry for static project metadata
        _, first_tech, first_proj = year_entries[0]

        # Determine the effective technology for this project
        effective_tech = first_proj["technology"]
        # For hybrid projects filed under solar league table, treat as solar
        if effective_tech == "hybrid":
            effective_tech = "solar"

        # For the file-level tech, use the league table tech
        file_tech = first_tech

        project_data = {
            "project_id": pid,
            "name": first_proj["name"],
            "technology": file_tech,
            "capacity_mw": first_proj["capacity_mw"],
            "state": first_proj["state"],
            "monthly": [],
        }

        if file_tech == "bess":
            project_data["storage_mwh"] = first_proj.get(
                "storage_mwh", first_proj["capacity_mw"] * 2
            )

        for year, tech, proj in sorted(year_entries, key=lambda x: x[0]):
            all_years.add(year)
            num_months = YTD_MAX_MONTH if year == YTD_YEAR else 12
            state = proj["state"]

            if file_tech == "bess":
                monthly_entries = generate_bess_monthly(
                    pid, state, year, proj, seasonal_lookup, avg_shape, num_months
                )
            elif file_tech == "pumped_hydro":
                monthly_entries = generate_hydro_monthly(
                    pid, state, year, proj, seasonal_lookup, avg_shape, num_months
                )
            else:
                # wind, solar, hybrid
                annual_cf = proj["capacity_factor_pct"]
                capacity_mw = proj["capacity_mw"]
                annual_energy = proj["energy_mwh"]
                annual_price = proj["energy_price_received"]
                annual_revenue = proj["revenue_aud"]

                monthly_cfs = generate_monthly_cfs(
                    pid,
                    effective_tech,
                    state,
                    year,
                    annual_cf,
                    seasonal_lookup,
                    avg_shape,
                    num_months,
                )

                # Calculate energy and revenue from CFs
                total_hours = sum(hours_in_month(year, m) for m in range(1, num_months + 1))
                rng = random.Random(project_seed(pid, year) + 1000)

                raw_entries = []
                for m, cf in monthly_cfs:
                    hrs = hours_in_month(year, m)
                    energy = capacity_mw * hrs * (cf / 100)

                    # Price varies monthly — higher in peak demand periods
                    # Summer (Dec-Feb) and winter evening (Jun-Aug) have higher prices
                    price_shape = {
                        1: 1.15, 2: 1.10, 3: 0.95, 4: 0.85, 5: 0.80,
                        6: 1.00, 7: 1.05, 8: 0.95, 9: 0.85, 10: 0.90,
                        11: 1.00, 12: 1.15,
                    }
                    price_mult = price_shape.get(m, 1.0)
                    price = annual_price * price_mult * (1 + rng.gauss(0, 0.06))
                    price = max(5.0, price)

                    revenue = energy * price
                    curtailment = max(0, rng.gauss(2.0, 1.2))

                    raw_entries.append(
                        {
                            "year": year,
                            "month": m,
                            "capacity_factor_pct": round(cf, 1),
                            "energy_mwh": round(energy, 1),
                            "revenue_aud": round(revenue, 0),
                            "energy_price_received": round(price, 2),
                            "curtailment_pct": round(curtailment, 1),
                        }
                    )

                # Scale energy to match annual total
                total_energy = sum(e["energy_mwh"] for e in raw_entries)
                if total_energy > 0:
                    e_scale = annual_energy / total_energy
                    for e in raw_entries:
                        e["energy_mwh"] = round(e["energy_mwh"] * e_scale, 1)

                # Scale revenue to match annual total
                total_rev = sum(e["revenue_aud"] for e in raw_entries)
                if total_rev > 0:
                    r_scale = annual_revenue / total_rev
                    for e in raw_entries:
                        e["revenue_aud"] = round(e["revenue_aud"] * r_scale, 0)

                monthly_entries = raw_entries

            project_data["monthly"].extend(monthly_entries)

        all_project_ids.append(pid)

        # Write project file
        out_path = OUTPUT_DIR / f"{pid}.json"
        with open(out_path, "w") as f:
            json.dump(project_data, f, indent=2)

    # Write index file
    index_data = {
        "projects": sorted(all_project_ids),
        "years": sorted(all_years),
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }
    with open(OUTPUT_DIR / "index.json", "w") as f:
        json.dump(index_data, f, indent=2)

    print(f"\nGenerated monthly data for {len(all_project_ids)} projects")
    print(f"Years: {sorted(all_years)}")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Index file: {OUTPUT_DIR / 'index.json'}")


if __name__ == "__main__":
    main()
