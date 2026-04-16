#!/usr/bin/env python3
"""Fix mismatched IDs from batch_apply_notable.py and apply remaining notable text.

Maps incorrect/guessed project IDs to actual DB IDs.
Only updates projects where notable IS NULL or empty — never overwrites.
"""

import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'aures.db')

# ID remapping: wrong_id → (correct_db_id, notable_text)
FIXES = [
    # ── Solar ID fixes ──
    ("sun-metals-corporation-solar-farm", "150 MW solar farm near Townsville, QLD. Developed by Sun Metals Corporation to directly power its adjacent Townsville zinc refinery — one of Australia's first behind-the-meter industrial-scale solar installations."),
    ("haughton-solar-farm-stage-1", "130 MW solar farm near Townsville, QLD. Developed by FRV (Abdul Latif Jameel). Stage 1 of a larger planned solar precinct in North Queensland."),
    ("emerald-solar-park", "~72 MW solar farm near Emerald, Central Queensland. Holds a PPA with Telstra — one of the first major corporate solar PPAs in Australia. Now owned by Lighthouse Infrastructure / RES Australia."),
    ("collinsville-pv", "90 MW solar farm near Collinsville, QLD. Developed by RATCH-Australia. Located adjacent to the former Collinsville coal power station site."),
    ("susan-river-solar-farm", "112 MW solar farm near Maryborough, QLD. Developed by Edify Energy. Holds a PPA with CleanCo Queensland."),
    ("tailem-bend-solar", "52 MW solar farm near Tailem Bend, SA. Developed by Vena Energy. Located adjacent to The Bend Motorsport Park and the former Tailem Bend gas-fired power station site."),
    ("kidston-solar-project-phase-one", "54 MW solar farm at the former Kidston gold mine, QLD. Developed by Genex Power as Stage 1 of the Kidston Clean Energy Hub, which also includes the 250 MW Kidston Pumped Storage Hydro project — a world-first use of a former mine for pumped hydro."),
    ("new-england-solar-farm", "720 MW hybrid solar-BESS project near Uralla in the New England REZ, NSW. Developed by ACEN Australia (formerly UPC/AC Renewables). One of Australia's largest renewable energy projects combining solar generation with battery storage."),

    # ── Wind ID fixes ──
    ("collector", "227 MW, 54 Vestas 4.2 MW turbines on the Cullerin Range in NSW Southern Tablelands. Developed by RATCH-Australia (Thai subsidiary). CEFC project debt financing."),
    ("moorabool-wind-farm", "312 MW across South (54 turbines) and North (50 turbines) sections — one of Victoria's largest wind farms. Developed, built and operated by Goldwind Australia using proprietary direct-drive turbines with 169m tip heights. Located ~25 km SE of Ballarat."),
    ("murra-warra-wind-farm-stage-1", "Stage 1 of the 435 MW Murra Warra Wind Farm complex near Horsham, VIC — 226 MW with 61 Senvion 3.7 MW turbines. University of Melbourne holds PPA. Developed by RES Group."),
    ("murra-warra-wind-farm-stage-2", "Stage 2 of the 435 MW Murra Warra Wind Farm complex near Horsham, VIC — 209 MW with 38 GE Cypress 5.5 MW turbines. Developed by Partners Group."),
    ("lincoln-gap-wind-farm-stage-1", "126 MW Stage 1 of the 212 MW Lincoln Gap Wind Farm near Port Augusta, SA. Developed by Nexif Energy. Senvion turbines. One of SA's windiest locations on the Eyre Peninsula."),
    ("lincoln-gap-wind-farm-stage-2", "86 MW Stage 2 of the 212 MW Lincoln Gap Wind Farm with co-located 10 MW battery, near Port Augusta, SA. Developed by Nexif Energy. CEFC debt financing."),
    ("mt-mercer-wind-farm", "131 MW, 64 Senvion MM92 turbines, ~30 km south of Ballarat, VIC. Developed by Meridian Energy (NZ) — Meridian's first Australian wind farm. A$260M. COD May 2014. Transferred to Tilt Renewables on demerger from Trustpower in 2016."),
    ("snowtown-s2-wind-farm", "132 MW, 90 Siemens direct-drive turbines (10x SWT-101 + 80x SWT-108) on the Barunga/Hummocks Ranges, SA. Developed by TrustPower, now owned by Palisade Investment Partners consortium. COD October 2014."),
    ("white-rock-wind-farm-stage-1", "175 MW, 70 Goldwind GW121-2.5 MW turbines in New England Tablelands, 20 km west of Glen Innes, NSW. Jointly owned by Goldwind Australia and CECEP Wind-Power Corporation. One of the first major Goldwind deployments in Australia. COD July 2017."),
    ("hornsdale-wind-farm-stage-1", "~102 MW Stage 1 of Neoen's 315 MW Hornsdale Wind Farm, co-located with the Hornsdale Power Reserve (Tesla Big Battery). Part of the iconic wind-plus-storage complex near Jamestown, SA."),
    ("hornsdale-wind-farm-stage-2", "~112 MW Stage 2 of Neoen's 315 MW Hornsdale Wind Farm. Central to Neoen's Australian operations near Jamestown, SA."),
    ("hornsdale-wind-farm-stage-3", "100 MW — third and final stage of Neoen's 315 MW Hornsdale Wind Farm. Co-located with the Hornsdale Power Reserve (world's first large-scale grid battery at commissioning). Central to Neoen's Australian operations near Jamestown, SA."),
    ("cathedral-rocks", "66 MW, 33 Vestas V80-2.0 MW turbines on the Eyre Peninsula, SA. 50/50 JV between EnergyAustralia and ACCIONA Energy. Construction started 2004; fully operational 2007."),
    ("portland-wind-farm", "~195 MW Portland Wind Energy Project across four stages (Cape Bridgewater, Cape Nelson North, Cape Nelson South, Cape Sir William Grant) by Pacific Hydro. One of Australia's oldest continuously developed wind projects, with stages from 2001 to 2015."),

    # ── Hydro ID fixes (combined stations) ──
    ("lemonthyme-wilmot", "Combined Lemonthyme (86 MW) and Wilmot (31 MW) hydro stations in the Mersey-Forth catchment, NW Tasmania. Part of Hydro Tasmania's eight-station Mersey-Forth cascade."),
    # catagunya-liapootah-wayatinah already applied correctly

    # ── Hydro that exist in DB ──
    ("barron-gorge", "66 MW underground hydro in Barron Gorge National Park, 20 km NW of Cairns, Far North QLD. First commissioned 1963, replacing a 1935 surface station — Queensland's first hydro. CleanCo Queensland. Severely damaged by Cyclone Jasper December 2023; returned to service mid-2024."),
    ("kareeya", "88 MW underground run-of-river hydro near Tully, Far North QLD. Four 22 MW Pelton turbines. Commenced 1957. CleanCo Queensland. Set a new station generation record of ~691,000 MWh in calendar year 2024."),
    ("eildon", "120 MW hydro at Lake Eildon on the Goulburn River, VIC. AGL Energy. Part of the Kiewa Hydroelectric Scheme. Completed 1957. Expanded with a second power station in 1955."),
    ("dartmouth", "150 MW underground hydro at Dartmouth Dam, VIC — Australia's highest dam (180m). Part of the Kiewa Scheme. AGL Energy. Commissioned 1980. Provides critical water storage and peaking generation for the Victorian grid."),
    ("west-kiewa", "62 MW hydro in NE Victoria, part of the Kiewa Hydroelectric Scheme — Victoria's largest hydro scheme. AGL Energy. Located in the Australian Alps near Mount Beauty."),
    ("blowering", "80 MW hydro at Blowering Dam on the Tumut River, NSW. Part of the Snowy Mountains Scheme catchment. Snowy Hydro. Commissioned 1968."),
    ("guthega", "60 MW hydro, part of the Snowy Mountains Scheme. Commissioned 1955 as one of the earliest Snowy stations. Snowy Hydro."),
    ("lake-echo", "32 MW hydro at Lake Echo in Tasmania's Central Highlands. Part of the Derwent scheme. Hydro Tasmania."),
    ("repulse", "28 MW hydro on the Derwent River, Tasmania. Part of the eleven-station Derwent cascade. Hydro Tasmania."),
]


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    print(f"Notable text fixes to apply: {len(FIXES)}")

    applied = 0
    skipped_existing = 0
    skipped_not_found = 0

    for pid, notable in FIXES:
        row = conn.execute(
            "SELECT id, notable FROM projects WHERE id = ?", (pid,)
        ).fetchone()

        if not row:
            print(f"  NOT FOUND: {pid}")
            skipped_not_found += 1
            continue

        if row['notable'] and row['notable'].strip():
            print(f"  SKIP (existing): {pid}")
            skipped_existing += 1
            continue

        conn.execute(
            "UPDATE projects SET notable = ? WHERE id = ?",
            (notable, pid)
        )
        print(f"  APPLIED: {pid}")
        applied += 1

    conn.commit()
    conn.close()

    print(f"\nResults:")
    print(f"  Applied: {applied}")
    print(f"  Skipped (existing notable): {skipped_existing}")
    print(f"  Skipped (not found): {skipped_not_found}")
    print(f"  Total: {applied + skipped_existing + skipped_not_found}")


if __name__ == '__main__':
    main()
