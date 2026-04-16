#!/usr/bin/env python3
"""Round 2: Apply notable text to remaining operating projects.

Only updates projects where notable IS NULL or empty — never overwrites.
"""

import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'aures.db')

UPDATES = [
    # ── Solar (26 remaining) ──
    ("kiamal-solar-farm-stage-1", "200 MW solar farm near Ouyen in Victoria's Mallee, developed by Total Eren (now TotalEnergies). One of the largest solar farms in Victoria. Stage 1 of a planned larger development."),
    ("edenvale-solar-park", "180 MW solar park in QLD. One of Queensland's larger utility-scale solar installations."),
    ("woolooga-solar-farm", "176 MW solar farm near Woolooga in QLD's Wide Bay region. Developed by Risen Energy."),
    ("wellington-solar-farm", "170 MW solar farm near Wellington, NSW. Developed by Lightsource BP. Located in the Central-West Orana REZ."),
    ("suntop-solar-farm", "150 MW solar farm near Orange, NSW. Developed by Canadian Solar / Recurrent Energy. Located in the Central-West Orana REZ."),
    ("finley-solar-farm", "133 MW solar farm near Finley in the Riverina, NSW. Developed by ESCO Pacific (now John Laing). One of the first large-scale solar farms in the southern Riverina."),
    ("darling-downs-solar-farm", "110 MW solar farm near Dalby, QLD. Developed by APA Group — one of Australia's first utility-scale solar farms built by a major pipeline/infrastructure company. Has a 12-year PPA with Origin Energy."),
    ("glenrowan-west-solar-farm", "110 MW solar farm near Glenrowan, VIC. Part of a cluster of solar farms in Victoria's north-east."),
    ("gunnedah-solar-farm", "110 MW solar farm near Gunnedah, NSW. Developed by Canadian Solar / Recurrent Energy."),
    ("port-augusta-renewable-energy-park-solar", "107 MW solar component of the Port Augusta Renewable Energy Park, SA. Co-located with 210 MW wind — one of Australia's largest hybrid renewable energy parks. Developed by DP Energy / Iberdrola."),
    ("nevertire-solar-farm", "105 MW solar farm near Nevertire in central western NSW. Developed by Canadian Solar / Recurrent Energy."),
    ("clare-solar-farm", "100 MW solar farm near Clare in North QLD. Developed by FRV (Abdul Latif Jameel). Has a PPA with AGL Energy."),
    ("west-wyalong-solar-farm", "90 MW solar farm near West Wyalong, NSW. Developed by Risen Energy."),
    ("hillston-sun-farm", "85 MW solar farm near Hillston in western NSW. Developed by Overland Sun Farming."),
    ("moura-solar-farm", "82 MW solar farm near Moura, Central QLD. Developed by Lightsource BP."),
    ("girgarre-solar-farm", "76 MW solar farm near Girgarre in Victoria's Goulburn Valley. Part of the growing cluster of solar developments in northern Victoria."),
    ("goonumbla-solar-farm", "70 MW solar farm near Parkes, NSW. Developed by Canadian Solar / Recurrent Energy."),
    ("wyalong-solar-farm", "53 MW solar farm near West Wyalong, NSW. Part of a cluster of solar developments in central western NSW."),
    ("gannawarra-solar-farm", "50 MW solar farm near Kerang, VIC. Co-located with a 25 MW / 50 MWh Tesla Megapack battery — one of Australia's first solar-plus-storage projects. Developed by Edify Energy. EnergyAustralia PPA."),
    ("jemalong-solar", "50 MW solar farm near Forbes, NSW. Developed by Genex Power. Located in central western NSW."),
    ("mokoan-solar-farm", "46 MW solar farm near Benalla, VIC. Developed by Elecnor."),
    ("limondale-solar-farm-2", "43 MW solar farm near Balranald, western NSW. Part of the Limondale solar complex. Now owned by RWE/BELECTRIC."),
    ("kingaroy-solar-farm", "40 MW solar farm near Kingaroy in QLD's South Burnett. Developed by Canadian Solar / Recurrent Energy."),
    ("junee-solar-farm", "30 MW solar farm near Junee, NSW. Developed by Canadian Solar / Recurrent Energy."),
    ("kerang-solar-plant", "30 MW solar plant near Kerang, VIC. Developed by Pacific Hydro (SPIC). One of Victoria's earlier utility-scale solar installations."),
    ("molong-solar-farm", "30 MW solar farm near Molong, NSW. Developed by Lightsource BP."),

    # ── Wind (26 remaining) ──
    ("yendon-wind-farm", "142 MW wind farm in Moorabool Shire near Ballarat, VIC. Part of the Lal Lal Wind Farm complex (228 MW total with Elaine). Vestas V136-3.8 MW turbines. Owned by Northleaf Capital / InfraRed Capital / Macquarie Capital consortium."),
    ("woolnorth-studland-bay-bluff-point", "138 MW across Studland Bay (75 MW) and Bluff Point (65 MW) wind farms at Woolnorth in NW Tasmania. Among the earliest large-scale wind farms in Tasmania, on one of the world's windiest coastlines. Operated by Hydro Tasmania."),
    ("hallett-stage-1-brown-hill", "133 MW (63 turbines) — Stage 1 of the multi-stage Hallett Wind Farm complex in SA's Mid North. Originally developed by AGL Energy. Now owned by Palisade Investment Partners."),
    ("hallett-4-north-brown-hill", "132 MW — Stage 4 (North Brown Hill) of the Hallett Wind Farm complex, SA. Part of AGL's 351 MW multi-site Hallett development ~180 km north of Adelaide."),
    ("mt-gellibrand-wind-farm", "132 MW wind farm in western Victoria near Colac. Developed by ACCIONA Energía. One of the larger wind farms in the Western Victoria REZ."),
    ("willogoleche-wind-farm", "120 MW, 32 Siemens Gamesa SG 3.4-132 turbines in SA's Mid North near Hallett. Built by ENGIE. 25-year Siemens Gamesa service agreement. COD December 2019."),
    ("granville-harbour-wind-farm", "111 MW wind farm on Tasmania's rugged west coast. 31 Vestas V117-3.6 MW turbines. Tasmania's second-largest wind farm. Developed by Palisade Investment Partners."),
    ("gullen-range-wind-farm-2", "111 MW Stage 2 extension of Gullen Range Wind Farm in NSW Southern Tablelands. Developed by BJCE Australia (Beijing Jingneng Clean Energy). GE turbines."),
    ("taralga-wind-farm", "107 MW, 51 Vestas V90-2.0 MW turbines near Taralga in NSW Southern Tablelands. Developed by CBD Energy, now owned by Energy Pacific (Marubeni subsidiary)."),
    ("crookwell-2-wind-farm", "91 MW wind farm near Crookwell in NSW Southern Tablelands. Part of one of Australia's earliest wind farm regions — the original Crookwell Wind Farm (1998) was the first in NSW."),
    ("wattle-point", "91 MW, 55 Vestas V80-1.65 MW turbines on Yorke Peninsula, SA. One of SA's earlier wind developments. Now owned by Infrastructure Capital Group."),
    ("hawkesdale-wind-farm", "90 MW wind farm near Hawkesdale in western Victoria. One of the cluster of wind farms in the Western Victoria REZ."),
    ("elaine-wind-farm", "82 MW wind farm in Moorabool Shire, VIC. Part of the Lal Lal Wind Farm complex (228 MW total with Yendon). Vestas V136-3.8 MW turbines. Owned by Northleaf Capital / InfraRed Capital / Macquarie Capital."),
    ("lake-bonney-1-wind-farm", "81 MW wind farm near Millicent, SA. Stage 1 of the Lake Bonney Wind Farm complex (three stages totalling ~278 MW). One of SA's earliest large-scale wind projects. Developed by Infigen Energy."),
    ("hallett-stage-2-hallett-hill", "71 MW — Stage 2 (Hallett Hill) of the multi-stage Hallett Wind Farm complex in SA's Mid North. Part of the 351 MW Hallett development. Now owned by Infrastructure Capital Group."),
    ("mt-millar-wind-farm", "70 MW wind farm on the Eyre Peninsula, SA. Meridian Energy. One of the earlier wind farms on the Eyre Peninsula."),
    ("oaklands-hill-wind-farm", "68 MW wind farm near Hamilton in western Victoria. Part of the cluster of wind farms in the Western Victoria REZ."),
    ("cherry-tree-wind-farm", "58 MW, 16 Vestas V136-3.6 MW turbines near Seymour in north-central Victoria. Tilt Renewables. COD June 2019. Community co-investment offered."),
    ("crookwell-3-wind-farm", "56 MW wind farm near Crookwell, NSW. Third stage in the Crookwell wind farm region — one of Australia's longest-running wind development areas since the original 1998 Crookwell Wind Farm."),
    ("hallett-5-the-bluff-wf", "53 MW — Stage 5 (The Bluff) of the Hallett Wind Farm complex, SA. Final stage of the 351 MW multi-site Hallett development. Developed by Eurus Energy (Japan)."),
    ("challicum-hills", "53 MW wind farm near Ararat, VIC. Pacific Hydro (SPIC). One of Victoria's earliest large-scale wind farms, commissioned 2003. 35 NEG Micon NM72 1.5 MW turbines."),
    ("gunning-wind-farm", "47 MW, 31 Senvion MM70 1.5 MW turbines near Gunning, NSW. Developed by Pamada. One of the earlier wind farms in the NSW Southern Tablelands."),
    ("lake-bonney-3-wind-farm", "39 MW — Stage 3 of the Lake Bonney Wind Farm near Millicent, SA. Vestas V90-3.0 MW turbines. Final stage of the ~278 MW Lake Bonney complex. Infigen Energy / Iberdrola."),
    ("starfish-hill", "35 MW, 23 NEG Micon NM60-1500 turbines at Cape Jervis, Fleurieu Peninsula, SA. Commissioned December 2003 — one of SA's earliest commercial wind farms. Developed by Tarong Energy, now owned by RATCH-Australia."),
    ("cullerin-range-wind-farm", "30 MW, 15 Senvion MM82 turbines on Cullerin Range, NSW. Developed by Origin Energy. One of the smaller utility-scale wind farms in the NSW Southern Tablelands. COD August 2009."),
    ("yambuk", "30 MW wind farm near Yambuk in western Victoria. Pacific Hydro / Energy Pacific. One of Victoria's earlier wind developments."),
]


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    print(f"Round 2 notable entries to apply: {len(UPDATES)}")

    applied = 0
    skipped_existing = 0
    skipped_not_found = 0

    for pid, notable in UPDATES:
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
