"""
Database helper — initialise SQLite and provide a connection.
"""
import os
import sqlite3

DB_DIR = os.path.join(os.path.dirname(__file__), '..', 'database')
DB_PATH = os.path.join(DB_DIR, 'aures.db')
SCHEMA_PATH = os.path.join(DB_DIR, 'schema.sql')


def get_connection(db_path: str = DB_PATH) -> sqlite3.Connection:
    """Return a connection with WAL mode and foreign keys enabled."""
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str = DB_PATH) -> sqlite3.Connection:
    """Create the database and run schema.sql if tables don't exist."""
    conn = get_connection(db_path)
    with open(SCHEMA_PATH, 'r') as f:
        conn.executescript(f.read())
    print(f"Database initialised at {os.path.abspath(db_path)}")
    return conn


if __name__ == '__main__':
    init_db()
