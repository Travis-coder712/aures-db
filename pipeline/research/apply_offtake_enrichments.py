"""Apply enriched offtake research results to the SQLite database.

Reads the four JSON files produced by the v2.21.0 research agents:

    /tmp/offtakes-research/gentailers-results.json
    /tmp/offtakes-research/state-owned-results.json
    /tmp/offtakes-research/government-results.json
    /tmp/offtakes-research/corporates-results.json

Each is an array of:

    {
        "id": <offtakes.id>,
        "project_id": "<project_id>",
        "party": "<party>",
        "notes": "<free-text, not stored>",
        "updates": {
            "capacity_mw": <number|null>,
            "volume_structure": "<string|null>",
            "price_aud_per_mwh": <number|null>,
            "price_structure": "<string|null>",
            "price_notes": "<string|null>",
            "term_years": <int|null>,
            "start_date": "<ISO date|null>",
            "end_date": "<ISO date|null>",
            "tenor_description": "<string|null>",
            "sources": [{"url": "...", "title": "...", "accessed": "YYYY-MM-DD"}],
            "data_confidence": "high|medium|low|inferred"
        }
    }

Rules:
- Never overwrite a DB field with `null`. The agent returning null means
  "not found", which should leave the existing value in place.
- `sources` is merged with the existing `source_url` — if `source_url` is
  present, it becomes the first entry in the serialised `sources` JSON.
- `last_verified` is stamped to today.
- Run with `--dry-run` first to see a summary of what will change without
  writing.

Usage:
    python3 pipeline/research/apply_offtake_enrichments.py [--dry-run]
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import sqlite3
import sys
from datetime import date
from typing import Any

RESULTS_GLOB = '/tmp/offtakes-research/*-results.json'
DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'aures.db')

# Columns we will set from the `updates` object. Key = DB column, value = type hint.
UPDATABLE = {
    'capacity_mw': float,
    'volume_structure': str,
    'price_aud_per_mwh': float,
    'price_structure': str,
    'price_notes': str,
    'term_years': int,
    'start_date': str,
    'end_date': str,
    'tenor_description': str,
    'data_confidence': str,
}


def coerce(val: Any, kind: type) -> Any:
    if val is None or val == '':
        return None
    try:
        return kind(val)
    except (TypeError, ValueError):
        return None


def load_all_results() -> list[dict]:
    files = sorted(glob.glob(RESULTS_GLOB))
    all_rows: list[dict] = []
    for path in files:
        try:
            with open(path) as f:
                data = json.load(f)
        except (OSError, json.JSONDecodeError) as e:
            print(f'  ! skipping {path}: {e}')
            continue
        if not isinstance(data, list):
            print(f'  ! skipping {path}: top-level not a JSON array')
            continue
        print(f'  {os.path.basename(path)}: {len(data)} rows')
        all_rows.extend(data)
    return all_rows


def merge_sources(existing_url: str | None, existing_sources_json: str | None,
                  new_sources: list[dict] | None) -> str | None:
    combined: list[dict] = []
    seen_urls: set[str] = set()

    # Existing source_url (legacy single-URL column)
    if existing_url:
        combined.append({'url': existing_url, 'title': None, 'accessed': None, 'legacy': True})
        seen_urls.add(existing_url)

    # Previously-stored sources (from a prior enrichment pass)
    if existing_sources_json:
        try:
            old = json.loads(existing_sources_json)
            if isinstance(old, list):
                for entry in old:
                    url = entry.get('url') if isinstance(entry, dict) else None
                    if url and url not in seen_urls:
                        combined.append(entry)
                        seen_urls.add(url)
        except json.JSONDecodeError:
            pass

    # New sources from this pass
    for entry in (new_sources or []):
        if not isinstance(entry, dict):
            continue
        url = entry.get('url')
        if not url or url in seen_urls:
            continue
        combined.append({
            'url': url,
            'title': entry.get('title'),
            'accessed': entry.get('accessed'),
        })
        seen_urls.add(url)

    if not combined:
        return None
    return json.dumps(combined, ensure_ascii=False)


def apply(dry_run: bool = False) -> None:
    rows = load_all_results()
    print(f'\nLoaded {len(rows)} research results.\n')
    if not rows:
        print('No research results found. Aborting.')
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    updated = 0
    filled = {k: 0 for k in UPDATABLE}
    filled['sources'] = 0
    new_sources_added = 0

    for row in rows:
        offtake_id = row.get('id')
        updates = row.get('updates') or {}
        if not offtake_id or not updates:
            continue

        existing = conn.execute(
            'SELECT id, source_url, sources, price_aud_per_mwh, capacity_mw, term_years '
            'FROM offtakes WHERE id = ?',
            (offtake_id,),
        ).fetchone()
        if not existing:
            print(f'  ! no offtake row for id={offtake_id} (party={row.get("party")})')
            continue

        set_clauses: list[str] = []
        params: list[Any] = []

        for col, kind in UPDATABLE.items():
            new_val = coerce(updates.get(col), kind)
            if new_val is None:
                continue
            set_clauses.append(f'{col} = ?')
            params.append(new_val)
            filled[col] += 1

        # Sources merge
        merged_sources = merge_sources(
            existing['source_url'],
            existing['sources'],
            updates.get('sources'),
        )
        if merged_sources:
            set_clauses.append('sources = ?')
            params.append(merged_sources)
            filled['sources'] += 1
            new_sources_added += len(updates.get('sources') or [])

        # Always stamp last_verified when we write anything
        if set_clauses:
            set_clauses.append('last_verified = ?')
            params.append(date.today().isoformat())

            if not dry_run:
                params.append(offtake_id)
                conn.execute(
                    f'UPDATE offtakes SET {", ".join(set_clauses)} WHERE id = ?',
                    params,
                )
            updated += 1

    if not dry_run:
        conn.commit()

    print(f'\n{"[DRY RUN] " if dry_run else ""}Summary')
    print(f'  offtakes touched: {updated}')
    for col, n in filled.items():
        print(f'    {col:25s} filled on {n} rows')
    print(f'  new source URLs added: {new_sources_added}')

    conn.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dry-run', action='store_true', help='Show what would change, no writes')
    args = parser.parse_args()
    apply(dry_run=args.dry_run)
