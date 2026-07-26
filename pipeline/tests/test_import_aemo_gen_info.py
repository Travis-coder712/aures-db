"""Tests for pipeline/importers/import_aemo_gen_info.py.

Focus: idempotency and referential integrity of the AEMO Generation
Information importer. Uses the checked-in `data/gi_snapshots/gi-2026-01.xlsx`
against a fresh, empty SQLite DB — no network, no production DB touched.

Run:
    export PATH="$HOME/Library/Python/3.9/bin:$PATH"
    pytest pipeline/tests -v
"""
import os

import openpyxl
import pytest

from importers import import_aemo_gen_info as importer


def _run_import(conn, workbook_path):
    """Run the importer end-to-end against a caller-supplied DB connection."""
    sites = importer.parse_excel(workbook_path)
    filtered = importer.filter_sites(sites)
    importer.import_to_database(filtered, os.path.basename(workbook_path), conn=conn)


def _row_count(conn, table):
    return conn.execute(f'SELECT COUNT(*) FROM {table}').fetchone()[0]


def test_aemo_gi_same_file_twice_no_row_change(fresh_db, sample_gi_workbook):
    """Running the importer twice against the same file must be a no-op on
    the second run — no duplicated rows, no extra source_references."""
    _run_import(fresh_db, sample_gi_workbook)
    rows_after_first = _row_count(fresh_db, 'aemo_generation_info')
    sources_after_first = _row_count(fresh_db, 'source_references')

    _run_import(fresh_db, sample_gi_workbook)
    rows_after_second = _row_count(fresh_db, 'aemo_generation_info')
    sources_after_second = _row_count(fresh_db, 'source_references')

    assert rows_after_first == rows_after_second, (
        f'aemo_generation_info grew from {rows_after_first} → {rows_after_second} '
        f'on a repeat import — importer is not idempotent.'
    )
    assert sources_after_first == sources_after_second, (
        f'source_references grew from {sources_after_first} → {sources_after_second} '
        f'on a repeat import — INSERT OR IGNORE is not firing.'
    )


def test_aemo_gi_row_count_matches_source(fresh_db, sample_gi_workbook):
    """The DB row count should match the count of rows in the source workbook
    that survive the importer's own filters (min capacity, valid NEM region,
    renewable tech, consolidated-project guard) — allowing for a small number
    of byte-for-byte identical source rows collapsed by UPSERT."""
    _run_import(fresh_db, sample_gi_workbook)
    db_rows = _row_count(fresh_db, 'aemo_generation_info')

    # Count what the importer's filter path would keep from the source.
    sites = importer.parse_excel(sample_gi_workbook)
    filtered = importer.filter_sites(sites)
    kept_unit_rows = sum(len(site['units']) for site in filtered.values())

    # DB rows should be <= kept_unit_rows (UPSERT may collapse identical rows).
    # Also should be within a reasonable margin (< 10 rows collapsed by UPSERT
    # in the current jan-2026 workbook — 2 as of writing).
    assert db_rows <= kept_unit_rows, (
        f'DB has {db_rows} rows but source only kept {kept_unit_rows}. '
        f'Rows appeared from nowhere?'
    )
    assert kept_unit_rows - db_rows < 20, (
        f'UPSERT collapsed {kept_unit_rows - db_rows} rows — larger than expected. '
        f'The natural key may be too coarse (dropping distinguishable rows).'
    )


def test_aemo_gi_natural_key_unique(fresh_db, sample_gi_workbook):
    """The natural key must be unique. If this fails, the UNIQUE index is
    missing or the (snapshot, station, duid, unit_name) tuple doesn't
    distinguish every row it should."""
    _run_import(fresh_db, sample_gi_workbook)

    total_rows = _row_count(fresh_db, 'aemo_generation_info')
    distinct_keys = fresh_db.execute("""
        SELECT COUNT(DISTINCT snapshot || '|' || station_name || '|'
                     || COALESCE(duid, '') || '|' || COALESCE(unit_name, ''))
        FROM aemo_generation_info
    """).fetchone()[0]

    assert total_rows == distinct_keys, (
        f'Found {total_rows} rows but only {distinct_keys} unique natural keys. '
        f'UNIQUE(snapshot, station_name, COALESCE(duid,\'\'), COALESCE(unit_name,\'\')) '
        f'is not being enforced.'
    )


def test_aemo_gi_project_id_references_exist(fresh_db, sample_gi_workbook):
    """Every non-NULL project_id in aemo_generation_info must reference an
    existing row in projects. A dangling FK indicates the importer wrote to
    a project it didn't also create/link."""
    _run_import(fresh_db, sample_gi_workbook)

    orphans = fresh_db.execute("""
        SELECT a.project_id, COUNT(*) AS n
        FROM aemo_generation_info a
        LEFT JOIN projects p ON p.id = a.project_id
        WHERE a.project_id IS NOT NULL
          AND a.project_id != ''
          AND p.id IS NULL
        GROUP BY a.project_id
    """).fetchall()

    assert not orphans, (
        f'Found {len(orphans)} project_id values in aemo_generation_info with '
        f'no matching row in projects. Examples: '
        f'{[dict(r) for r in orphans[:5]]}'
    )
