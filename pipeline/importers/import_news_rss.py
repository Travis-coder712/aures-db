#!/usr/bin/env python3
"""
Import news articles from Australian renewable energy RSS feeds.

Sources:
  - RenewEconomy (reneweconomy.com.au)
  - PV Magazine Australia (pv-magazine-australia.com)
  - Energy Storage News (energy-storage.news)

Fuzzy-matches article titles against project names to tag related projects.

Usage:
    python3 pipeline/importers/import_news_rss.py
"""
import json
import os
import re
import sys
from datetime import datetime
from difflib import SequenceMatcher
from email.utils import parsedate_to_datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection

try:
    import feedparser
except ImportError:
    print("ERROR: feedparser not installed. Run: pip install feedparser")
    sys.exit(1)

# RSS feed URLs
FEEDS = [
    {
        'name': 'RenewEconomy',
        'url': 'https://reneweconomy.com.au/feed/',
        'source_id': 'reneweconomy',
    },
    {
        'name': 'PV Magazine Australia',
        'url': 'https://www.pv-magazine-australia.com/feed/',
        'source_id': 'pv-magazine',
    },
    {
        'name': 'Energy Storage News',
        'url': 'https://www.energy-storage.news/feed/',
        'source_id': 'energy-storage-news',
    },
]

MATCH_THRESHOLD = 0.6  # Minimum similarity for project matching


def ensure_news_table(conn):
    """Create the news_articles table if it doesn't exist."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS news_articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            url TEXT NOT NULL UNIQUE,
            source TEXT NOT NULL,
            published_date TEXT NOT NULL,
            summary TEXT,
            matched_project_ids TEXT,
            import_date TEXT DEFAULT (date('now')),
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.commit()


def get_project_names(conn):
    """Fetch all project names and IDs for fuzzy matching."""
    rows = conn.execute("SELECT id, name FROM projects").fetchall()
    return [(r['id'], r['name']) for r in rows]


def clean_html(text):
    """Strip HTML tags from text."""
    if not text:
        return ''
    return re.sub(r'<[^>]+>', '', text).strip()


def match_projects(title, summary, projects, threshold=MATCH_THRESHOLD):
    """Fuzzy-match article text against project names."""
    matched = []
    text = f"{title} {summary}".lower()

    for pid, pname in projects:
        # Try exact substring match first (case-insensitive)
        if pname.lower() in text:
            matched.append(pid)
            continue

        # Try fuzzy matching on the project name
        ratio = SequenceMatcher(None, pname.lower(), title.lower()).ratio()
        if ratio >= threshold:
            matched.append(pid)
            continue

        # Try matching significant words (3+ chars) from project name
        words = [w for w in pname.lower().split() if len(w) >= 4]
        if len(words) >= 2:
            word_matches = sum(1 for w in words if w in text)
            if word_matches >= 2:
                matched.append(pid)

    return list(set(matched))  # Deduplicate


def parse_date(entry):
    """Extract and normalize publication date from feed entry."""
    if hasattr(entry, 'published_parsed') and entry.published_parsed:
        try:
            dt = datetime(*entry.published_parsed[:6])
            return dt.strftime('%Y-%m-%d')
        except (ValueError, TypeError):
            pass

    if hasattr(entry, 'published') and entry.published:
        try:
            dt = parsedate_to_datetime(entry.published)
            return dt.strftime('%Y-%m-%d')
        except (ValueError, TypeError):
            pass

    if hasattr(entry, 'updated_parsed') and entry.updated_parsed:
        try:
            dt = datetime(*entry.updated_parsed[:6])
            return dt.strftime('%Y-%m-%d')
        except (ValueError, TypeError):
            pass

    return datetime.now().strftime('%Y-%m-%d')


def import_feed(conn, feed_config, projects):
    """Import articles from a single RSS feed."""
    name = feed_config['name']
    url = feed_config['url']
    source_id = feed_config['source_id']

    print(f"\n  Fetching {name}...")

    try:
        feed = feedparser.parse(url)
    except Exception as e:
        print(f"    ERROR: Failed to fetch {name}: {e}")
        return 0, 0

    if feed.bozo and not feed.entries:
        print(f"    WARNING: Feed parse error for {name}: {feed.bozo_exception}")
        return 0, 0

    imported = 0
    skipped = 0

    for entry in feed.entries:
        title = clean_html(getattr(entry, 'title', ''))
        link = getattr(entry, 'link', '')
        summary = clean_html(getattr(entry, 'summary', ''))

        if not title or not link:
            continue

        # Truncate summary to 500 chars
        if len(summary) > 500:
            summary = summary[:497] + '...'

        pub_date = parse_date(entry)
        matched_ids = match_projects(title, summary, projects)
        matched_json = json.dumps(matched_ids) if matched_ids else None

        try:
            conn.execute("""
                INSERT INTO news_articles (title, url, source, published_date, summary, matched_project_ids)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(url) DO UPDATE SET
                    title = excluded.title,
                    summary = excluded.summary,
                    matched_project_ids = excluded.matched_project_ids,
                    import_date = date('now')
            """, (title, link, source_id, pub_date, summary, matched_json))
            imported += 1
        except Exception as e:
            print(f"    ERROR inserting article: {e}")
            skipped += 1

    conn.commit()
    print(f"    {imported} articles imported, {skipped} skipped")
    return imported, skipped


def log_import_run(conn, source, started, completed, status, records_imported=0, error_msg=None):
    """Log this import run to import_runs table."""
    try:
        conn.execute("""
            INSERT INTO import_runs (source, started_at, completed_at, status, records_imported, error_message)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (source, started, completed, status, records_imported, error_msg))
        conn.commit()
    except Exception:
        pass  # import_runs table may not exist


def main():
    started = datetime.now().isoformat()
    conn = get_connection()
    ensure_news_table(conn)

    projects = get_project_names(conn)
    print(f"Loaded {len(projects)} projects for matching")

    total_imported = 0
    total_skipped = 0

    for feed_config in FEEDS:
        imported, skipped = import_feed(conn, feed_config, projects)
        total_imported += imported
        total_skipped += skipped

    completed = datetime.now().isoformat()
    print(f"\nTotal: {total_imported} articles imported, {total_skipped} skipped")

    # Log the run
    log_import_run(conn, 'news_rss', started, completed, 'completed', total_imported)

    # Print summary of matched articles
    matched_count = conn.execute(
        "SELECT COUNT(*) as c FROM news_articles WHERE matched_project_ids IS NOT NULL"
    ).fetchone()['c']
    total_count = conn.execute("SELECT COUNT(*) as c FROM news_articles").fetchone()['c']
    print(f"Total articles in DB: {total_count}, with project matches: {matched_count}")

    conn.close()


if __name__ == '__main__':
    main()
