"""
NEMWEB BESS Bidding Data Importer
==================================
Downloads and parses BESS daily bidding data from AEMO's NEMWEB MMSDM
monthly archives (BIDDAYOFFER_D files). Imports energy and FCAS price
band offers for known BESS DUIDs into the bess_daily_bids table.

Data source:
  https://nemweb.com.au/Data_Archive/Wholesale_Electricity/MMSDM/

Usage:
    python3 pipeline/importers/import_nemweb_bids.py
    python3 pipeline/importers/import_nemweb_bids.py --months 6
    python3 pipeline/importers/import_nemweb_bids.py --start-year 2025 --start-month 1 --months 12
"""

import os
import sys
import csv
import io
import argparse
import tempfile
import zipfile
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import HTTPError

# Add parent to path so we can import db.py
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection, init_db

# ============================================================
# Configuration
# ============================================================

NEMWEB_URL_TEMPLATE = (
    "https://nemweb.com.au/Data_Archive/Wholesale_Electricity/MMSDM/"
    "{year}/MMSDM_{year}_{month:02d}/MMSDM_Historical_Data_SQLLoader/"
    "DATA/PUBLIC_ARCHIVE%23BIDDAYOFFER_D%23FILE01%23{year}{month:02d}010000.zip"
)

# Known BESS DUIDs mapped to AURES project IDs
BESS_DUIDS = {
    'HPR1': 'hornsdale-power-reserve',
    'VBB1': 'victorian-big-battery',
    'BBATTERY1': 'bouldercombe-battery-project',
    'WTAHB1': 'waratah-super-battery',
    'ERB01': 'eraring-battery',
    'NESBESS1': 'eraring-battery',
    'NESBESS2': 'eraring-battery',
    'SNB01': 'supernode-bess',
    'SNB02': 'supernode-bess',
    'TIB1': 'torrens-island-bess',
    'HBESS1': 'hazelwood-battery-energy-storage-system-hbess',
    'BHB1': 'broken-hill-bess',
    'TARBESS1': 'tarong-bess-stanwell',
    'ORABESS1': 'orana-bess',
    'LDBESS1': 'liddell-bess',
    'MRNBESS1': 'mornington-bess',
    'WDBESS1': 'western-downs-battery-stage-1-and-2',
    'WDBESS2': 'western-downs-battery-stage-1-and-2',
    'CGBESS01': 'clements-gap-bess',
    'PIBESS1': 'pine-lodge-bess',
    'CHBESS1': 'chinchilla-bess',
    'BLYTHB1': 'blyth-bess',
    'WALGRV1': 'wallgrove-grid-battery-project',
    'DPNTB1': 'riverina-bess',
    'RIVNB2': 'riverina-bess',
    'ADPBA1': 'dalrymple-bess',
    'BALB1': 'ballarat-energy-storage-system',
    'CAPBES1': 'capital-battery',
    'WANDB1': 'wandoan-south-bess',
    'RANGEB1': 'rangebank-bess',
    'BRNDBES1': 'brendale-bess',
    'LIMBESS1': 'latrobe-valley-bess',
    'TRGBESS1': 'terang-bess',
    'MLB01': 'eraring-battery',
}

# Bid types to import
VALID_BID_TYPES = {
    'ENERGY',
    'RAISE6SEC', 'RAISE60SEC', 'RAISE5MIN', 'RAISEREG',
    'LOWER6SEC', 'LOWER60SEC', 'LOWER5MIN', 'LOWERREG',
}

# Column positions in the D row (0-indexed from the start of the row)
# Row format: D,BID,BIDDAYOFFER_D,3,SETTLEMENTDATE,DUID,BIDTYPE,...
COL_SETTLEMENT_DATE = 4
COL_DUID = 5
COL_BIDTYPE = 6
COL_DIRECTION = 7
COL_OFFERDATE = 9
COL_VERSIONNO = 10
COL_PARTICIPANTID = 11
COL_REBID_EXPLANATION = 13
COL_PRICEBAND1 = 14
COL_PRICEBAND10 = 23
COL_MR_FACTOR = 31
COL_ENTRYTYPE = 32


# ============================================================
# Helper functions
# ============================================================

def safe_float(val):
    """Safely convert to float, returning None on failure."""
    if val is None or val == '':
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def safe_int(val):
    """Safely convert to int, returning None on failure."""
    if val is None or val == '':
        return None
    try:
        return int(val)
    except (ValueError, TypeError):
        return None


def clean_date(val):
    """Clean AEMO date string (remove quotes, normalize format)."""
    if not val:
        return None
    val = val.strip().strip('"')
    if not val:
        return None
    # AEMO format: "2026/03/01 00:00:00" -> "2026-03-01"
    try:
        dt = datetime.strptime(val, '%Y/%m/%d %H:%M:%S')
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    except ValueError:
        return val


def clean_settlement_date(val):
    """Clean settlement date to date-only format."""
    if not val:
        return None
    val = val.strip().strip('"')
    if not val:
        return None
    try:
        dt = datetime.strptime(val, '%Y/%m/%d %H:%M:%S')
        return dt.strftime('%Y-%m-%d')
    except ValueError:
        return val


# ============================================================
# Download and parse
# ============================================================

def download_month(year, month, tmp_dir):
    """Download a month's BIDDAYOFFER_D zip archive. Returns file path or None."""
    url = NEMWEB_URL_TEMPLATE.format(year=year, month=month)
    dest = os.path.join(tmp_dir, f"biddayoffer_{year}_{month:02d}.zip")

    print(f"  Downloading {year}-{month:02d}...", end=' ', flush=True)
    try:
        req = Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AURES-DB/2.8',
        })
        resp = urlopen(req, timeout=120)
        data = resp.read()
        with open(dest, 'wb') as f:
            f.write(data)
        size_mb = len(data) / (1024 * 1024)
        print(f"{size_mb:.1f} MB")
        return dest
    except HTTPError as e:
        if e.code == 404:
            print(f"not available (404)")
            return None
        raise
    except Exception as e:
        print(f"ERROR: {e}")
        return None


def parse_zip(zip_path):
    """
    Extract and parse the AEMO CSV from a BIDDAYOFFER_D zip file.
    Returns list of dicts for BESS rows only.
    """
    rows = []

    with zipfile.ZipFile(zip_path, 'r') as zf:
        # Find the CSV file inside the zip
        csv_names = [n for n in zf.namelist() if n.endswith('.CSV') or n.endswith('.csv')]
        if not csv_names:
            print(f"    WARNING: No CSV found in {zip_path}")
            return rows

        csv_name = csv_names[0]
        with zf.open(csv_name) as f:
            # Read as text
            text = f.read().decode('utf-8', errors='replace')

    reader = csv.reader(io.StringIO(text))
    total_d_rows = 0

    for fields in reader:
        if not fields or len(fields) < 2:
            continue

        row_type = fields[0].strip()

        # Only process D (data) rows
        if row_type != 'D':
            continue

        total_d_rows += 1

        # Ensure enough columns (need at least up to PRICEBAND10 at index 23)
        if len(fields) < COL_PRICEBAND10 + 1:
            continue

        duid = fields[COL_DUID].strip()
        bid_type = fields[COL_BIDTYPE].strip()

        # Filter: BESS DUIDs only
        if duid not in BESS_DUIDS:
            continue

        # Filter: valid bid types only
        if bid_type not in VALID_BID_TYPES:
            continue

        # Parse pricebands
        pricebands = []
        for i in range(COL_PRICEBAND1, COL_PRICEBAND10 + 1):
            pricebands.append(safe_float(fields[i]) if i < len(fields) else None)

        rows.append({
            'settlement_date': clean_settlement_date(fields[COL_SETTLEMENT_DATE]),
            'duid': duid,
            'project_id': BESS_DUIDS[duid],
            'bid_type': bid_type,
            'direction': fields[COL_DIRECTION].strip(),
            'participant_id': fields[COL_PARTICIPANTID].strip() if COL_PARTICIPANTID < len(fields) else None,
            'rebid_explanation': fields[COL_REBID_EXPLANATION].strip() if COL_REBID_EXPLANATION < len(fields) else None,
            'priceband1': pricebands[0],
            'priceband2': pricebands[1],
            'priceband3': pricebands[2],
            'priceband4': pricebands[3],
            'priceband5': pricebands[4],
            'priceband6': pricebands[5],
            'priceband7': pricebands[6],
            'priceband8': pricebands[7],
            'priceband9': pricebands[8],
            'priceband10': pricebands[9],
            'entry_type': fields[COL_ENTRYTYPE].strip() if COL_ENTRYTYPE < len(fields) else None,
            'offer_date': clean_date(fields[COL_OFFERDATE]) if COL_OFFERDATE < len(fields) else None,
            'version_no': safe_int(fields[COL_VERSIONNO]) if COL_VERSIONNO < len(fields) else None,
        })

    return rows


# ============================================================
# Database operations
# ============================================================

def ensure_table(conn):
    """Create the bess_daily_bids table if it doesn't exist."""
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS bess_daily_bids (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            settlement_date TEXT NOT NULL,
            duid TEXT NOT NULL,
            project_id TEXT,
            bid_type TEXT NOT NULL,
            direction TEXT NOT NULL,
            participant_id TEXT,
            rebid_explanation TEXT,
            priceband1 REAL, priceband2 REAL, priceband3 REAL, priceband4 REAL, priceband5 REAL,
            priceband6 REAL, priceband7 REAL, priceband8 REAL, priceband9 REAL, priceband10 REAL,
            entry_type TEXT,
            offer_date TEXT,
            version_no INTEGER,
            UNIQUE(settlement_date, duid, bid_type, direction, version_no)
        );
        CREATE INDEX IF NOT EXISTS idx_bess_bids_duid ON bess_daily_bids(duid);
        CREATE INDEX IF NOT EXISTS idx_bess_bids_date ON bess_daily_bids(settlement_date);
        CREATE INDEX IF NOT EXISTS idx_bess_bids_project ON bess_daily_bids(project_id);
    """)


def insert_rows(conn, rows):
    """Insert rows into bess_daily_bids. Returns count of actually inserted rows."""
    if not rows:
        return 0

    inserted = 0
    for row in rows:
        try:
            conn.execute("""
                INSERT OR IGNORE INTO bess_daily_bids (
                    settlement_date, duid, project_id, bid_type, direction,
                    participant_id, rebid_explanation,
                    priceband1, priceband2, priceband3, priceband4, priceband5,
                    priceband6, priceband7, priceband8, priceband9, priceband10,
                    entry_type, offer_date, version_no
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                row['settlement_date'], row['duid'], row['project_id'],
                row['bid_type'], row['direction'],
                row['participant_id'], row['rebid_explanation'],
                row['priceband1'], row['priceband2'], row['priceband3'],
                row['priceband4'], row['priceband5'], row['priceband6'],
                row['priceband7'], row['priceband8'], row['priceband9'],
                row['priceband10'],
                row['entry_type'], row['offer_date'], row['version_no'],
            ))
            if conn.total_changes:
                inserted += 1
        except Exception as e:
            # Log but continue — don't let one bad row kill the whole import
            print(f"    WARNING: Insert failed for {row['duid']} {row['settlement_date']}: {e}")

    return inserted


# ============================================================
# Main
# ============================================================

def compute_month_range(start_year, start_month, num_months):
    """Generate a list of (year, month) tuples."""
    months = []
    y, m = start_year, start_month
    for _ in range(num_months):
        months.append((y, m))
        m += 1
        if m > 12:
            m = 1
            y += 1
    return months


def main():
    parser = argparse.ArgumentParser(
        description='Import BESS bidding data from AEMO NEMWEB MMSDM archives'
    )
    parser.add_argument(
        '--months', type=int, default=24,
        help='Number of months to import (default: 24)'
    )
    parser.add_argument(
        '--start-year', type=int, default=None,
        help='Start year (default: computed from --months back from today)'
    )
    parser.add_argument(
        '--start-month', type=int, default=None,
        help='Start month (default: computed from --months back from today)'
    )
    args = parser.parse_args()

    # Compute date range
    now = datetime.now()
    if args.start_year and args.start_month:
        start_year = args.start_year
        start_month = args.start_month
    else:
        # Go back N months from current month
        total_months_back = args.months
        start_month_abs = (now.year * 12 + now.month - 1) - total_months_back + 1
        start_year = start_month_abs // 12
        start_month = (start_month_abs % 12) + 1

    month_range = compute_month_range(start_year, start_month, args.months)

    print("=" * 60)
    print("NEMWEB BESS Bidding Data Importer")
    print("=" * 60)
    print(f"Date range: {start_year}-{start_month:02d} to "
          f"{month_range[-1][0]}-{month_range[-1][1]:02d} ({args.months} months)")
    print(f"BESS DUIDs: {len(BESS_DUIDS)}")
    print(f"Bid types: {', '.join(sorted(VALID_BID_TYPES))}")
    print()

    # Connect to database
    conn = init_db()
    ensure_table(conn)

    # Track stats
    total_rows_downloaded = 0
    total_rows_inserted = 0
    months_processed = 0
    months_skipped = 0
    first_date = None
    last_date = None

    with tempfile.TemporaryDirectory(prefix='nemweb_bids_') as tmp_dir:
        for year, month in month_range:
            print(f"\n[{months_processed + months_skipped + 1}/{len(month_range)}] "
                  f"Processing {year}-{month:02d}...")

            # Download
            zip_path = download_month(year, month, tmp_dir)
            if zip_path is None:
                months_skipped += 1
                continue

            # Parse
            rows = parse_zip(zip_path)
            total_rows_downloaded += len(rows)
            print(f"    BESS rows extracted: {len(rows)}")

            if rows:
                # Track date range
                dates = [r['settlement_date'] for r in rows if r['settlement_date']]
                if dates:
                    min_date = min(dates)
                    max_date = max(dates)
                    if first_date is None or min_date < first_date:
                        first_date = min_date
                    if last_date is None or max_date > last_date:
                        last_date = max_date

                # Count by DUID for progress
                duid_counts = {}
                for r in rows:
                    duid_counts[r['duid']] = duid_counts.get(r['duid'], 0) + 1
                top_duids = sorted(duid_counts.items(), key=lambda x: -x[1])[:5]
                duid_summary = ', '.join(f"{d}={c}" for d, c in top_duids)
                print(f"    Top DUIDs: {duid_summary}")

                # Insert
                before_changes = conn.total_changes
                insert_rows(conn, rows)
                actually_inserted = conn.total_changes - before_changes
                total_rows_inserted += actually_inserted
                print(f"    Inserted: {actually_inserted} (skipped {len(rows) - actually_inserted} duplicates)")

                conn.commit()
            else:
                print(f"    No BESS bid rows found")

            # Clean up zip to save disk space
            try:
                os.remove(zip_path)
            except OSError:
                pass

            months_processed += 1

    # Log the import run
    try:
        conn.execute("""
            INSERT INTO import_runs (source, records_imported, records_new, completed_at, status)
            VALUES (?, ?, ?, datetime('now'), 'completed')
        """, ('nemweb_biddayoffer', total_rows_downloaded, total_rows_inserted))
        conn.commit()
    except Exception:
        pass  # import_runs might not exist in all schemas

    # Summary
    print()
    print("=" * 60)
    print("Import Summary")
    print("=" * 60)
    print(f"  Months processed:  {months_processed}")
    print(f"  Months skipped:    {months_skipped} (404 / not available)")
    print(f"  Total BESS rows:   {total_rows_downloaded}")
    print(f"  Rows inserted:     {total_rows_inserted}")
    if first_date and last_date:
        print(f"  Date range:        {first_date} to {last_date}")

    # Show per-project summary
    print()
    print("  Per-project breakdown:")
    try:
        for row in conn.execute("""
            SELECT project_id, COUNT(*) as cnt, MIN(settlement_date) as min_d, MAX(settlement_date) as max_d
            FROM bess_daily_bids
            GROUP BY project_id
            ORDER BY cnt DESC
        """):
            print(f"    {row['project_id']:50s}  {row['cnt']:6d} rows  ({row['min_d']} to {row['max_d']})")
    except Exception:
        pass

    total_in_table = conn.execute("SELECT COUNT(*) as c FROM bess_daily_bids").fetchone()['c']
    print(f"\n  Total rows in bess_daily_bids: {total_in_table}")

    conn.close()
    print(f"\n{'=' * 60}")
    print("Done!")
    print(f"{'=' * 60}")


if __name__ == '__main__':
    main()
