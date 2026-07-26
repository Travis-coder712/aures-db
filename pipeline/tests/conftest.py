"""Shared pytest fixtures for the AURES pipeline test suite.

Tests never touch the production database. Each test that needs the DB
gets a fresh SQLite file in a pytest-managed tmp_path, initialised from
`database/schema.sql`.
"""
import os
import sys

import pytest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PIPELINE_DIR = os.path.join(REPO_ROOT, 'pipeline')

# Put `pipeline/` on sys.path so importers can `from db import ...` as they do
# in production. Also put the repo root on sys.path so tests can import
# `pipeline.<module>` if they prefer.
for p in (PIPELINE_DIR, REPO_ROOT):
    if p not in sys.path:
        sys.path.insert(0, p)


@pytest.fixture
def fresh_db(tmp_path):
    """Return a sqlite3.Connection to a fresh DB initialised from schema.sql.

    The DB lives under pytest's tmp_path so it's auto-cleaned. Foreign keys
    are ON (matches production `get_connection`).
    """
    import db as db_module

    db_path = str(tmp_path / 'aures-test.db')
    conn = db_module.init_db(db_path)
    yield conn
    conn.close()


@pytest.fixture
def sample_gi_workbook():
    """Path to the smallest checked-in AEMO GI snapshot for tests."""
    path = os.path.join(REPO_ROOT, 'data', 'gi_snapshots', 'gi-2026-01.xlsx')
    if not os.path.exists(path):
        pytest.skip(f'Test workbook missing: {path}')
    return path
