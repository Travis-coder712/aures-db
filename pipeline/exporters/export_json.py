"""
Export AURES SQLite database to static JSON files for the PWA.

Produces:
  data/projects/index.json        — All project summaries (for list views)
  data/projects/{tech}/{id}.json  — Full project detail per project
  data/indexes/by-technology.json — Project IDs grouped by technology
  data/indexes/by-state.json      — Project IDs grouped by state
  data/indexes/by-status.json     — Project IDs grouped by status
  data/indexes/by-developer.json  — Project IDs grouped by developer
  data/metadata/stats.json        — Quick stats for the home dashboard
  data/metadata/last-export.json  — Export timestamp
"""
import json
import os
import re
import sys
from collections import defaultdict
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection, DB_PATH

# Export to frontend/public/data/ so Vite serves it in dev and includes it in build
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'data')


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def write_json(path, data):
    ensure_dir(os.path.dirname(path))
    with open(path, 'w') as f:
        json.dump(data, f, indent=2, default=str)


def fetch_project_summary(conn, project_id):
    """Fetch lightweight summary for list views."""
    row = conn.execute("""
        SELECT id, name, technology, status, capacity_mw, storage_mwh,
               state, current_developer, rez, development_score,
               performance_score, data_confidence, confidence_score
        FROM projects WHERE id = ?
    """, (project_id,)).fetchone()
    if not row:
        return None
    return dict(row)


def fetch_full_project(conn, project_id):
    """Fetch complete project with all related data."""
    row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not row:
        return None
    project = dict(row)

    # Convert boolean integers to actual booleans for JSON
    for key in ['grid_forming', 'has_sips', 'has_syncon', 'has_statcom', 'has_harmonic_filter']:
        if key in project:
            project[key] = bool(project[key])

    # Add coordinates
    if project.get('latitude') and project.get('longitude'):
        project['coordinates'] = {'lat': project['latitude'], 'lng': project['longitude']}
    project.pop('latitude', None)
    project.pop('longitude', None)

    # Timeline events with sources
    events = conn.execute("""
        SELECT te.id, te.date, te.date_precision, te.event_type, te.title, te.detail
        FROM timeline_events te
        WHERE te.project_id = ?
        ORDER BY te.date ASC
    """, (project_id,)).fetchall()

    project['timeline'] = []
    for evt in events:
        event = dict(evt)
        event_id = event.pop('id')
        # Get sources for this event
        sources = conn.execute("""
            SELECT sr.title, sr.url, sr.date, sr.source_tier
            FROM timeline_event_sources tes
            JOIN source_references sr ON tes.source_id = sr.id
            WHERE tes.event_id = ?
        """, (event_id,)).fetchall()
        event['sources'] = [dict(s) for s in sources]
        project['timeline'].append(event)

    # Ownership history
    rows = conn.execute("""
        SELECT period, owner, role, acquisition_value_aud, transaction_structure, source_url
        FROM ownership_history WHERE project_id = ? ORDER BY rowid ASC
    """, (project_id,)).fetchall()
    project['ownership_history'] = [dict(r) for r in rows]

    # COD history
    rows = conn.execute("""
        SELECT date, estimate, source, source_url
        FROM cod_history WHERE project_id = ? ORDER BY date ASC
    """, (project_id,)).fetchall()
    project['cod_history'] = [dict(r) for r in rows]

    # Suppliers
    rows = conn.execute("""
        SELECT role, supplier, model, quantity, grid_forming, source_url
        FROM suppliers WHERE project_id = ?
    """, (project_id,)).fetchall()
    project['suppliers'] = []
    for r in rows:
        sup = dict(r)
        sup['grid_forming'] = bool(sup.get('grid_forming'))
        project['suppliers'].append(sup)

    # Offtakes
    rows = conn.execute("""
        SELECT party, type, term_years, capacity_mw, source_url
        FROM offtakes WHERE project_id = ?
    """, (project_id,)).fetchall()
    project['offtakes'] = [dict(r) for r in rows]

    # Scheme contracts
    rows = conn.execute("""
        SELECT scheme, round, capacity_mw, storage_mwh, contract_type, source_url
        FROM scheme_contracts WHERE project_id = ?
    """, (project_id,)).fetchall()
    project['scheme_contracts'] = [dict(r) for r in rows]

    # Cost sources (multi-source values)
    rows = conn.execute("""
        SELECT value, source, source_url, date, context, what_this_covers
        FROM multi_source_values WHERE project_id = ? AND field_name = 'cost_aud_million'
    """, (project_id,)).fetchall()
    project['cost_sources'] = [dict(r) for r in rows]

    # Stakeholder issues
    rows = conn.execute("""
        SELECT issue FROM stakeholder_issues WHERE project_id = ?
    """, (project_id,)).fetchall()
    project['stakeholder_issues'] = [r['issue'] for r in rows]

    # Project-level sources
    rows = conn.execute("""
        SELECT sr.title, sr.url, sr.date, sr.source_tier
        FROM project_sources ps
        JOIN source_references sr ON ps.source_id = sr.id
        WHERE ps.project_id = ?
    """, (project_id,)).fetchall()
    project['sources'] = [dict(r) for r in rows]

    # Remove internal fields
    for key in ['created_at', 'updated_at']:
        project.pop(key, None)

    return project


def clean_none_values(obj):
    """Recursively remove None values from dicts for cleaner JSON."""
    if isinstance(obj, dict):
        return {k: clean_none_values(v) for k, v in obj.items() if v is not None}
    elif isinstance(obj, list):
        return [clean_none_values(item) for item in obj]
    return obj


def export_all(db_path=DB_PATH):
    conn = get_connection(db_path)

    # Get all project IDs
    project_ids = [r['id'] for r in conn.execute("SELECT id FROM projects ORDER BY name").fetchall()]

    print(f"Exporting {len(project_ids)} projects...")

    # 1. Project summaries index
    summaries = []
    for pid in project_ids:
        summary = fetch_project_summary(conn, pid)
        if summary:
            summaries.append(clean_none_values(summary))

    write_json(os.path.join(DATA_DIR, 'projects', 'index.json'), summaries)
    print(f"  projects/index.json ({len(summaries)} projects)")

    # 2. Full project detail files
    tech_map = {
        'wind': 'wind', 'solar': 'solar', 'bess': 'bess',
        'hybrid': 'hybrid', 'pumped_hydro': 'pumped-hydro',
        'offshore_wind': 'offshore-wind', 'gas': 'gas'
    }
    for pid in project_ids:
        project = fetch_full_project(conn, pid)
        if project:
            tech_dir = tech_map.get(project['technology'], project['technology'])
            write_json(
                os.path.join(DATA_DIR, 'projects', tech_dir, f"{pid}.json"),
                clean_none_values(project)
            )
    print(f"  projects/{{tech}}/{{id}}.json ({len(project_ids)} files)")

    # 3. Indexes
    indexes = {
        'by-technology': defaultdict(list),
        'by-state': defaultdict(list),
        'by-status': defaultdict(list),
        'by-developer': defaultdict(list),
    }

    for s in summaries:
        indexes['by-technology'][s['technology']].append(s['id'])
        indexes['by-state'][s['state']].append(s['id'])
        indexes['by-status'][s['status']].append(s['id'])
        dev = s.get('current_developer', 'Unknown')
        if dev:
            indexes['by-developer'][dev].append(s['id'])

    for name, data in indexes.items():
        write_json(os.path.join(DATA_DIR, 'indexes', f"{name}.json"), dict(data))
    print(f"  indexes/ (4 index files)")

    # 4. Stats
    stats = {
        'total': len(summaries),
        'total_capacity_mw': sum(s.get('capacity_mw', 0) for s in summaries),
        'total_storage_mwh': sum(s.get('storage_mwh', 0) for s in summaries if s.get('storage_mwh')),
        'by_technology': {},
        'by_status': {},
        'by_state': {},
        'states': list(set(s['state'] for s in summaries)),
    }

    for tech in set(s['technology'] for s in summaries):
        tech_projects = [s for s in summaries if s['technology'] == tech]
        stats['by_technology'][tech] = {
            'count': len(tech_projects),
            'capacity_mw': sum(s.get('capacity_mw', 0) for s in tech_projects),
            'storage_mwh': sum(s.get('storage_mwh', 0) for s in tech_projects if s.get('storage_mwh')),
        }

    for status in set(s['status'] for s in summaries):
        status_projects = [s for s in summaries if s['status'] == status]
        stats['by_status'][status] = {
            'count': len(status_projects),
            'capacity_mw': sum(s.get('capacity_mw', 0) for s in status_projects),
        }

    for state in set(s['state'] for s in summaries):
        state_projects = [s for s in summaries if s['state'] == state]
        stats['by_state'][state] = {
            'count': len(state_projects),
            'capacity_mw': sum(s.get('capacity_mw', 0) for s in state_projects),
        }

    write_json(os.path.join(DATA_DIR, 'metadata', 'stats.json'), stats)
    print(f"  metadata/stats.json")

    # 5. Performance / League Tables
    export_performance_data(conn)

    # 6. Developer profiles
    export_developer_profiles(conn, summaries)

    # 7. Coordinates index (for map view)
    export_coordinates_index(conn)

    # 8. COD drift data
    export_cod_drift(conn)

    # 9. Export metadata
    write_json(os.path.join(DATA_DIR, 'metadata', 'last-export.json'), {
        'exported_at': datetime.now().isoformat(),
        'project_count': len(summaries),
        'source': db_path,
    })
    print(f"  metadata/last-export.json")

    conn.close()
    print("\nExport complete!")


def export_performance_data(conn):
    """Export league tables and performance data to JSON."""
    perf_dir = os.path.join(DATA_DIR, 'performance')

    # Check what years/techs have league data
    rows = conn.execute("""
        SELECT DISTINCT year, technology, COUNT(*) as count
        FROM league_table_entries
        GROUP BY year, technology
        ORDER BY year, technology
    """).fetchall()

    if not rows:
        print("  performance/ (no league table data)")
        return

    available = [{'year': r['year'], 'technology': r['technology'], 'count': r['count']} for r in rows]
    years = sorted(set(r['year'] for r in rows))
    technologies = sorted(set(r['technology'] for r in rows))

    # League table index
    write_json(os.path.join(perf_dir, 'league-tables', 'index.json'), {
        'available_years': years,
        'technologies': technologies,
        'tables': available,
        'last_updated': datetime.now().isoformat(),
    })

    # Per-tech-year league tables
    for year in years:
        for tech in technologies:
            entries = conn.execute("""
                SELECT
                    lt.project_id, lt.rank_composite, lt.quartile, lt.composite_score,
                    lt.rank_capacity_factor, lt.rank_revenue_per_mw, lt.rank_curtailment,
                    lt.percentile_capacity_factor, lt.percentile_revenue_per_mw,
                    p.name, p.technology, p.capacity_mw, p.storage_mwh, p.state,
                    pa.energy_mwh, pa.capacity_factor_pct, pa.curtailment_pct,
                    pa.energy_price_received, pa.revenue_aud, pa.revenue_per_mw,
                    pa.market_value_aud,
                    pa.energy_charged_mwh, pa.energy_discharged_mwh,
                    pa.avg_charge_price, pa.avg_discharge_price,
                    pa.utilisation_pct, pa.cycles,
                    pa.data_source
                FROM league_table_entries lt
                JOIN projects p ON lt.project_id = p.id
                LEFT JOIN performance_annual pa ON lt.project_id = pa.project_id AND lt.year = pa.year
                WHERE lt.year = ? AND lt.technology = ?
                ORDER BY lt.rank_composite ASC
            """, (year, tech)).fetchall()

            if not entries:
                continue

            projects_list = []
            for e in entries:
                entry = clean_none_values(dict(e))
                projects_list.append(entry)

            # Compute fleet averages
            cf_vals = [e['capacity_factor_pct'] for e in entries if e['capacity_factor_pct']]
            rev_vals = [e['revenue_per_mw'] for e in entries if e['revenue_per_mw']]
            curt_vals = [e['curtailment_pct'] for e in entries if e['curtailment_pct']]

            fleet_avg = {
                'capacity_factor_pct': round(sum(cf_vals) / len(cf_vals), 2) if cf_vals else None,
                'revenue_per_mw': round(sum(rev_vals) / len(rev_vals), 0) if rev_vals else None,
                'curtailment_pct': round(sum(curt_vals) / len(curt_vals), 2) if curt_vals else None,
                'count': len(entries),
            }

            # Determine data source for this year/tech
            sources = set(e.get('data_source') for e in projects_list if e.get('data_source'))
            data_source = list(sources)[0] if len(sources) == 1 else 'mixed'

            write_json(os.path.join(perf_dir, 'league-tables', f'{tech}-{year}.json'), {
                'year': year,
                'technology': tech,
                'data_source': data_source,
                'fleet_avg': clean_none_values(fleet_avg),
                'projects': projects_list,
            })

    # Quartile benchmarks per tech per year
    for year in years:
        for tech in technologies:
            entries = conn.execute("""
                SELECT pa.capacity_factor_pct, pa.revenue_per_mw, pa.curtailment_pct,
                       lt.quartile
                FROM league_table_entries lt
                JOIN performance_annual pa ON lt.project_id = pa.project_id AND lt.year = pa.year
                WHERE lt.year = ? AND lt.technology = ?
                ORDER BY pa.capacity_factor_pct DESC
            """, (year, tech)).fetchall()

            if not entries:
                continue

            cf_vals = sorted([e['capacity_factor_pct'] for e in entries if e['capacity_factor_pct']])
            rev_vals = sorted([e['revenue_per_mw'] for e in entries if e['revenue_per_mw']])

            def quartiles(vals):
                n = len(vals)
                if n < 4:
                    return {'q1': vals[0] if vals else 0, 'median': vals[n//2] if vals else 0, 'q3': vals[-1] if vals else 0}
                return {
                    'q1': vals[n // 4],
                    'median': vals[n // 2],
                    'q3': vals[3 * n // 4],
                }

            write_json(os.path.join(perf_dir, 'quartile-benchmarks', f'{tech}-{year}.json'), {
                'year': year,
                'technology': tech,
                'benchmarks': {
                    'capacity_factor': quartiles(cf_vals),
                    'revenue_per_mw': quartiles(rev_vals),
                }
            })

    print(f"  performance/ (league tables for {len(years)} years, {len(technologies)} techs)")


def export_coordinates_index(conn):
    """Export lightweight coordinates index for the map view."""
    rows = conn.execute("""
        SELECT id, name, technology, status, capacity_mw, storage_mwh,
               state, latitude, longitude, current_developer
        FROM projects
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        ORDER BY capacity_mw DESC
    """).fetchall()

    features = []
    for r in rows:
        features.append(clean_none_values({
            'id': r['id'],
            'name': r['name'],
            'technology': r['technology'],
            'status': r['status'],
            'capacity_mw': r['capacity_mw'],
            'storage_mwh': r['storage_mwh'],
            'state': r['state'],
            'lat': r['latitude'],
            'lng': r['longitude'],
            'developer': r['current_developer'],
        }))

    write_json(os.path.join(DATA_DIR, 'indexes', 'by-coordinates.json'), features)
    print(f"  indexes/by-coordinates.json ({len(features)} geolocated projects)")


def parse_cod_year(s):
    """Extract a year (int) from a COD string like '2026', 'Q3 2021', '2026 (Stage 1)', '2024-11'."""
    if not s:
        return None
    import re as _re
    m = _re.search(r'(\d{4})', s)
    return int(m.group(1)) if m else None


def export_cod_drift(conn):
    """Export COD drift data for projects with both original and current COD."""
    rows = conn.execute("""
        SELECT id, name, technology, status, capacity_mw, state,
               cod_original, cod_current
        FROM projects
        WHERE cod_original IS NOT NULL AND cod_current IS NOT NULL
              AND cod_original != '' AND cod_current != ''
    """).fetchall()

    by_project = []
    tech_drift = defaultdict(list)

    for r in rows:
        orig_year = parse_cod_year(r['cod_original'])
        curr_year = parse_cod_year(r['cod_current'])
        if orig_year and curr_year:
            drift_months = (curr_year - orig_year) * 12
            entry = {
                'id': r['id'],
                'name': r['name'],
                'technology': r['technology'],
                'status': r['status'],
                'capacity_mw': r['capacity_mw'],
                'state': r['state'],
                'original': r['cod_original'],
                'current': r['cod_current'],
                'drift_months': drift_months,
            }
            by_project.append(entry)
            tech_drift[r['technology']].append(drift_months)

    # Also include cod_history data for richer drift timelines
    history_rows = conn.execute("""
        SELECT ch.project_id, ch.date, ch.estimate, ch.source,
               p.name, p.technology, p.capacity_mw, p.state
        FROM cod_history ch
        JOIN projects p ON ch.project_id = p.id
        ORDER BY ch.project_id, ch.date
    """).fetchall()

    cod_histories = defaultdict(list)
    for r in history_rows:
        cod_histories[r['project_id']].append({
            'date': r['date'],
            'estimate': r['estimate'],
            'source': r['source'],
        })

    # Compute average drift by technology
    avg_drift = {}
    for tech, drifts in tech_drift.items():
        avg_drift[tech] = round(sum(drifts) / len(drifts), 1) if drifts else 0

    by_project.sort(key=lambda x: abs(x['drift_months']), reverse=True)

    result = {
        'projects_with_drift': len(by_project),
        'avg_drift_months': avg_drift,
        'by_project': by_project,
        'cod_histories': {pid: entries for pid, entries in cod_histories.items()},
    }

    write_json(os.path.join(DATA_DIR, 'indexes', 'cod-drift.json'), result)
    print(f"  indexes/cod-drift.json ({len(by_project)} projects with drift, {len(cod_histories)} with history)")


def make_slug(name):
    """Convert developer name to URL-safe slug."""
    s = name.lower().strip()
    # Remove common suffixes
    for suffix in [' pty ltd', ' pty. ltd.', ' ltd', ' inc', ' llc', ' corp']:
        if s.endswith(suffix):
            s = s[:-len(suffix)]
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = s.strip('-')
    return s


def export_developer_profiles(conn, summaries):
    """Export developer portfolio profiles to JSON."""
    # Group projects by developer
    dev_projects = defaultdict(list)
    for s in summaries:
        dev = s.get('current_developer')
        if dev:
            dev_projects[dev].append(s)

    # Build profiles
    seen_slugs = {}
    developers = []
    for name, projects in dev_projects.items():
        slug = make_slug(name)
        # Deduplicate slugs
        if slug in seen_slugs:
            slug = f"{slug}-{len([k for k in seen_slugs if k.startswith(slug)]) + 1}"
        seen_slugs[slug] = name

        by_tech = defaultdict(int)
        by_status = defaultdict(int)
        states = set()
        confidence_counts = defaultdict(int)
        total_mw = 0
        total_mwh = 0

        for p in projects:
            by_tech[p['technology']] += 1
            by_status[p['status']] += 1
            states.add(p['state'])
            confidence_counts[p.get('data_confidence', 'low')] += 1
            total_mw += p.get('capacity_mw', 0)
            total_mwh += p.get('storage_mwh', 0) or 0

        # Average confidence: pick the tier with highest count
        avg_confidence = max(confidence_counts, key=confidence_counts.get)

        developers.append({
            'slug': slug,
            'name': name,
            'project_count': len(projects),
            'total_capacity_mw': round(total_mw, 1),
            'total_storage_mwh': round(total_mwh, 1),
            'by_technology': dict(by_tech),
            'by_status': dict(by_status),
            'states': sorted(states),
            'avg_confidence': avg_confidence,
            'project_ids': [p['id'] for p in sorted(projects, key=lambda x: x.get('capacity_mw', 0), reverse=True)],
        })

    # Sort by total capacity descending
    developers.sort(key=lambda d: d['total_capacity_mw'], reverse=True)

    write_json(os.path.join(DATA_DIR, 'indexes', 'developer-profiles.json'), {
        'developers': developers,
        'total_developers': len(developers),
    })
    print(f"  indexes/developer-profiles.json ({len(developers)} developers)")


if __name__ == '__main__':
    export_all()
