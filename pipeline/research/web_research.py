"""
Web Research Pipeline
=====================
Searches RenewEconomy and other public sources for project information.
Extracts timeline, PPA/offtake, planning, and ownership mentions.

Outputs structured JSON reports for human review — does NOT auto-insert into DB.

Usage:
    python3 pipeline/research/web_research.py --project "Melbourne Renewable Energy Hub"
    python3 pipeline/research/web_research.py --list pipeline/research/priority-projects.txt
    python3 pipeline/research/web_research.py --id melbourne-renewable-energy-hub-bess

Dependencies:
    pip install requests beautifulsoup4
"""

import os
import sys
import json
import re
import time
import argparse
from datetime import datetime
from urllib.parse import quote_plus

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Missing dependencies. Run: pip install requests beautifulsoup4")
    sys.exit(1)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'output')
os.makedirs(OUTPUT_DIR, exist_ok=True)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
}

# Patterns to extract from article text
PATTERNS = {
    'cod_mentions': [
        r'(?:commercial\s+operation|COD|commissioning|operating)\s+(?:date\s+)?(?:of|in|by|from|expected|planned|targeted|scheduled)\s+(\w+\s+\d{4}|\d{4})',
        r'(?:begin|start|commence)\s+(?:operating|generating|operation)\s+(?:in|by|from)\s+(\w+\s+\d{4}|\d{4})',
        r'(?:online|operational)\s+(?:in|by|from)\s+(\w+\s+\d{4}|\d{4})',
        r'(?:expected|planned|targeted)\s+(?:to be|to come)\s+(?:online|operational|completed)\s+(?:in|by)\s+(\w+\s+\d{4}|\d{4})',
    ],
    'ppa_mentions': [
        r'(?:PPA|power\s+purchase\s+agreement|offtake\s+agreement|offtake\s+contract)\s+with\s+([\w\s&]+?)(?:\.|,|\s+for)',
        r'(?:signed|secured|entered|agreed)\s+(?:a\s+)?(?:PPA|offtake|contract)\s+(?:with|from)\s+([\w\s&]+?)(?:\.|,)',
        r'(?:contracted|supply|supplying)\s+(?:power|electricity|energy)\s+to\s+([\w\s&]+?)(?:\.|,)',
    ],
    'planning_mentions': [
        r'(?:planning\s+approval|development\s+approval|DA\s+approved|planning\s+consent|approved\s+by)',
        r'(?:EPBC\s+approval|EPBC\s+referral|Environment\s+Protection)',
        r'(?:submitted\s+(?:a\s+)?(?:planning|development)\s+application|lodged\s+(?:a\s+)?DA)',
        r'(?:IPC|Independent\s+Planning\s+Commission)',
    ],
    'ownership_mentions': [
        r'(?:acquired|purchased|bought)\s+(?:by|from)\s+([\w\s&]+?)(?:\.|,)',
        r'(?:sold|divested|transferred)\s+to\s+([\w\s&]+?)(?:\.|,)',
        r'(?:joint\s+venture|partnership)\s+(?:with|between)\s+([\w\s&]+?)(?:\.|,)',
    ],
    'cost_mentions': [
        r'\$(\d+(?:\.\d+)?)\s*(?:billion|bn)',
        r'\$(\d+(?:\.\d+)?)\s*(?:million|mn|m(?:\s|,|\.))',
    ],
    'construction_mentions': [
        r'(?:construction\s+(?:has\s+)?(?:begun|started|commenced|underway))',
        r'(?:first\s+(?:turbine|panel|battery)\s+(?:installed|erected|delivered))',
        r'(?:financial\s+close|FID|final\s+investment\s+decision)',
    ],
}


def search_reneweconomy(project_name, max_results=10):
    """Search RenewEconomy for articles about a project."""
    results = []
    search_url = f"https://reneweconomy.com.au/?s={quote_plus(project_name)}"

    try:
        resp = requests.get(search_url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            print(f"  RenewEconomy search returned {resp.status_code}")
            return results

        soup = BeautifulSoup(resp.text, 'html.parser')

        # Find article links in search results
        articles = soup.select('article a[href], .entry-title a[href], h2 a[href]')
        seen = set()
        for a in articles:
            url = a.get('href', '')
            title = a.get_text(strip=True)
            if url and title and url not in seen and 'reneweconomy.com.au' in url and len(title) > 10:
                seen.add(url)
                results.append({'url': url, 'title': title, 'source': 'RenewEconomy'})
                if len(results) >= max_results:
                    break

    except Exception as e:
        print(f"  RenewEconomy search error: {e}")

    return results


def search_google(project_name, site=None, max_results=10):
    """Search Google for articles about a project (optionally restricted to a site)."""
    results = []
    query = f'"{project_name}" renewable energy'
    if site:
        query += f' site:{site}'

    search_url = f"https://www.google.com/search?q={quote_plus(query)}&num={max_results}"

    try:
        resp = requests.get(search_url, headers={
            **HEADERS,
            'Accept': 'text/html',
            'Accept-Language': 'en-AU,en;q=0.9',
        }, timeout=15)

        if resp.status_code != 200:
            print(f"  Google search returned {resp.status_code}")
            return results

        soup = BeautifulSoup(resp.text, 'html.parser')

        for a in soup.select('a[href]'):
            href = a.get('href', '')
            if '/url?q=' in href:
                url = href.split('/url?q=')[1].split('&')[0]
                title = a.get_text(strip=True)
                if url and title and not url.startswith('/') and len(title) > 10:
                    results.append({'url': url, 'title': title, 'source': 'Google'})
                    if len(results) >= max_results:
                        break

    except Exception as e:
        print(f"  Google search error: {e}")

    return results


def fetch_article_text(url):
    """Fetch and extract article text from a URL."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            return None

        soup = BeautifulSoup(resp.text, 'html.parser')

        # Remove script, style, nav, footer elements
        for tag in soup.select('script, style, nav, footer, header, aside, .comments, .sidebar'):
            tag.decompose()

        # Try article content first, then main, then body
        content = soup.select_one('article, .entry-content, .post-content, main, .content')
        if content:
            text = content.get_text(separator=' ', strip=True)
        else:
            text = soup.get_text(separator=' ', strip=True)

        # Extract date
        date = None
        time_tag = soup.select_one('time[datetime]')
        if time_tag:
            date = time_tag.get('datetime', '')[:10]
        else:
            date_meta = soup.select_one('meta[property="article:published_time"], meta[name="date"]')
            if date_meta:
                date = date_meta.get('content', '')[:10]

        return {'text': text[:10000], 'date': date}  # Cap at 10k chars

    except Exception as e:
        print(f"    Error fetching {url}: {e}")
        return None


def extract_mentions(text, project_name):
    """Extract structured mentions from article text."""
    mentions = {}

    for category, patterns in PATTERNS.items():
        found = []
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                # Get surrounding context (100 chars before and after)
                start = max(0, match.start() - 100)
                end = min(len(text), match.end() + 100)
                context = text[start:end].strip()
                found.append({
                    'match': match.group(0),
                    'captured': match.group(1) if match.lastindex else None,
                    'context': context,
                })
        if found:
            mentions[category] = found

    return mentions


def research_project(project_name, project_id=None):
    """Research a single project across multiple sources."""
    print(f"\nResearching: {project_name}")
    report = {
        'project_name': project_name,
        'project_id': project_id,
        'researched_at': datetime.now().isoformat(),
        'articles': [],
        'extracted': {
            'cod_mentions': [],
            'ppa_mentions': [],
            'planning_mentions': [],
            'ownership_mentions': [],
            'cost_mentions': [],
            'construction_mentions': [],
        },
        'summary': {},
    }

    # Search sources
    print("  Searching RenewEconomy...")
    re_results = search_reneweconomy(project_name, max_results=5)
    time.sleep(1)

    print("  Searching Google...")
    google_results = search_google(project_name, max_results=5)
    time.sleep(1)

    # Combine and deduplicate
    all_results = re_results + google_results
    seen_urls = set()
    unique_results = []
    for r in all_results:
        if r['url'] not in seen_urls:
            seen_urls.add(r['url'])
            unique_results.append(r)

    print(f"  Found {len(unique_results)} unique articles")

    # Fetch and analyze each article
    for i, result in enumerate(unique_results[:8]):  # Cap at 8 articles
        print(f"  [{i+1}/{min(len(unique_results), 8)}] Fetching: {result['title'][:60]}...")
        article = fetch_article_text(result['url'])
        time.sleep(0.5)

        if not article:
            continue

        # Check if project is actually mentioned in the article
        name_parts = project_name.lower().split()
        text_lower = article['text'].lower()
        if not any(part in text_lower for part in name_parts if len(part) > 3):
            continue

        # Extract mentions
        mentions = extract_mentions(article['text'], project_name)

        article_entry = {
            'url': result['url'],
            'title': result['title'],
            'source': result['source'],
            'date': article.get('date'),
            'mentions': mentions,
        }
        report['articles'].append(article_entry)

        # Aggregate mentions
        for category, items in mentions.items():
            report['extracted'][category].extend([
                {**item, 'source_url': result['url'], 'article_date': article.get('date')}
                for item in items
            ])

    # Build summary
    report['summary'] = {
        'articles_found': len(report['articles']),
        'has_cod_info': len(report['extracted']['cod_mentions']) > 0,
        'has_ppa_info': len(report['extracted']['ppa_mentions']) > 0,
        'has_planning_info': len(report['extracted']['planning_mentions']) > 0,
        'has_ownership_info': len(report['extracted']['ownership_mentions']) > 0,
        'has_cost_info': len(report['extracted']['cost_mentions']) > 0,
    }

    return report


def save_report(report, project_id=None):
    """Save research report to JSON file."""
    filename = project_id or report['project_name'].lower().replace(' ', '-')
    filename = re.sub(r'[^a-z0-9-]', '', filename)
    filepath = os.path.join(OUTPUT_DIR, f"{filename}.json")

    with open(filepath, 'w') as f:
        json.dump(report, f, indent=2, default=str)

    print(f"  Report saved: {filepath}")
    return filepath


def main():
    parser = argparse.ArgumentParser(description='Research projects from web sources')
    parser.add_argument('--project', type=str, help='Project name to research')
    parser.add_argument('--id', type=str, help='Project ID (slug) to research')
    parser.add_argument('--list', type=str, help='File with project names/IDs, one per line')
    args = parser.parse_args()

    if not args.project and not args.id and not args.list:
        parser.print_help()
        sys.exit(1)

    conn = get_connection()

    projects_to_research = []

    if args.id:
        row = conn.execute("SELECT id, name FROM projects WHERE id = ?", (args.id,)).fetchone()
        if not row:
            print(f"Project not found: {args.id}")
            sys.exit(1)
        projects_to_research.append((row['id'], row['name']))

    elif args.project:
        # Try exact match first, then fuzzy
        row = conn.execute("SELECT id, name FROM projects WHERE name LIKE ?", (f"%{args.project}%",)).fetchone()
        if row:
            projects_to_research.append((row['id'], row['name']))
        else:
            projects_to_research.append((None, args.project))

    elif args.list:
        with open(args.list) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                # Try as ID first
                row = conn.execute("SELECT id, name FROM projects WHERE id = ?", (line,)).fetchone()
                if row:
                    projects_to_research.append((row['id'], row['name']))
                else:
                    # Try as name
                    row = conn.execute("SELECT id, name FROM projects WHERE name LIKE ?", (f"%{line}%",)).fetchone()
                    if row:
                        projects_to_research.append((row['id'], row['name']))
                    else:
                        projects_to_research.append((None, line))

    conn.close()

    print(f"Researching {len(projects_to_research)} project(s)...")
    print("=" * 60)

    for project_id, project_name in projects_to_research:
        report = research_project(project_name, project_id)
        save_report(report, project_id)
        print(f"  Summary: {report['summary']}")
        if len(projects_to_research) > 1:
            time.sleep(2)  # Rate limiting between projects

    print("\n" + "=" * 60)
    print(f"Research complete. Reports saved to {OUTPUT_DIR}/")


if __name__ == '__main__':
    main()
