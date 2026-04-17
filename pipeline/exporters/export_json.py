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
import calendar
import json
import os
import re
import statistics
import sys
from collections import defaultdict
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection, DB_PATH

# Export to frontend/public/data/ so Vite serves it in dev and includes it in build
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'data')
CONFIG_DIR = os.path.join(os.path.dirname(__file__), '..', 'config')
# Source-of-truth manual enrichment. Per-project JSON files here are merged
# over the DB-exported project JSON so narrative / consolidated-project fields
# (notable text, SIPS contracts, revenue determinations, stakeholder issues)
# survive re-exports. See `merge_project_overlay` below.
OVERLAY_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'projects')

# Fields where a manually-curated overlay at data/projects/<tech>/<id>.json
# should OVERRIDE the DB-exported value. Any field in the overlay NOT listed
# here but also not present in the export is still ADDED (additive). Everything
# else: the DB wins (it is the source of truth for structured data like
# capacity, coordinates, status, performance arrays, etc.).
OVERLAY_OVERRIDE_FIELDS = frozenset({
    # Narrative
    'notable',
    'description',
    'overview',
    'operational_notes',
    'note',
    # Curated complex fields
    'stakeholder_issues',
    'timeline_events',
    'sources',
    'technology_details',
    # Provenance / confidence
    'last_updated',
    'last_verified',
    'data_confidence',
    'confidence_score',
    'first_seen',
    # Capex — often hand-curated from announcements
    'capex_aud_m',
    'capex_source',
    'capex_source_url',
    'capex_year',
    # BESS regulatory contracts (SIPS, AER determinations)
    'sips_contracts',
    'sips_revenue',
    'sip_battery_contract',
    'aer_determinations',
    'revenue_determinations',
    # Specialised
    'performance_score',
    'battery_status',
})


def load_project_overlay(project_id, tech_dir):
    """Load the manual-enrichment overlay for a project if it exists.

    Returns None if no overlay file exists at
    `data/projects/<tech_dir>/<project_id>.json`. Parsing errors are logged
    and treated as "no overlay" so a broken file never blocks the export.
    """
    overlay_path = os.path.join(OVERLAY_DIR, tech_dir, f"{project_id}.json")
    if not os.path.exists(overlay_path):
        return None
    try:
        with open(overlay_path) as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        print(f"  ! overlay load failed for {project_id}: {e}")
        return None


# Fields where an EMPTY export value (null, empty array, empty dict) should be
# replaced by a non-empty overlay value. Covers legacy research not yet
# imported into the DB (eg suppliers known from announcements but not yet in
# the suppliers table).
OVERLAY_FILL_EMPTY_FIELDS = frozenset({
    'suppliers',
    'scheme_contracts',
    'ownership_history',
    'offtakes',
})

# Legacy key renames (old overlay key → canonical export key). Applied before
# the override / fill-empty / additive checks run.
OVERLAY_KEY_ALIASES = {
    'timeline': 'timeline_events',
}


def _is_empty(val):
    """Treat None, [] and {} as 'absent' for fill-empty merging.
    Zero and empty string are NOT considered empty — they are real values."""
    if val is None:
        return True
    if isinstance(val, (list, dict)) and len(val) == 0:
        return True
    return False


def merge_project_overlay(exported, overlay):
    """Merge a manual-enrichment overlay on top of a DB-exported project dict.

    Rules (applied per field in the overlay, after the alias rename below):
      1. Legacy key aliases (`timeline` → `timeline_events`) are renamed first.
      2. Fields in OVERLAY_OVERRIDE_FIELDS → overlay value replaces export value.
      3. Fields not in export → added to result (additive).
      4. Fields in OVERLAY_FILL_EMPTY_FIELDS where export value is empty
         (None, [], {}) → overlay value replaces it.
      5. All other fields → export value kept (DB is source of truth).

    Zero and empty strings are NOT treated as empty — only None and
    empty collections.
    """
    if not overlay:
        return exported
    merged = dict(exported)
    for raw_key, value in overlay.items():
        key = OVERLAY_KEY_ALIASES.get(raw_key, raw_key)
        if key in OVERLAY_OVERRIDE_FIELDS:
            merged[key] = value
        elif key not in merged:
            merged[key] = value
        elif key in OVERLAY_FILL_EMPTY_FIELDS and _is_empty(merged[key]) and not _is_empty(value):
            merged[key] = value
        # else: DB wins — keep the exported value
    return merged


def load_consolidated_slugs():
    """Load set of project slugs that have been consolidated into parent projects.
    The exporter will skip these — they should not be written as separate JSON files."""
    config_path = os.path.join(CONFIG_DIR, 'consolidated_projects.json')
    if not os.path.exists(config_path):
        return set()
    with open(config_path) as f:
        data = json.load(f)
    return set(data.get('by_slug', {}).keys())


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
               state, current_developer, current_operator, rez, development_score,
               performance_score, data_confidence, confidence_score,
               development_stage, capex_aud_m, capex_year, notable, first_seen,
               zombie_flag
        FROM projects WHERE id = ?
    """, (project_id,)).fetchone()
    if not row:
        return None
    summary = dict(row)

    # Add has_eis_data flag if the eis_technical_specs table exists and has data
    try:
        eis_row = conn.execute(
            "SELECT 1 FROM eis_technical_specs WHERE project_id = ? LIMIT 1", (project_id,)
        ).fetchone()
        if eis_row:
            summary['has_eis_data'] = True
    except Exception:
        pass  # Table may not exist in older DB versions

    return summary


def fetch_full_project(conn, project_id):
    """Fetch complete project with all related data."""
    row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not row:
        return None
    project = dict(row)

    # Convert boolean integers to actual booleans for JSON
    # SQLite may return '0'/'1' strings — bool('0') is True, so convert via int first
    for key in ['grid_forming', 'has_sips', 'has_syncon', 'has_statcom', 'has_harmonic_filter']:
        if key in project and project[key] is not None:
            project[key] = bool(int(project[key]))

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

    # Project stages (multi-stage projects)
    tables = [r[0] for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='project_stages'"
    ).fetchall()]
    if tables:
        rows = conn.execute("""
            SELECT stage, name, capacity_mw, storage_mwh, status, cod, cod_original,
                   capex_aud_m, capex_source, oem, oem_model, grid_forming, notes
            FROM project_stages WHERE project_id = ? ORDER BY stage ASC
        """, (project_id,)).fetchall()
        if rows:
            stages = []
            for r in rows:
                s = dict(r)
                s['grid_forming'] = bool(s.get('grid_forming'))
                stages.append(s)
            project['stages'] = stages

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

    # EIS / EIA Technical Specifications (migration 008)
    tables = [r[0] for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='eis_technical_specs'"
    ).fetchall()]
    if tables:
        rows = conn.execute("""
            SELECT document_title, document_url, document_year,
                   turbine_model, turbine_count, turbine_rated_power_mw,
                   hub_height_m, hub_height_note, rotor_diameter_m,
                   wind_speed_mean_ms, wind_speed_height_m, wind_speed_period,
                   assumed_capacity_factor_pct, assumed_annual_energy_gwh, energy_yield_method,
                   noise_limit_dba, minimum_setback_m,
                   cell_chemistry, cell_chemistry_full, cell_supplier, cell_country_of_manufacture,
                   inverter_supplier, inverter_model, inverter_country_of_manufacture,
                   inverter_rated_power_kw, inverter_count,
                   pcs_type, round_trip_efficiency_pct, round_trip_efficiency_ac,
                   duration_hours, connection_voltage_kv, transformer_mva,
                   network_service_provider, connection_substation_name,
                   connection_substation_capacity_mva, connection_distance_km,
                   connection_distance_note, connection_augmentation, notes
            FROM eis_technical_specs WHERE project_id = ?
        """, (project_id,)).fetchall()
        specs = [dict(r) for r in rows]
        # Remove None values for cleaner JSON
        project['eis_specs'] = {k: v for k, v in specs[0].items() if v is not None} if specs else None

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


def _load_scheme_project_ids():
    """Extract CIS/LTESA project IDs from scheme-rounds.ts."""
    scheme_rounds_path = os.path.join(
        os.path.dirname(__file__), '..', '..', 'frontend', 'src', 'data', 'scheme-rounds.ts'
    )
    try:
        with open(scheme_rounds_path, 'r') as f:
            content = f.read()
        return set(re.findall(r"project_id:\s*['\"]([^'\"]+)['\"]", content))
    except FileNotFoundError:
        print("  WARNING: scheme-rounds.ts not found, skipping scheme flags")
        return set()


def _load_user_overrides():
    """Load user-overrides.json for manual include/exclude."""
    overrides_path = os.path.join(DATA_DIR, 'user-overrides.json')
    try:
        with open(overrides_path, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"include": {}, "exclude": {}}


def export_all(db_path=DB_PATH):
    conn = get_connection(db_path)

    # Get all project IDs
    project_ids = [r['id'] for r in conn.execute("SELECT id FROM projects ORDER BY name").fetchall()]

    # Load consolidated projects — these slugs were merged into parent projects
    # and must not be exported as separate JSON files
    consolidated_slugs = load_consolidated_slugs()
    if consolidated_slugs:
        before = len(project_ids)
        project_ids = [pid for pid in project_ids if pid not in consolidated_slugs]
        skipped = before - len(project_ids)
        if skipped:
            print(f"  Consolidation guard: skipping {skipped} merged project(s): {consolidated_slugs & set([pid for pid in project_ids]) or consolidated_slugs}")

    print(f"Exporting {len(project_ids)} projects...")

    # Load scheme project IDs and user overrides for enrichment
    scheme_ids = _load_scheme_project_ids()
    user_overrides = _load_user_overrides()
    print(f"  Scheme project IDs: {len(scheme_ids)}")
    print(f"  User overrides: {len(user_overrides.get('include', {}))} include, {len(user_overrides.get('exclude', {}))} exclude")

    # 1. Project summaries index
    summaries = []
    for pid in project_ids:
        summary = fetch_project_summary(conn, pid)
        if summary:
            # Enrich with scheme contract flag
            if pid in scheme_ids:
                summary['has_scheme_contract'] = True
            # Enrich with user override
            if pid in user_overrides.get('include', {}):
                summary['user_override'] = 'include'
            elif pid in user_overrides.get('exclude', {}):
                summary['user_override'] = 'exclude'
            summaries.append(clean_none_values(summary))

    write_json(os.path.join(DATA_DIR, 'projects', 'index.json'), summaries)
    print(f"  projects/index.json ({len(summaries)} projects)")

    # 2. Full project detail files
    tech_map = {
        'wind': 'wind', 'solar': 'solar', 'bess': 'bess',
        'hybrid': 'hybrid', 'pumped_hydro': 'pumped-hydro',
        'offshore_wind': 'offshore-wind', 'gas': 'gas'
    }
    overlay_count = 0
    for pid in project_ids:
        project = fetch_full_project(conn, pid)
        if project:
            tech_dir = tech_map.get(project['technology'], project['technology'])
            overlay = load_project_overlay(pid, tech_dir)
            if overlay:
                project = merge_project_overlay(project, overlay)
                overlay_count += 1
            write_json(
                os.path.join(DATA_DIR, 'projects', tech_dir, f"{pid}.json"),
                clean_none_values(project)
            )
    suffix = f", {overlay_count} with manual overlay" if overlay_count else ""
    print(f"  projects/{{tech}}/{{id}}.json ({len(project_ids)} files{suffix})")

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

    # 5b. Monthly performance from real DB data (replaces synthetic generator)
    export_monthly_performance(conn)

    # 6. Developer profiles
    export_developer_profiles(conn, summaries)

    # 8b. Developer analytics — pre-aggregated performance, equipment prefs,
    # scheme wins, offtake counterparties
    export_developer_analytics(conn)

    # 7. Coordinates index (for map view)
    export_coordinates_index(conn)

    # 8. COD drift data
    export_cod_drift(conn)

    # 9. OEM profiles
    export_oem_profiles(conn)

    # 9b. OEM analytics — pre-aggregated performance + developer cross-links
    export_oem_analytics(conn)

    # 10. Contractor profiles
    export_contractor_profiles(conn)

    # 11. Offtaker profiles
    export_offtaker_profiles(conn)

    # 12. Data sources status
    export_data_sources(conn)

    # 13. BESS capex analytics
    export_bess_capex(conn)

    # 14. Project timeline analytics
    export_project_timeline(conn)

    # 15b. EIS analytics
    export_eis_analytics(conn)

    # 15c. EIS vs actual comparison
    export_eis_comparison(conn)

    # 17. Intelligence Layer
    export_intelligence(conn)

    # 18. News articles
    export_news(conn)

    # 15. Export metadata
    write_json(os.path.join(DATA_DIR, 'metadata', 'last-export.json'), {
        'exported_at': datetime.now().isoformat(),
        'project_count': len(summaries),
        'source': db_path,
    })
    print(f"  metadata/last-export.json")

    # 16. Version file (for update detection in the PWA)
    pkg_json_path = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'package.json')
    version = '0.0.0'
    if os.path.exists(pkg_json_path):
        with open(pkg_json_path) as f:
            version = json.load(f).get('version', '0.0.0')
    write_json(os.path.join(DATA_DIR, 'metadata', 'version.json'), {
        'version': version,
        'built_at': datetime.now().isoformat(),
    })
    print(f"  metadata/version.json (v{version})")

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


def _hours_in_month(year, month):
    """Return total hours in a given month."""
    return calendar.monthrange(year, month)[1] * 24


def export_monthly_performance(conn):
    """Export per-project monthly performance from real DB data.

    Replaces the synthetic generator with actual OpenElectricity API data
    from the performance_monthly table, including BESS revenue.
    """
    monthly_dir = os.path.join(DATA_DIR, 'performance', 'monthly')
    ensure_dir(monthly_dir)

    # Get all projects with monthly data
    projects = conn.execute("""
        SELECT DISTINCT pm.project_id, p.name, p.technology, p.capacity_mw,
               p.storage_mwh, p.state
        FROM performance_monthly pm
        JOIN projects p ON pm.project_id = p.id
        ORDER BY p.name
    """).fetchall()

    if not projects:
        print("  performance/monthly/ (no monthly data in DB)")
        return

    index_entries = []
    for proj in projects:
        pid = proj['project_id']

        # Fetch all monthly rows for this project
        rows = conn.execute("""
            SELECT year, month, energy_mwh, capacity_factor_pct,
                   energy_price_received, revenue_aud,
                   energy_charged_mwh, energy_discharged_mwh,
                   avg_charge_price, avg_discharge_price,
                   data_source
            FROM performance_monthly
            WHERE project_id = ?
            ORDER BY year, month
        """, (pid,)).fetchall()

        if not rows:
            continue

        monthly_data = []
        for r in rows:
            entry = {}
            entry['year'] = r['year']
            entry['month'] = r['month']

            is_bess = proj['technology'] in ('bess', 'pumped_hydro')

            if is_bess:
                # BESS / Pumped Hydro fields
                discharged = r['energy_discharged_mwh'] or 0
                charged = r['energy_charged_mwh'] or 0
                if discharged > 0:
                    entry['energy_discharged_mwh'] = round(discharged, 1)
                if charged > 0:
                    entry['energy_charged_mwh'] = round(charged, 1)
                if r['avg_charge_price'] is not None:
                    entry['avg_charge_price'] = round(r['avg_charge_price'], 2)
                if r['avg_discharge_price'] is not None:
                    entry['avg_discharge_price'] = round(r['avg_discharge_price'], 2)

                # Derived BESS fields
                cap = proj['capacity_mw'] or 1
                hours = _hours_in_month(r['year'], r['month'])
                if cap and hours:
                    entry['utilisation_pct'] = round(discharged / (cap * hours) * 100, 1)
                if proj['storage_mwh'] and proj['storage_mwh'] > 0:
                    entry['cycles'] = round(discharged / proj['storage_mwh'], 1)

                # BESS revenue (new — not in synthetic files)
                if r['revenue_aud'] is not None and r['revenue_aud'] != 0:
                    entry['revenue_aud'] = round(r['revenue_aud'], 0)
            else:
                # Wind / Solar / Hybrid fields
                if r['capacity_factor_pct'] is not None:
                    entry['capacity_factor_pct'] = round(r['capacity_factor_pct'], 1)
                if r['energy_mwh'] is not None:
                    entry['energy_mwh'] = round(r['energy_mwh'], 1)
                if r['revenue_aud'] is not None:
                    entry['revenue_aud'] = round(r['revenue_aud'], 0)
                if r['energy_price_received'] is not None:
                    entry['energy_price_received'] = round(r['energy_price_received'], 2)

            monthly_data.append(entry)

        file_data = {
            'project_id': pid,
            'name': proj['name'],
            'technology': proj['technology'],
            'capacity_mw': proj['capacity_mw'],
            'state': proj['state'],
            'data_source': 'openelectricity_api',
            'monthly': monthly_data,
        }
        if proj['storage_mwh']:
            file_data['storage_mwh'] = proj['storage_mwh']

        write_json(os.path.join(monthly_dir, f'{pid}.json'), file_data)
        index_entries.append({
            'project_id': pid,
            'months': len(monthly_data),
            'first': f"{rows[0]['year']}-{rows[0]['month']:02d}",
            'last': f"{rows[-1]['year']}-{rows[-1]['month']:02d}",
        })

    # Write index
    write_json(os.path.join(monthly_dir, 'index.json'), {
        'count': len(index_entries),
        'last_updated': datetime.now().isoformat(),
        'projects': index_entries,
    })

    print(f"  performance/monthly/ ({len(index_entries)} project files from real DB data)")


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

    # --- Grouped developers ---
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'developer_groups.json')
    grouped_developers = []
    top_developers = []
    if os.path.exists(config_path):
        with open(config_path) as f:
            groups_config = json.load(f)

        # Build a mapping: original name → group canonical
        name_to_group = {}
        for g in groups_config.get('groups', []):
            for member in g['members']:
                name_to_group[member] = g['canonical']

        # Build a name → developer profile lookup
        dev_by_name = {d['name']: d for d in developers}

        # Aggregate grouped profiles
        seen_group_slugs = {}
        group_map = defaultdict(lambda: {
            'members': [], 'projects': [], 'by_tech': defaultdict(int),
            'by_status': defaultdict(int), 'states': set(), 'total_mw': 0,
            'total_mwh': 0, 'confidence_counts': defaultdict(int),
        })

        assigned_names = set()
        for g in groups_config.get('groups', []):
            canonical = g['canonical']
            for member in g['members']:
                if member in dev_projects:
                    assigned_names.add(member)
                    gd = group_map[canonical]
                    gd['members'].append(member)
                    for p in dev_projects[member]:
                        gd['projects'].append(p)
                        gd['by_tech'][p['technology']] += 1
                        gd['by_status'][p['status']] += 1
                        gd['states'].add(p['state'])
                        gd['total_mw'] += p.get('capacity_mw', 0)
                        gd['total_mwh'] += (p.get('storage_mwh', 0) or 0)
                        gd['confidence_counts'][p.get('data_confidence', 'low')] += 1

        for canonical, gd in group_map.items():
            if not gd['projects']:
                continue
            slug = make_slug(canonical)
            if slug in seen_group_slugs:
                slug = f"{slug}-{len([k for k in seen_group_slugs if k.startswith(slug)]) + 1}"
            seen_group_slugs[slug] = canonical

            avg_confidence = max(gd['confidence_counts'], key=gd['confidence_counts'].get)
            grouped_developers.append({
                'slug': slug,
                'name': canonical,
                'aliases': sorted(gd['members']),
                'project_count': len(gd['projects']),
                'total_capacity_mw': round(gd['total_mw'], 1),
                'total_storage_mwh': round(gd['total_mwh'], 1),
                'by_technology': dict(gd['by_tech']),
                'by_status': dict(gd['by_status']),
                'states': sorted(gd['states']),
                'avg_confidence': avg_confidence,
                'project_ids': [p['id'] for p in sorted(gd['projects'], key=lambda x: x.get('capacity_mw', 0), reverse=True)],
            })

        # Add ungrouped developers as single-member groups
        for dev in developers:
            if dev['name'] not in assigned_names:
                grouped_developers.append({
                    **dev,
                    'aliases': [],
                })

        grouped_developers.sort(key=lambda d: d['total_capacity_mw'], reverse=True)

        # Top developers by project count (for quick buttons)
        top_developers = sorted(grouped_developers, key=lambda d: d['project_count'], reverse=True)[:10]
        top_developers = [{'slug': d['slug'], 'name': d['name'], 'project_count': d['project_count']} for d in top_developers]

    write_json(os.path.join(DATA_DIR, 'indexes', 'developer-profiles.json'), {
        'developers': developers,
        'total_developers': len(developers),
        'grouped_developers': grouped_developers,
        'total_grouped': len(grouped_developers),
        'top_developers': top_developers,
    })
    grouped_count = len([g for g in grouped_developers if g.get('aliases')])
    print(f"  indexes/developer-profiles.json ({len(developers)} developers, {len(grouped_developers)} grouped ({grouped_count} with aliases))")


def export_developer_analytics(conn):
    """Pre-aggregate developer-level intelligence for the portfolio dashboard.

    Output: analytics/developer-analytics.json keyed by the raw developer
    name (matches `projects.current_developer`). The frontend collapses
    aliases at render time using developer-profiles.json.

    Sections per developer:
      - equipment_preferences: top OEMs and contractors from supplier joins
      - cod_drift: per-project original vs actual COD + drift months
      - scheme_wins: list of scheme_contracts entries
      - fleet_performance: avg composite + quartile_counts (only if ≥3
          ranked projects; otherwise null)
      - offtake_counterparties: list of buyers with counts (only if ≥1)
    """
    # ---- Equipment preferences (OEM + contractor) ----
    eq_rows = conn.execute("""
        SELECT p.current_developer AS developer, s.role, s.supplier,
               COUNT(DISTINCT p.id) AS projects, SUM(COALESCE(p.capacity_mw,0)) AS mw,
               p.technology
        FROM projects p
        JOIN suppliers s ON s.project_id = p.id
        WHERE p.current_developer IS NOT NULL AND p.current_developer != ''
        GROUP BY p.current_developer, s.role, s.supplier, p.technology
    """).fetchall()

    equipment = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: {'projects': 0, 'mw': 0.0})))
    for r in eq_rows:
        bucket = equipment[r['developer']][r['role']][r['supplier']]
        bucket['projects'] += r['projects']
        bucket['mw'] += r['mw'] or 0

    # Flatten equipment to a list of {role, supplier, projects, mw} per developer,
    # sorted by projects desc
    eq_out = {}
    for dev, by_role in equipment.items():
        flat = []
        for role, suppliers in by_role.items():
            for sup, stats in suppliers.items():
                flat.append({
                    'role': role,
                    'supplier': sup,
                    'projects': stats['projects'],
                    'mw': round(stats['mw'], 1),
                })
        flat.sort(key=lambda e: (-e['projects'], -e['mw']))
        eq_out[dev] = flat

    # ---- COD drift per project ----
    cod_rows = conn.execute("""
        SELECT id, name, current_developer AS developer, technology, state, status,
               capacity_mw, cod_current, cod_original,
               CASE
                 WHEN cod_current IS NOT NULL AND cod_original IS NOT NULL
                 THEN ROUND(
                   (julianday(cod_current) - julianday(cod_original)) / 30.0, 1
                 )
                 ELSE NULL
               END AS drift_months
        FROM projects
        WHERE current_developer IS NOT NULL AND current_developer != ''
    """).fetchall()

    drift_out = defaultdict(list)
    for r in cod_rows:
        drift_out[r['developer']].append({
            'id': r['id'],
            'name': r['name'],
            'technology': r['technology'],
            'state': r['state'],
            'status': r['status'],
            'capacity_mw': r['capacity_mw'],
            'cod_current': r['cod_current'],
            'cod_original': r['cod_original'],
            'drift_months': r['drift_months'],
        })
    # Sort each developer's list chronologically by COD
    for dev, rows in drift_out.items():
        rows.sort(key=lambda r: (r['cod_current'] or '9999', r['name']))

    # ---- Scheme wins ----
    scheme_rows = conn.execute("""
        SELECT p.current_developer AS developer, sc.scheme, sc.round, sc.project_id,
               p.name AS project_name, p.technology, p.state,
               sc.capacity_mw, sc.storage_mwh, sc.contract_type, sc.source_url
        FROM scheme_contracts sc
        JOIN projects p ON p.id = sc.project_id
        WHERE p.current_developer IS NOT NULL AND p.current_developer != ''
    """).fetchall()

    schemes_out = defaultdict(list)
    for r in scheme_rows:
        schemes_out[r['developer']].append({
            'scheme': r['scheme'],
            'round': r['round'],
            'project_id': r['project_id'],
            'project_name': r['project_name'],
            'technology': r['technology'],
            'state': r['state'],
            'capacity_mw': r['capacity_mw'],
            'storage_mwh': r['storage_mwh'],
            'contract_type': r['contract_type'],
            'source_url': r['source_url'],
        })

    # ---- Fleet performance (only developers with ≥3 ranked projects) ----
    perf_rows = conn.execute("""
        SELECT p.current_developer AS developer, lte.project_id, p.name AS project_name,
               lte.technology, lte.quartile, lte.composite_score,
               lte.year, pa.capacity_factor_pct, pa.revenue_per_mw
        FROM projects p
        JOIN league_table_entries lte ON lte.project_id = p.id
        LEFT JOIN performance_annual pa ON pa.project_id = p.id AND pa.year = lte.year
        WHERE p.current_developer IS NOT NULL AND p.current_developer != ''
    """).fetchall()

    perf_agg = defaultdict(lambda: {
        'projects': [],
        'composite_values': [],
        'cf_values': [],
        'quartile_counts': {1: 0, 2: 0, 3: 0, 4: 0},
    })
    for r in perf_rows:
        agg = perf_agg[r['developer']]
        agg['projects'].append({
            'project_id': r['project_id'],
            'project_name': r['project_name'],
            'technology': r['technology'],
            'quartile': r['quartile'],
            'composite_score': round(r['composite_score'], 1) if r['composite_score'] is not None else None,
            'capacity_factor_pct': round(r['capacity_factor_pct'], 1) if r['capacity_factor_pct'] is not None else None,
            'year': r['year'],
        })
        if r['composite_score'] is not None:
            agg['composite_values'].append(r['composite_score'])
        if r['capacity_factor_pct'] is not None:
            agg['cf_values'].append(r['capacity_factor_pct'])
        if r['quartile'] in (1, 2, 3, 4):
            agg['quartile_counts'][r['quartile']] += 1

    perf_out = {}
    for dev, d in perf_agg.items():
        ranked = sum(d['quartile_counts'].values())
        if ranked < 1:
            continue  # no signal at all
        cf = d['cf_values']
        comp = d['composite_values']
        perf_out[dev] = {
            'ranked_projects': ranked,
            'avg_cf': round(sum(cf) / len(cf), 1) if cf else None,
            'avg_composite': round(sum(comp) / len(comp), 1) if comp else None,
            'quartile_counts': d['quartile_counts'],
            'q1_pct': round(d['quartile_counts'][1] / ranked * 100, 0) if ranked else None,
            'meaningful': ranked >= 3,
            'projects': sorted(d['projects'], key=lambda p: (p['quartile'] or 9, -(p['composite_score'] or 0))),
        }

    # ---- Offtake counterparties ----
    off_rows = conn.execute("""
        SELECT p.current_developer AS developer, o.party AS counterparty, o.type AS offtake_type,
               o.project_id, p.name AS project_name, p.technology, p.state,
               o.term_years, o.capacity_mw AS offtake_mw, o.source_url
        FROM offtakes o
        JOIN projects p ON p.id = o.project_id
        WHERE p.current_developer IS NOT NULL AND p.current_developer != ''
          AND o.party IS NOT NULL AND o.party != ''
    """).fetchall()

    offtake_out = defaultdict(list)
    for r in off_rows:
        offtake_out[r['developer']].append({
            'counterparty': r['counterparty'],
            'offtake_type': r['offtake_type'],
            'project_id': r['project_id'],
            'project_name': r['project_name'],
            'technology': r['technology'],
            'state': r['state'],
            'term_years': r['term_years'],
            'offtake_mw': r['offtake_mw'],
            'source_url': r['source_url'],
        })

    # ---- Ownership events (inline badges on projects) ----
    own_rows = conn.execute("""
        SELECT oh.project_id, oh.period, oh.owner, oh.role,
               oh.acquisition_value_aud, oh.transaction_structure, oh.source_url,
               p.current_developer AS developer, p.name AS project_name
        FROM ownership_history oh
        JOIN projects p ON p.id = oh.project_id
        WHERE p.current_developer IS NOT NULL AND p.current_developer != ''
    """).fetchall()

    ownership_out = defaultdict(list)
    for r in own_rows:
        ownership_out[r['developer']].append({
            'project_id': r['project_id'],
            'project_name': r['project_name'],
            'period': r['period'],
            'owner': r['owner'],
            'role': r['role'],
            'acquisition_value_aud': r['acquisition_value_aud'],
            'transaction_structure': r['transaction_structure'],
            'source_url': r['source_url'],
        })

    write_json(os.path.join(DATA_DIR, 'analytics', 'developer-analytics.json'), {
        'equipment_preferences': eq_out,
        'cod_drift': dict(drift_out),
        'scheme_wins': dict(schemes_out),
        'fleet_performance': perf_out,
        'offtake_counterparties': dict(offtake_out),
        'ownership_events': dict(ownership_out),
        'exported_at': datetime.now().isoformat(),
    })
    print(f"  analytics/developer-analytics.json ({len(eq_out)} eq, {len(perf_out)} perf, {len(schemes_out)} scheme, {len(offtake_out)} offtake)")


def export_oem_profiles(conn):
    """Export OEM (equipment supplier) profiles to JSON.
    Merges data from both the suppliers table AND eis_technical_specs
    to ensure EIS-sourced supplier data appears in market share analytics.
    """
    rows = conn.execute("""
        SELECT s.supplier, s.role, s.model, s.project_id,
               p.technology, p.status, p.state, p.capacity_mw, p.storage_mwh
        FROM suppliers s
        JOIN projects p ON s.project_id = p.id
        WHERE s.role IN ('wind_oem', 'solar_oem', 'bess_oem', 'hydro_oem', 'inverter')
    """).fetchall()

    # Group by supplier name
    oem_data = defaultdict(list)
    for r in rows:
        oem_data[r['supplier']].append(dict(r))

    # ── Bridge EIS supplier data into OEM profiles ──
    # Track which project+role combos already exist to avoid double-counting
    existing_pairs = set()
    for r in rows:
        existing_pairs.add((r['project_id'], r['role'], r['supplier']))

    # EIS cell suppliers → bess_oem role
    eis_cell_rows = conn.execute("""
        SELECT e.project_id, e.cell_supplier, e.inverter_supplier, e.inverter_model,
               p.technology, p.status, p.state, p.capacity_mw, p.storage_mwh
        FROM eis_technical_specs e
        JOIN projects p ON e.project_id = p.id
        WHERE e.cell_supplier IS NOT NULL OR e.inverter_supplier IS NOT NULL
    """).fetchall()

    for r in eis_cell_rows:
        # Bridge cell supplier as bess_oem
        if r['cell_supplier']:
            # Normalise multi-supplier entries (e.g. "CATL / Tesla" → use primary)
            supplier_name = r['cell_supplier'].strip()
            if (r['project_id'], 'bess_oem', supplier_name) not in existing_pairs:
                oem_data[supplier_name].append({
                    'supplier': supplier_name,
                    'role': 'bess_oem',
                    'model': None,
                    'project_id': r['project_id'],
                    'technology': r['technology'],
                    'status': r['status'],
                    'state': r['state'],
                    'capacity_mw': r['capacity_mw'],
                    'storage_mwh': r['storage_mwh'],
                })
                existing_pairs.add((r['project_id'], 'bess_oem', supplier_name))

        # Bridge inverter supplier as inverter role
        if r['inverter_supplier']:
            supplier_name = r['inverter_supplier'].strip()
            if (r['project_id'], 'inverter', supplier_name) not in existing_pairs:
                oem_data[supplier_name].append({
                    'supplier': supplier_name,
                    'role': 'inverter',
                    'model': r['inverter_model'],
                    'project_id': r['project_id'],
                    'technology': r['technology'],
                    'status': r['status'],
                    'state': r['state'],
                    'capacity_mw': r['capacity_mw'],
                    'storage_mwh': r['storage_mwh'],
                })
                existing_pairs.add((r['project_id'], 'inverter', supplier_name))

    seen_slugs = {}
    oems = []
    for name, records in oem_data.items():
        slug = make_slug(name)
        if slug in seen_slugs:
            slug = f"{slug}-{len([k for k in seen_slugs if k.startswith(slug)]) + 1}"
        seen_slugs[slug] = name

        by_tech = defaultdict(int)
        by_status = defaultdict(int)
        by_state = defaultdict(int)
        states = set()
        roles = set()
        models = set()
        total_mw = 0
        total_storage_mwh = 0
        project_ids = set()

        # Detailed breakdowns for market share charts
        status_detail = defaultdict(lambda: {'count': 0, 'capacity_mw': 0, 'storage_mwh': 0})
        state_detail = defaultdict(lambda: {'count': 0, 'capacity_mw': 0, 'storage_mwh': 0})

        for r in records:
            by_tech[r['technology']] += 1
            by_status[r['status']] += 1
            by_state[r['state']] += 1
            states.add(r['state'])
            roles.add(r['role'])
            if r['model']:
                models.add(r['model'])
            cap = r['capacity_mw'] or 0
            stor = r['storage_mwh'] or 0
            total_mw += cap
            total_storage_mwh += stor
            project_ids.add(r['project_id'])

            # Per-status detail
            status_detail[r['status']]['count'] += 1
            status_detail[r['status']]['capacity_mw'] += cap
            status_detail[r['status']]['storage_mwh'] += stor

            # Per-state detail
            state_detail[r['state']]['count'] += 1
            state_detail[r['state']]['capacity_mw'] += cap
            state_detail[r['state']]['storage_mwh'] += stor

        # Round values in detail dicts
        for v in status_detail.values():
            v['capacity_mw'] = round(v['capacity_mw'], 1)
            v['storage_mwh'] = round(v['storage_mwh'], 1)
        for v in state_detail.values():
            v['capacity_mw'] = round(v['capacity_mw'], 1)
            v['storage_mwh'] = round(v['storage_mwh'], 1)

        oems.append({
            'slug': slug,
            'name': name,
            'project_count': len(project_ids),
            'total_capacity_mw': round(total_mw, 1),
            'total_storage_mwh': round(total_storage_mwh, 1),
            'roles': sorted(roles),
            'models': sorted(models),
            'by_technology': dict(by_tech),
            'by_status': dict(by_status),
            'by_state': dict(by_state),
            'states': sorted(states),
            'project_ids': sorted(project_ids),
            'status_detail': dict(status_detail),
            'state_detail': dict(state_detail),
        })

    oems.sort(key=lambda o: o['total_capacity_mw'], reverse=True)

    write_json(os.path.join(DATA_DIR, 'indexes', 'oem-profiles.json'), {
        'oems': oems,
        'total': len(oems),
    })
    print(f"  indexes/oem-profiles.json ({len(oems)} OEMs)")


def export_oem_analytics(conn):
    """Pre-aggregate OEM intelligence data for the /oems deep-dive.

    Joins the suppliers table against projects, performance_annual, and
    league_table_entries so the frontend doesn't have to do N per-project
    fetches to compute OEM-level summaries. Output file:

      analytics/oem-analytics.json = {
        performance: {
          <oem_name>: { avg_cf, avg_composite, quartile_counts: {1..4},
                        project_quartiles: [{project_id, quartile, cf, tech, year}] }
        },
        developers: {
          <oem_name>: [{developer, project_count, total_mw, technologies:[...]}]
        },
        bess_capex_by_oem: [...]   // lifted from bess-capex.json for convenience
      }
    """
    # Per-OEM performance: join suppliers → performance_annual → league_table_entries
    # Use the most-recent year for each project so we get a single CF/quartile per
    # OEM×project pair rather than mixing years.
    perf_rows = conn.execute("""
        WITH latest AS (
            SELECT project_id, MAX(year) AS year
            FROM performance_annual
            WHERE capacity_factor_pct IS NOT NULL
            GROUP BY project_id
        )
        SELECT s.supplier, s.role, s.project_id, s.model,
               p.technology, p.name as project_name,
               pa.year, pa.capacity_factor_pct, pa.energy_price_received, pa.revenue_per_mw,
               lte.quartile, lte.composite_score
        FROM suppliers s
        JOIN projects p ON p.id = s.project_id
        LEFT JOIN latest la ON la.project_id = s.project_id
        LEFT JOIN performance_annual pa ON pa.project_id = s.project_id AND pa.year = la.year
        LEFT JOIN league_table_entries lte ON lte.project_id = s.project_id AND lte.year = la.year
        WHERE s.role IN ('wind_oem', 'solar_oem', 'bess_oem', 'hydro_oem', 'inverter')
    """).fetchall()

    performance = defaultdict(lambda: {
        'project_quartiles': [],
        'cf_values': [],
        'composite_values': [],
        'quartile_counts': {1: 0, 2: 0, 3: 0, 4: 0},
    })
    for r in perf_rows:
        name = r['supplier']
        if r['capacity_factor_pct'] is not None:
            performance[name]['cf_values'].append(r['capacity_factor_pct'])
        if r['composite_score'] is not None:
            performance[name]['composite_values'].append(r['composite_score'])
        if r['quartile'] in (1, 2, 3, 4):
            performance[name]['quartile_counts'][r['quartile']] += 1
        if r['capacity_factor_pct'] is not None or r['quartile'] is not None:
            performance[name]['project_quartiles'].append({
                'project_id': r['project_id'],
                'project_name': r['project_name'],
                'technology': r['technology'],
                'quartile': r['quartile'],
                'capacity_factor_pct': round(r['capacity_factor_pct'], 1) if r['capacity_factor_pct'] is not None else None,
                'composite_score': round(r['composite_score'], 1) if r['composite_score'] is not None else None,
                'year': r['year'],
            })

    perf_out = {}
    for name, d in performance.items():
        cf_vals = d['cf_values']
        comp_vals = d['composite_values']
        total_ranked = sum(d['quartile_counts'].values())
        perf_out[name] = {
            'ranked_projects': total_ranked,
            'avg_cf': round(sum(cf_vals) / len(cf_vals), 1) if cf_vals else None,
            'avg_composite': round(sum(comp_vals) / len(comp_vals), 1) if comp_vals else None,
            'quartile_counts': d['quartile_counts'],
            'q1_pct': round(d['quartile_counts'][1] / total_ranked * 100, 0) if total_ranked else None,
            'projects': sorted(d['project_quartiles'], key=lambda p: (p['quartile'] or 9, -(p['composite_score'] or 0))),
        }

    # Per-OEM developer breakdown
    dev_rows = conn.execute("""
        SELECT s.supplier, s.role, p.current_developer AS developer,
               p.technology, p.capacity_mw, p.id as project_id, p.name as project_name, p.status
        FROM suppliers s
        JOIN projects p ON p.id = s.project_id
        WHERE s.role IN ('wind_oem', 'solar_oem', 'bess_oem', 'hydro_oem', 'inverter')
          AND p.current_developer IS NOT NULL
          AND p.current_developer != ''
    """).fetchall()

    dev_agg = defaultdict(lambda: defaultdict(lambda: {
        'project_count': 0,
        'total_mw': 0.0,
        'technologies': set(),
        'statuses': set(),
    }))
    for r in dev_rows:
        d = dev_agg[r['supplier']][r['developer']]
        d['project_count'] += 1
        d['total_mw'] += r['capacity_mw'] or 0
        d['technologies'].add(r['technology'])
        d['statuses'].add(r['status'])

    dev_out = {}
    for oem, devs in dev_agg.items():
        entries = []
        for dev_name, stats in devs.items():
            entries.append({
                'developer': dev_name,
                'project_count': stats['project_count'],
                'total_mw': round(stats['total_mw'], 1),
                'technologies': sorted(stats['technologies']),
                'statuses': sorted(stats['statuses']),
            })
        entries.sort(key=lambda e: (-e['project_count'], -e['total_mw']))
        dev_out[oem] = entries

    # Concentration: Herfindahl-Hirschman Index per OEM role
    # HHI = Σ(share²) × 10,000 for market-share percentages; 10,000 = monopoly
    role_totals = defaultdict(lambda: defaultdict(float))  # role → oem → mw
    for r in perf_rows:
        role_totals[r['role']][r['supplier']] += 0  # touch key
    # Use project_count by_technology from suppliers table for concentration
    conc_rows = conn.execute("""
        SELECT s.role, s.supplier, COUNT(DISTINCT s.project_id) as projects,
               SUM(COALESCE(p.capacity_mw, 0)) as mw
        FROM suppliers s
        JOIN projects p ON p.id = s.project_id
        WHERE s.role IN ('wind_oem', 'solar_oem', 'bess_oem', 'hydro_oem', 'inverter')
        GROUP BY s.role, s.supplier
    """).fetchall()

    concentration = {}
    by_role = defaultdict(list)
    for r in conc_rows:
        by_role[r['role']].append({'supplier': r['supplier'], 'projects': r['projects'], 'mw': r['mw']})

    for role, entries in by_role.items():
        total_mw = sum(e['mw'] for e in entries) or 1
        total_p = sum(e['projects'] for e in entries) or 1
        hhi_mw = sum((e['mw'] / total_mw * 100) ** 2 for e in entries)
        hhi_p = sum((e['projects'] / total_p * 100) ** 2 for e in entries)
        entries.sort(key=lambda e: -e['mw'])
        top3_share_mw = sum(e['mw'] for e in entries[:3]) / total_mw * 100 if total_mw else 0
        top3_share_p = sum(e['projects'] for e in entries[:3]) / total_p * 100 if total_p else 0
        concentration[role] = {
            'total_oems': len(entries),
            'total_mw': round(total_mw, 1),
            'total_projects': total_p,
            'hhi_mw': round(hhi_mw, 0),
            'hhi_projects': round(hhi_p, 0),
            'top3_share_mw_pct': round(top3_share_mw, 1),
            'top3_share_projects_pct': round(top3_share_p, 1),
            'top3': [{'supplier': e['supplier'], 'mw': round(e['mw'], 1), 'projects': e['projects']} for e in entries[:3]],
        }

    write_json(os.path.join(DATA_DIR, 'analytics', 'oem-analytics.json'), {
        'performance': perf_out,
        'developers': dev_out,
        'concentration': concentration,
        'exported_at': datetime.now().isoformat(),
    })
    print(f"  analytics/oem-analytics.json ({len(perf_out)} perf, {len(dev_out)} dev, {len(concentration)} roles)")


def export_contractor_profiles(conn):
    """Export contractor (EPC/BoP) profiles to JSON."""
    rows = conn.execute("""
        SELECT s.supplier, s.role, s.project_id,
               p.technology, p.status, p.state, p.capacity_mw
        FROM suppliers s
        JOIN projects p ON s.project_id = p.id
        WHERE s.role IN ('epc', 'bop')
    """).fetchall()

    # Group by supplier name
    contractor_data = defaultdict(list)
    for r in rows:
        contractor_data[r['supplier']].append(dict(r))

    seen_slugs = {}
    contractors = []
    for name, records in contractor_data.items():
        slug = make_slug(name)
        if slug in seen_slugs:
            slug = f"{slug}-{len([k for k in seen_slugs if k.startswith(slug)]) + 1}"
        seen_slugs[slug] = name

        by_tech = defaultdict(int)
        by_status = defaultdict(int)
        states = set()
        roles = set()
        total_mw = 0
        project_ids = set()

        for r in records:
            by_tech[r['technology']] += 1
            by_status[r['status']] += 1
            states.add(r['state'])
            roles.add(r['role'])
            total_mw += r['capacity_mw'] or 0
            project_ids.add(r['project_id'])

        contractors.append({
            'slug': slug,
            'name': name,
            'project_count': len(project_ids),
            'total_capacity_mw': round(total_mw, 1),
            'roles': sorted(roles),
            'by_technology': dict(by_tech),
            'by_status': dict(by_status),
            'states': sorted(states),
            'project_ids': sorted(project_ids),
        })

    contractors.sort(key=lambda c: c['total_capacity_mw'], reverse=True)

    write_json(os.path.join(DATA_DIR, 'indexes', 'contractor-profiles.json'), {
        'contractors': contractors,
        'total': len(contractors),
    })
    print(f"  indexes/contractor-profiles.json ({len(contractors)} contractors)")


def export_offtaker_profiles(conn):
    """Export offtaker profiles to JSON."""
    rows = conn.execute("""
        SELECT o.party, o.type, o.project_id, o.term_years, o.capacity_mw,
               p.technology, p.status, p.state, p.capacity_mw as project_capacity_mw
        FROM offtakes o
        JOIN projects p ON o.project_id = p.id
    """).fetchall()

    if not rows:
        print("  indexes/offtaker-profiles.json (0 offtakers — skipped)")
        return

    # Group by party name
    offtaker_data = defaultdict(list)
    for r in rows:
        offtaker_data[r['party']].append(dict(r))

    seen_slugs = {}
    offtakers = []
    for name, records in offtaker_data.items():
        slug = make_slug(name)
        if slug in seen_slugs:
            slug = f"{slug}-{len([k for k in seen_slugs if k.startswith(slug)]) + 1}"
        seen_slugs[slug] = name

        by_tech = defaultdict(int)
        by_status = defaultdict(int)
        states = set()
        types = set()
        total_mw = 0
        project_ids = set()

        for r in records:
            by_tech[r['technology']] += 1
            by_status[r['status']] += 1
            states.add(r['state'])
            types.add(r['type'])
            total_mw += r['project_capacity_mw'] or 0
            project_ids.add(r['project_id'])

        offtakers.append({
            'slug': slug,
            'name': name,
            'project_count': len(project_ids),
            'total_capacity_mw': round(total_mw, 1),
            'types': sorted(types),
            'by_technology': dict(by_tech),
            'by_status': dict(by_status),
            'states': sorted(states),
            'project_ids': sorted(project_ids),
        })

    offtakers.sort(key=lambda o: o['total_capacity_mw'], reverse=True)

    write_json(os.path.join(DATA_DIR, 'indexes', 'offtaker-profiles.json'), {
        'offtakers': offtakers,
        'total': len(offtakers),
    })
    print(f"  indexes/offtaker-profiles.json ({len(offtakers)} offtakers)")


def export_bess_capex(conn):
    """Export BESS capex analytics data for cost trend analysis."""
    rows = conn.execute("""
        SELECT p.id, p.name, p.status, p.capacity_mw, p.storage_mwh,
               p.capex_aud_m, p.capex_year, p.capex_source, p.capex_source_url, p.state,
               p.current_developer, p.current_operator,
               s.supplier as bess_oem, s.model as bess_model
        FROM projects p
        LEFT JOIN suppliers s ON s.project_id = p.id AND s.role = 'bess_oem'
        WHERE p.technology = 'bess'
        AND p.status IN ('operating', 'construction', 'commissioning')
        AND p.capex_aud_m IS NOT NULL
        AND p.capacity_mw > 0
        ORDER BY p.capex_year, p.capacity_mw DESC
    """).fetchall()

    # Check for project_stages table
    has_stages = bool(conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='project_stages'"
    ).fetchone())

    # Pre-fetch stage capex data for scope-matched calculations
    stage_scope = {}
    if has_stages:
        stage_rows = conn.execute("""
            SELECT project_id,
                   SUM(CASE WHEN capex_aud_m IS NOT NULL THEN capacity_mw ELSE 0 END) as capex_mw,
                   SUM(CASE WHEN capex_aud_m IS NOT NULL THEN storage_mwh ELSE 0 END) as capex_mwh,
                   SUM(capex_aud_m) as total_stage_capex,
                   COUNT(*) as total_stages,
                   SUM(CASE WHEN capex_aud_m IS NOT NULL THEN 1 ELSE 0 END) as costed_stages
            FROM project_stages
            GROUP BY project_id
            HAVING total_stage_capex IS NOT NULL
        """).fetchall()
        for sr in stage_rows:
            stage_scope[sr['project_id']] = dict(sr)

    # Remap DB IDs to canonical consolidated IDs where the JSON file was
    # manually renamed but the DB record was not updated
    _capex_id_remap = {
        'eraring-battery': ('eraring-big-battery', 'Eraring Big Battery'),
    }

    projects = []
    for r in rows:
        d = dict(r)

        # Apply ID remapping for consolidated projects
        if d['id'] in _capex_id_remap:
            new_id, new_name = _capex_id_remap[d['id']]
            d['id'] = new_id
            d['name'] = new_name
            if d.get('bess_model') == 'GridSolv Quantum':
                d['bess_model'] = 'Quantum / Quantum3'

        capex = d['capex_aud_m'] or 0

        # For multi-stage projects where capex only covers some stages,
        # use stage-matched capacity/storage for $/MW and $/MWh calculations.
        # Heuristic: if project capex ≈ sum of costed stages, it's partial scope.
        # If project capex > sum of costed stages, it covers the full project.
        pid = d['id']
        ss = stage_scope.get(pid)
        if ss and ss['costed_stages'] < ss['total_stages']:
            stage_sum = ss['total_stage_capex'] or 0
            # If project capex roughly matches sum of costed stages (within 5%),
            # capex only covers those stages — use scope-matched capacity
            if stage_sum > 0 and abs(capex - stage_sum) / stage_sum < 0.05:
                mw = ss['capex_mw'] or d['capacity_mw'] or 0
                mwh = ss['capex_mwh'] or d['storage_mwh'] or 0
                d['capex_scope_note'] = f"Capex covers {ss['costed_stages']} of {ss['total_stages']} stages ({round(mw)}MW/{round(mwh)}MWh scope)"
                d['capex_scope_mw'] = round(mw, 1)
                d['capex_scope_mwh'] = round(mwh, 1)
            else:
                # Project capex is total (covers all stages) — use full project capacity
                mw = d['capacity_mw'] or 0
                mwh = d['storage_mwh'] or 0
                d['capex_scope_note'] = f"Total capex across all {ss['total_stages']} stages"
        else:
            mw = d['capacity_mw'] or 0
            mwh = d['storage_mwh'] or 0

        d['capex_per_mw'] = round(capex / mw, 2) if mw > 0 else None
        d['capex_per_mwh'] = round(capex / mwh, 2) if mwh > 0 else None
        d['duration_hours'] = round(mwh / mw, 1) if mw > 0 and mwh > 0 else None

        # Also include stage info for multi-stage projects
        if has_stages:
            stages = conn.execute("""
                SELECT stage, name, capacity_mw, storage_mwh, status, capex_aud_m
                FROM project_stages WHERE project_id = ? ORDER BY stage
            """, (pid,)).fetchall()
            if stages:
                d['stages'] = [clean_none_values(dict(s)) for s in stages]

        projects.append(clean_none_values(d))

    # Summary stats by year
    by_year = defaultdict(list)
    for p in projects:
        if p.get('capex_year'):
            by_year[p['capex_year']].append(p)

    year_summary = {}
    for year, ps in sorted(by_year.items()):
        mw_costs = [p['capex_per_mw'] for p in ps if p.get('capex_per_mw')]
        mwh_costs = [p['capex_per_mwh'] for p in ps if p.get('capex_per_mwh')]
        year_summary[str(year)] = {
            'count': len(ps),
            'total_mw': round(sum(p.get('capacity_mw', 0) for p in ps), 1),
            'total_capex_m': round(sum(p.get('capex_aud_m', 0) for p in ps), 1),
            'avg_capex_per_mw': round(sum(mw_costs) / len(mw_costs), 2) if mw_costs else None,
            'avg_capex_per_mwh': round(sum(mwh_costs) / len(mwh_costs), 2) if mwh_costs else None,
        }

    # Summary by OEM
    by_oem = defaultdict(list)
    for p in projects:
        oem = p.get('bess_oem', 'Unknown')
        by_oem[oem].append(p)

    oem_summary = {}
    for oem, ps in sorted(by_oem.items(), key=lambda x: -len(x[1])):
        mw_costs = [p['capex_per_mw'] for p in ps if p.get('capex_per_mw')]
        mwh_costs = [p['capex_per_mwh'] for p in ps if p.get('capex_per_mwh')]
        oem_summary[oem] = {
            'count': len(ps),
            'total_mw': round(sum(p.get('capacity_mw', 0) for p in ps), 1),
            'avg_capex_per_mw': round(sum(mw_costs) / len(mw_costs), 2) if mw_costs else None,
            'avg_capex_per_mwh': round(sum(mwh_costs) / len(mwh_costs), 2) if mwh_costs else None,
        }

    result = {
        'projects': projects,
        'by_year': year_summary,
        'by_oem': oem_summary,
        'exported_at': datetime.now().isoformat(),
    }

    write_json(os.path.join(DATA_DIR, 'analytics', 'bess-capex.json'), result)
    print(f"  analytics/bess-capex.json ({len(projects)} projects with capex data)")


def export_project_timeline(conn):
    """Export project timeline analytics — when projects reached COD or key milestones."""
    rows = conn.execute("""
        SELECT p.id, p.name, p.technology, p.status, p.capacity_mw, p.storage_mwh,
               p.state, p.current_developer, p.first_seen, p.development_stage,
               p.cod_current, p.cod_original,
               p.zombie_flag, p.data_confidence, p.confidence_score,
               (SELECT MIN(te.date) FROM timeline_events te
                WHERE te.project_id = p.id AND te.event_type IN ('planning_submitted','conceived','planning_approved')
               ) as earliest_event
        FROM projects p
        ORDER BY p.cod_current NULLS LAST, p.capacity_mw DESC
    """).fetchall()

    # Load scheme IDs and user overrides for curated filter fields
    scheme_ids = _load_scheme_project_ids()
    user_overrides = _load_user_overrides()

    projects = []
    for r in rows:
        d = dict(r)
        # Determine the best year to place this project on the timeline:
        # 1. For operating/commissioning: use COD year (when it actually came online)
        # 2. For construction/development: use cod_current (expected COD) as the target year
        # 3. Fallback: earliest timeline event, then first_seen (but NOT if first_seen is 2026-03-12 bulk import)
        timeline_year = None

        if d.get('cod_current'):
            timeline_year = int(d['cod_current'][:4])
        elif d.get('cod_original'):
            timeline_year = int(d['cod_original'][:4])
        elif d.get('earliest_event'):
            timeline_year = int(d['earliest_event'][:4])
        elif d.get('first_seen'):
            fs = d['first_seen']
            # Exclude the bulk import date — not meaningful
            if fs != '2026-03-12':
                timeline_year = int(fs[:4])

        if timeline_year:
            d['first_seen_year'] = timeline_year

        # Enrich with scheme contract flag and user overrides for curated filtering
        pid = d.get('id')
        if pid and pid in scheme_ids:
            d['has_scheme_contract'] = True
        if pid and pid in user_overrides.get('include', {}):
            d['user_override'] = 'include'
        elif pid and pid in user_overrides.get('exclude', {}):
            d['user_override'] = 'exclude'

        projects.append(clean_none_values(d))

    # By year breakdown
    by_year = defaultdict(list)
    for p in projects:
        year = p.get('first_seen_year', 'unknown')
        by_year[str(year)].append(p)

    year_summary = {}
    for year, ps in sorted(by_year.items()):
        year_summary[year] = {
            'count': len(ps),
            'total_mw': round(sum(p.get('capacity_mw', 0) for p in ps), 1),
            'by_technology': {},
            'by_state': {},
            'by_status': {},
        }
        for tech in set(p.get('technology', 'unknown') for p in ps):
            tech_ps = [p for p in ps if p.get('technology') == tech]
            year_summary[year]['by_technology'][tech] = {
                'count': len(tech_ps),
                'capacity_mw': round(sum(p.get('capacity_mw', 0) for p in tech_ps), 1),
            }
        for state in set(p.get('state', 'unknown') for p in ps):
            state_ps = [p for p in ps if p.get('state') == state]
            year_summary[year]['by_state'][state] = {
                'count': len(state_ps),
                'capacity_mw': round(sum(p.get('capacity_mw', 0) for p in state_ps), 1),
            }
        for status in set(p.get('status', 'unknown') for p in ps):
            status_ps = [p for p in ps if p.get('status') == status]
            year_summary[year]['by_status'][status] = {
                'count': len(status_ps),
                'capacity_mw': round(sum(p.get('capacity_mw', 0) for p in status_ps), 1),
            }

    # By technology summary
    by_tech = defaultdict(list)
    for p in projects:
        by_tech[p.get('technology', 'unknown')].append(p)

    tech_summary = {}
    for tech, ps in sorted(by_tech.items(), key=lambda x: -len(x[1])):
        tech_summary[tech] = {
            'count': len(ps),
            'total_mw': round(sum(p.get('capacity_mw', 0) for p in ps), 1),
            'with_date': sum(1 for p in ps if p.get('first_seen_year')),
        }

    # By state summary
    by_state = defaultdict(list)
    for p in projects:
        by_state[p.get('state', 'unknown')].append(p)

    state_summary = {}
    for state, ps in sorted(by_state.items(), key=lambda x: -len(x[1])):
        state_summary[state] = {
            'count': len(ps),
            'total_mw': round(sum(p.get('capacity_mw', 0) for p in ps), 1),
        }

    result = {
        'projects': projects,
        'by_year': year_summary,
        'by_technology': tech_summary,
        'by_state': state_summary,
        'total_with_date': sum(1 for p in projects if p.get('first_seen_year')),
        'total_without_date': sum(1 for p in projects if not p.get('first_seen_year')),
        'exported_at': datetime.now().isoformat(),
    }

    write_json(os.path.join(DATA_DIR, 'analytics', 'project-timeline.json'), result)
    print(f"  analytics/project-timeline.json ({len(projects)} projects, {result['total_with_date']} with dates)")


def export_data_sources(conn):
    """Export data source status and metadata for the Data Sources page."""
    # Known data sources with metadata
    SOURCE_META = [
        {
            'id': 'aemo_generation_info',
            'name': 'AEMO Generation Information',
            'description': 'Monthly Excel from AEMO with all NEM registered and proposed generators, capacities, and status.',
            'url': 'https://www.aemo.com.au/energy-systems/electricity/national-electricity-market-nem/nem-forecasting-and-planning/forecasting-and-planning-data/generation-information',
            'frequency': 'monthly',
            'script': 'import_aemo_gen_info.py',
        },
        {
            'id': 'openelectricity_performance',
            'name': 'OpenElectricity Performance',
            'description': 'Annual energy output, capacity factor, revenue, and curtailment data from the OpenElectricity API.',
            'url': 'https://openelectricity.org.au',
            'frequency': 'monthly',
            'script': 'import_openelectricity.py',
        },
        {
            'id': 'openelectricity_metadata',
            'name': 'OpenElectricity Facility Metadata',
            'description': 'Facility coordinates, commencement dates, and unit details from the OpenElectricity API.',
            'url': 'https://openelectricity.org.au',
            'frequency': 'quarterly',
            'script': 'harvest_facility_metadata.py',
        },
        {
            'id': 'epbc_referrals',
            'name': 'EPBC Referrals',
            'description': 'Environmental planning referrals from the DCCEEW EPBC Act referrals database.',
            'url': 'https://epbcnotices.environment.gov.au/',
            'frequency': 'monthly',
            'script': 'import_epbc.py',
        },
        {
            'id': 'offtake_research',
            'name': 'Offtake / PPA Research',
            'description': 'Power purchase agreements and offtake contracts sourced from public announcements and news.',
            'url': '',
            'frequency': 'monthly',
            'script': 'research_offtakes.py',
        },
        {
            'id': 'web_research',
            'name': 'Web Research',
            'description': 'Timeline events and project details from RenewEconomy and other renewable energy news sources.',
            'url': 'https://reneweconomy.com.au',
            'frequency': 'ad_hoc',
            'script': 'web_research.py',
        },
        {
            'id': 'nemweb_bids',
            'name': 'NEMWEB BESS Bids',
            'description': 'AEMO NEMWEB daily bid data for BESS fleet — 10 price bands × direction per DUID per day. Powers the BESS Bidding intelligence page and quartile benchmarks.',
            'url': 'https://nemweb.com.au',
            'frequency': 'daily',
            'script': 'import_nemweb_bids.py',
        },
        {
            'id': 'news_rss',
            'name': 'News RSS',
            'description': 'RSS feeds from RenewEconomy, PV Magazine, and Energy Storage News — sourced daily for the News feed and NEM Activities timeline.',
            'url': 'https://reneweconomy.com.au',
            'frequency': 'daily',
            'script': 'import_news_rss.py',
        },
        {
            'id': 'aemo_isp_rez',
            'name': 'AEMO ISP REZ',
            'description': 'Renewable Energy Zone hosting and connection capacity from the AEMO Integrated System Plan. Powers REZ comparison and grid-connection analysis.',
            'url': 'https://aemo.com.au/energy-systems/major-publications/integrated-system-plan-isp',
            'frequency': 'yearly',
            'script': 'import_aemo_isp.py',
        },
        {
            'id': 'market_prices',
            'name': 'AEMO Market Prices',
            'description': 'Regional reference prices from AEMO dispatch, used as the revenue backstop when OpenElectricity data is incomplete.',
            'url': 'https://aemo.com.au',
            'frequency': 'monthly',
            'script': 'import_market_prices.py',
        },
        {
            'id': 'json_export',
            'name': 'JSON Export',
            'description': 'Static JSON export of all database tables for the frontend application.',
            'url': '',
            'frequency': 'ad_hoc',
            'script': 'exporters/export_json.py',
        },
    ]

    # Get latest run for each source from import_runs
    runs = conn.execute("""
        SELECT source, started_at, completed_at, status, records_imported, records_updated, records_new, error_message
        FROM import_runs
        WHERE id IN (SELECT MAX(id) FROM import_runs GROUP BY source)
        ORDER BY source
    """).fetchall()
    run_map = {r['source']: dict(r) for r in runs}

    # Fallback: detect data presence from actual tables when import_runs has no record
    # This handles pipelines run manually or via Claude sessions
    data_evidence = {}
    try:
        r = conn.execute("SELECT COUNT(*) as cnt, MAX(created_at) as latest FROM offtakes").fetchone()
        if r and r['cnt'] > 0:
            data_evidence['offtake_research'] = {'records': r['cnt'], 'latest': r['latest']}
    except Exception:
        pass
    try:
        r = conn.execute("SELECT COUNT(*) as cnt, MAX(created_at) as latest FROM performance_annual").fetchone()
        if r and r['cnt'] > 0:
            data_evidence['openelectricity_performance'] = {'records': r['cnt'], 'latest': r['latest']}
    except Exception:
        pass
    try:
        r = conn.execute("""
            SELECT COUNT(*) as cnt, MAX(created_at) as latest FROM timeline_events
            WHERE data_source IN ('web_research', 'timeline_enrichment', 'manual')
        """).fetchone()
        if r and r['cnt'] > 0:
            data_evidence['web_research'] = {'records': r['cnt'], 'latest': r['latest']}
    except Exception:
        pass
    try:
        r = conn.execute("""
            SELECT COUNT(*) as cnt, MAX(p.updated_at) as latest FROM projects p
            WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
        """).fetchone()
        if r and r['cnt'] > 0:
            data_evidence['openelectricity_metadata'] = {'records': r['cnt'], 'latest': r['latest']}
    except Exception:
        pass
    try:
        r = conn.execute("""
            SELECT COUNT(*) as cnt, MAX(created_at) as latest FROM timeline_events
            WHERE data_source = 'epbc'
        """).fetchone()
        if r and r['cnt'] > 0:
            data_evidence['epbc_referrals'] = {'records': r['cnt'], 'latest': r['latest']}
    except Exception:
        pass

    # Detect NEMWEB bid freshness from settlement_date (the date the bid was for)
    try:
        r = conn.execute("""
            SELECT COUNT(*) as cnt, MAX(settlement_date) as latest FROM bess_daily_bids
        """).fetchone()
        if r and r['cnt'] > 0:
            data_evidence['nemweb_bids'] = {'records': r['cnt'], 'latest': r['latest']}
    except Exception:
        pass

    # News RSS freshness from published_date
    try:
        r = conn.execute("""
            SELECT COUNT(*) as cnt, MAX(published_date) as latest FROM news_articles
        """).fetchone()
        if r and r['cnt'] > 0:
            data_evidence['news_rss'] = {'records': r['cnt'], 'latest': r['latest']}
    except Exception:
        pass

    # AEMO ISP REZ — detect via max isp_year
    try:
        r = conn.execute("""
            SELECT COUNT(*) as cnt, MAX(isp_year) as year FROM rez_isp_data
        """).fetchone()
        if r and r['cnt'] > 0 and r['year']:
            # Treat as "latest = January of ISP year + 1" (ISP is published annually)
            data_evidence['aemo_isp_rez'] = {
                'records': r['cnt'],
                'latest': f"{r['year']}-01-01T00:00:00",
            }
    except Exception:
        pass

    # Market prices — check market_prices table if it exists
    try:
        r = conn.execute("""
            SELECT COUNT(*) as cnt, MAX(settlement_date) as latest FROM market_prices
        """).fetchone()
        if r and r['cnt'] > 0:
            data_evidence['market_prices'] = {'records': r['cnt'], 'latest': r['latest']}
    except Exception:
        pass

    # JSON export is always "current" since we're running it now
    data_evidence['json_export'] = {'records': 0, 'latest': datetime.now().isoformat()}

    sources = []
    for meta in SOURCE_META:
        run = run_map.get(meta['id'], {})
        if run:
            sources.append({
                **meta,
                'last_run': run.get('completed_at') or run.get('started_at'),
                'last_status': run.get('status', 'never'),
                'records_imported': run.get('records_imported', 0),
                'records_updated': run.get('records_updated', 0),
                'records_new': run.get('records_new', 0),
                'error': run.get('error_message'),
            })
        elif meta['id'] in data_evidence:
            ev = data_evidence[meta['id']]
            sources.append({
                **meta,
                'last_run': ev['latest'],
                'last_status': 'completed',
                'records_imported': ev['records'],
                'records_updated': 0,
                'records_new': 0,
                'error': None,
            })
        else:
            sources.append({
                **meta,
                'last_run': None,
                'last_status': 'never',
                'records_imported': 0,
                'records_updated': 0,
                'records_new': 0,
                'error': None,
            })

    # Database stats
    total_projects = conn.execute("SELECT COUNT(*) FROM projects").fetchone()[0]
    total_offtakes = conn.execute("SELECT COUNT(*) FROM offtakes").fetchone()[0]
    total_suppliers = conn.execute("SELECT COUNT(DISTINCT supplier) FROM suppliers").fetchone()[0]
    operating = conn.execute("SELECT COUNT(*) FROM projects WHERE status = 'operating'").fetchone()[0]

    write_json(os.path.join(DATA_DIR, 'metadata', 'data-sources.json'), {
        'sources': sources,
        'database_stats': {
            'total_projects': total_projects,
            'total_offtakes': total_offtakes,
            'total_oems_contractors': total_suppliers,
            'operating_projects': operating,
        },
        'exported_at': datetime.now().isoformat(),
    })
    print(f"  metadata/data-sources.json ({len(sources)} sources)")


# ---------------------------------------------------------------------------
# Intelligence Layer exports
# ---------------------------------------------------------------------------

INTEL_DIR = os.path.join(DATA_DIR, 'analytics', 'intelligence')


def _months_between(date_a, date_b):
    """Return months between two date strings. Positive if b > a."""
    try:
        da = _parse_date_loose(date_a)
        db = _parse_date_loose(date_b)
        if da is None or db is None:
            return None
        return round((db - da).days / 30.44)
    except Exception:
        return None


def _parse_date_loose(s):
    """Parse various date formats into a datetime, or None."""
    if not s:
        return None
    s = str(s).strip()
    # Strip parenthetical suffixes like '2026 (Stage 1)' or '2017-12 (Phase 1)'
    s = re.sub(r'\s*\(.*?\)\s*$', '', s)
    # Handle 'Q3 2021' style
    qm = re.match(r'Q(\d)\s*(\d{4})', s)
    if qm:
        q, y = int(qm.group(1)), int(qm.group(2))
        month = (q - 1) * 3 + 2  # middle of quarter
        return datetime(y, month, 1)
    for fmt in ('%Y-%m-%d', '%Y-%m', '%Y'):
        try:
            return datetime.strptime(s[:10], fmt)
        except ValueError:
            continue
    return None


def _capacity_band(mw):
    """Classify capacity into small/medium/large."""
    if mw is None:
        return 'unknown'
    if mw < 50:
        return 'small'
    elif mw < 200:
        return 'medium'
    else:
        return 'large'


def _stats_summary(values):
    """Return dict with count, mean, median, p25, p75 for a list of numbers."""
    vals = [v for v in values if v is not None]
    if not vals:
        return {'count': 0, 'mean': None, 'median': None, 'p25': None, 'p75': None}
    vals_sorted = sorted(vals)
    n = len(vals_sorted)
    return {
        'count': n,
        'mean': round(sum(vals) / n, 1),
        'median': round(statistics.median(vals), 1),
        'p25': round(vals_sorted[max(0, n // 4 - 1)], 1) if n >= 4 else round(vals_sorted[0], 1),
        'p75': round(vals_sorted[min(n - 1, 3 * n // 4)], 1) if n >= 4 else round(vals_sorted[-1], 1),
    }


def _risk_level(score):
    if score >= 60:
        return 'red'
    elif score >= 30:
        return 'amber'
    return 'green'


def _cf_rating(cf):
    """Rate capacity factor for wind."""
    if cf is None:
        return 'Unknown'
    if cf >= 35:
        return 'Excellent'
    elif cf >= 28:
        return 'Good'
    elif cf >= 22:
        return 'Average'
    return 'Below Average'


def _grade(score):
    """Score 0-100 to letter grade."""
    if score >= 85:
        return 'A'
    elif score >= 70:
        return 'B'
    elif score >= 55:
        return 'C'
    elif score >= 40:
        return 'D'
    return 'F'


# ---- 1. Scheme Risk -------------------------------------------------------

def export_scheme_tracker(conn):
    """Track milestone progression for CIS and LTESA scheme projects."""
    from datetime import date as date_type

    # ---- Hardcoded round metadata (mirrors scheme-rounds.ts) ----
    ROUNDS = [
        # CIS Pilots
        {'id': 'cis-pilot-nsw', 'scheme': 'CIS', 'round': 'CIS Pilot — NSW', 'type': 'dispatchable', 'announced_date': '2023-11-23',
         'projects': [
             {'name': 'Orana REZ Battery', 'developer': 'Akaysha Energy', 'technology': 'bess', 'capacity_mw': 460, 'storage_mwh': 920, 'state': 'NSW', 'project_id': 'orana-bess'},
             {'name': 'Liddell BESS', 'developer': 'AGL Energy', 'technology': 'bess', 'capacity_mw': 500, 'storage_mwh': 1000, 'state': 'NSW', 'project_id': 'liddell-bess'},
             {'name': 'Smithfield Sydney Battery', 'developer': 'Iberdrola Australia', 'technology': 'bess', 'capacity_mw': 235, 'storage_mwh': 470, 'state': 'NSW', 'project_id': 'smithfield-bess'},
             {'name': 'Enel X VPP 1', 'developer': 'Enel X Australia', 'technology': 'vpp', 'capacity_mw': 43, 'state': 'NSW'},
             {'name': 'Enel X VPP 2', 'developer': 'Enel X Australia', 'technology': 'vpp', 'capacity_mw': 43, 'state': 'NSW'},
             {'name': 'Enel X VPP 3', 'developer': 'Enel X Australia', 'technology': 'vpp', 'capacity_mw': 44, 'state': 'NSW'},
         ]},
        {'id': 'cis-pilot-sa-vic', 'scheme': 'CIS', 'round': 'CIS Pilot — SA/VIC', 'type': 'dispatchable', 'announced_date': '2024-09-04',
         'projects': [
             {'name': 'Wooreen Battery', 'developer': 'EnergyAustralia', 'technology': 'bess', 'capacity_mw': 350, 'storage_mwh': 1400, 'state': 'VIC', 'project_id': 'wooreen-energy-storage-system'},
             {'name': 'Springfield BESS', 'developer': 'Neoen', 'technology': 'bess', 'capacity_mw': 200, 'storage_mwh': 400, 'state': 'VIC'},
             {'name': 'Mortlake BESS', 'developer': 'Origin Energy', 'technology': 'bess', 'capacity_mw': 135, 'storage_mwh': 270, 'state': 'VIC', 'project_id': 'mortlake-battery'},
             {'name': 'Tailem Bend BESS', 'developer': 'Iberdrola', 'technology': 'bess', 'capacity_mw': 200, 'storage_mwh': 560, 'state': 'SA', 'project_id': 'tailem-bend-stage-3'},
             {'name': 'Clements Gap Battery', 'developer': 'Pacific Blue', 'technology': 'bess', 'capacity_mw': 60, 'storage_mwh': 240, 'state': 'SA', 'project_id': 'clements-gap-bess'},
             {'name': 'Hallett Battery', 'developer': 'EnergyAustralia', 'technology': 'bess', 'capacity_mw': 50, 'storage_mwh': 756, 'state': 'SA', 'project_id': 'hallett-bess'},
         ]},
        # CIS Tenders
        {'id': 'cis-tender-1-nem-gen', 'scheme': 'CIS', 'round': 'Tender 1 — NEM Generation', 'type': 'generation', 'announced_date': '2024-12-11',
         'projects': [
             {'name': 'Valley of the Winds', 'developer': 'ACEN Australia', 'technology': 'wind', 'capacity_mw': 936, 'state': 'NSW', 'project_id': 'valley-of-the-winds'},
             {'name': 'Sandy Creek Solar Farm', 'developer': 'Lightsource bp', 'technology': 'solar', 'capacity_mw': 700, 'state': 'NSW', 'project_id': 'sandy-creek-solar-farm'},
             {'name': 'Spicers Creek Wind Farm', 'developer': 'Squadron Energy', 'technology': 'wind', 'capacity_mw': 700, 'state': 'NSW', 'project_id': 'spicers-creek-wind-farm'},
             {'name': 'Junction Rivers', 'developer': 'Windlab', 'technology': 'hybrid', 'capacity_mw': 585, 'storage_mwh': 800, 'state': 'NSW', 'project_id': 'junction-rivers-wind-and-bess'},
             {'name': 'Goulburn River Solar Farm', 'developer': 'Lightsource bp', 'technology': 'solar', 'capacity_mw': 450, 'state': 'NSW', 'project_id': 'goulburn-river-solar-farm-and-bess'},
             {'name': 'Thunderbolt Wind Farm', 'developer': 'Neoen', 'technology': 'wind', 'capacity_mw': 230, 'state': 'NSW', 'project_id': 'thunderbolt-wind-farm'},
             {'name': 'Glanmire Solar Farm', 'developer': 'Elgin Energy', 'technology': 'hybrid', 'capacity_mw': 60, 'storage_mwh': 104, 'state': 'NSW', 'project_id': 'glanmire-solar-farm'},
             {'name': 'Kentbruck Wind Farm', 'developer': 'Neoen', 'technology': 'wind', 'capacity_mw': 600, 'state': 'VIC', 'project_id': 'kentbruck-green-power-hub'},
             {'name': 'West Mokoan Solar Farm', 'developer': 'Lightsource bp', 'technology': 'hybrid', 'capacity_mw': 300, 'storage_mwh': 560, 'state': 'VIC', 'project_id': 'west-mokoan-solar-farm-and-bess'},
             {'name': 'Barwon Solar Farm', 'developer': 'Elgin Energy', 'technology': 'hybrid', 'capacity_mw': 250, 'storage_mwh': 500, 'state': 'VIC', 'project_id': 'barwon-solar-farm-and-bess'},
             {'name': 'Campbells Forest Solar Farm', 'developer': 'Risen Energy', 'technology': 'solar', 'capacity_mw': 205, 'state': 'VIC', 'project_id': 'campbells-forest-solar-farm'},
             {'name': 'Elaine Solar Farm', 'developer': 'Elgin Energy', 'technology': 'hybrid', 'capacity_mw': 125, 'storage_mwh': 250, 'state': 'VIC', 'project_id': 'elaine-solar-farm-and-bess'},
             {'name': 'Barnawartha Solar Farm', 'developer': 'Gentari', 'technology': 'hybrid', 'capacity_mw': 64, 'storage_mwh': 139, 'state': 'VIC', 'project_id': 'barnawartha-solar-and-energy-storage'},
             {'name': 'Goyder North Wind Farm', 'developer': 'Neoen', 'technology': 'wind', 'capacity_mw': 300, 'state': 'SA', 'project_id': 'goyder-north-wind-farm'},
             {'name': 'Palmer Wind Farm', 'developer': 'Tilt Renewables', 'technology': 'wind', 'capacity_mw': 274, 'state': 'SA', 'project_id': 'palmer-wind-farm'},
             {'name': 'Hopeland Solar Farm', 'developer': 'ACS', 'technology': 'solar', 'capacity_mw': 250, 'state': 'QLD', 'project_id': 'hopeland-solar-farm'},
             {'name': 'Majors Creek Solar Power Station', 'developer': 'Edify Energy', 'technology': 'hybrid', 'capacity_mw': 150, 'storage_mwh': 600, 'state': 'QLD', 'project_id': 'majors-creek-solar-power-station'},
             {'name': 'Ganymirra Solar Power Station', 'developer': 'Edify Energy', 'technology': 'hybrid', 'capacity_mw': 150, 'storage_mwh': 600, 'state': 'QLD', 'project_id': 'ganymirra-solar-power-station'},
             {'name': 'Mokoan Solar Farm', 'developer': 'European Energy Australia', 'technology': 'solar', 'capacity_mw': 46, 'state': 'VIC', 'project_id': 'mokoan-solar-farm'},
         ]},
        {'id': 'cis-tender-2-wem-disp', 'scheme': 'CIS', 'round': 'Tender 2 — WEM Dispatchable', 'type': 'dispatchable', 'announced_date': '2025-03-20',
         'projects': [
             {'name': 'Boddington Giga Battery', 'developer': 'PGS Energy', 'technology': 'bess', 'capacity_mw': 324, 'storage_mwh': 1296, 'state': 'WA'},
             {'name': 'Merredin Big Battery', 'developer': 'Atmos Renewables', 'technology': 'bess', 'capacity_mw': 100, 'storage_mwh': 400, 'state': 'WA'},
             {'name': 'Muchea Big Battery', 'developer': 'Neoen', 'technology': 'bess', 'capacity_mw': 150, 'storage_mwh': 600, 'state': 'WA'},
             {'name': 'Waroona Renewable Energy Project Stage 1', 'developer': 'Frontier Energy', 'technology': 'bess', 'capacity_mw': 80, 'storage_mwh': 299, 'state': 'WA'},
         ]},
        {'id': 'cis-tender-3-nem-disp', 'scheme': 'CIS', 'round': 'Tender 3 — NEM Dispatchable', 'type': 'dispatchable', 'announced_date': '2025-09-17',
         'projects': [
             {'name': 'Bulabul 2 BESS', 'developer': 'AMPYR Australia', 'technology': 'bess', 'capacity_mw': 100, 'storage_mwh': 406, 'state': 'NSW', 'project_id': 'bulabul-bess-2'},
             {'name': 'Swallow Tail BESS', 'developer': 'AMPYR Australia', 'technology': 'bess', 'capacity_mw': 300, 'storage_mwh': 1218, 'state': 'NSW', 'project_id': 'swallow-tail-bess'},
             {'name': 'Calala BESS', 'developer': 'Equis', 'technology': 'bess', 'capacity_mw': 150, 'storage_mwh': 300, 'state': 'NSW', 'project_id': 'calala-bess-a1'},
             {'name': 'Goulburn River Standalone BESS', 'developer': 'Lightsource bp', 'technology': 'bess', 'capacity_mw': 450, 'storage_mwh': 1370, 'state': 'NSW', 'project_id': 'goulburn-river-bess'},
             {'name': 'Mount Piper BESS Stage 1', 'developer': 'EnergyAustralia', 'technology': 'bess', 'capacity_mw': 250, 'storage_mwh': 1000, 'state': 'NSW', 'project_id': 'mt-piper-bess'},
             {'name': 'Deer Park BESS', 'developer': 'Akaysha Energy', 'technology': 'bess', 'capacity_mw': 275, 'storage_mwh': 1100, 'state': 'VIC', 'project_id': 'deer-park-bess-akaysha'},
             {'name': 'Joel Joel BESS', 'developer': 'ACEnergy', 'technology': 'bess', 'capacity_mw': 250, 'storage_mwh': 1000, 'state': 'VIC', 'project_id': 'joel-joel-bess'},
             {'name': 'Kiamal BESS', 'developer': 'TotalEnergies', 'technology': 'bess', 'capacity_mw': 220, 'storage_mwh': 810, 'state': 'VIC', 'project_id': 'kiamal-bess'},
             {'name': 'Little River BESS', 'developer': 'ACEnergy', 'technology': 'bess', 'capacity_mw': 350, 'storage_mwh': 1400, 'state': 'VIC', 'project_id': 'little-river-bess'},
             {'name': 'Mornington BESS', 'developer': 'Valent Energy', 'technology': 'bess', 'capacity_mw': 240, 'storage_mwh': 587, 'state': 'VIC', 'project_id': 'mornington-bess'},
             {'name': 'Capricorn BESS', 'developer': 'Potentia Energy', 'technology': 'bess', 'capacity_mw': 300, 'storage_mwh': 1200, 'state': 'QLD', 'project_id': 'capricorn-bess'},
             {'name': 'Lower Wonga BESS', 'developer': 'Equis', 'technology': 'bess', 'capacity_mw': 200, 'storage_mwh': 800, 'state': 'QLD', 'project_id': 'lower-wonga-bess'},
             {'name': 'Teebar BESS', 'developer': 'Atmos Renewables', 'technology': 'bess', 'capacity_mw': 400, 'storage_mwh': 1600, 'state': 'QLD', 'project_id': 'teebar-creek-battery-storage-kci'},
             {'name': 'Ulinda Park Expansion', 'developer': 'Akaysha Energy', 'technology': 'bess', 'capacity_mw': 195, 'storage_mwh': 780, 'state': 'QLD', 'project_id': 'ulinda-park-bess-expansion'},
             {'name': 'Koolunga BESS', 'developer': 'Equis', 'technology': 'bess', 'capacity_mw': 200, 'storage_mwh': 800, 'state': 'SA', 'project_id': 'koolunga-battery-energy-storage-system'},
             {'name': 'Reeves Plains BESS', 'developer': 'Alinta Energy', 'technology': 'bess', 'capacity_mw': 250, 'storage_mwh': 1000, 'state': 'SA', 'project_id': 'reeves-plains-power-station-bess'},
         ]},
        {'id': 'cis-tender-4-nem-gen', 'scheme': 'CIS', 'round': 'Tender 4 — NEM Generation', 'type': 'generation', 'announced_date': '2025-10-09',
         'projects': [
             {'name': 'Bell Bay Wind Farm', 'developer': 'Equis', 'technology': 'wind', 'capacity_mw': 224, 'state': 'TAS', 'project_id': None},
             {'name': 'Bendemeer Energy Hub', 'developer': 'Athena Energy Australia', 'technology': 'hybrid', 'capacity_mw': 252, 'storage_mwh': 300, 'state': 'NSW', 'project_id': 'bendemeer-renewable-energy-hub-solar-and-bess'},
             {'name': 'Bundey BESS and Solar', 'developer': 'Genaspi Energy Group', 'technology': 'hybrid', 'capacity_mw': 240, 'storage_mwh': 1200, 'state': 'SA', 'project_id': 'bundey-bess-and-solar-project'},
             {'name': "Carmody's Hill Wind Farm", 'developer': 'Aula Energy', 'technology': 'wind', 'capacity_mw': 247, 'state': 'SA', 'project_id': 'carmodys-hill-wind-farm'},
             {'name': 'Corop Solar Farm and BESS', 'developer': 'BNRG Leeson', 'technology': 'hybrid', 'capacity_mw': 230, 'storage_mwh': 704, 'state': 'VIC', 'project_id': 'corop-solar-farm'},
             {'name': 'Derby Solar Project', 'developer': 'Sungrow', 'technology': 'hybrid', 'capacity_mw': 95, 'storage_mwh': 210, 'state': 'VIC', 'project_id': 'derby-solar-farm-and-bess'},
             {'name': 'Dinawan Wind Farm Stage 1', 'developer': 'Spark Renewables', 'technology': 'wind', 'capacity_mw': 357, 'state': 'NSW', 'project_id': 'dinawan-energy-hub'},
             {'name': 'Gawara Baya', 'developer': 'Windlab', 'technology': 'hybrid', 'capacity_mw': 399, 'storage_mwh': 217, 'state': 'QLD', 'project_id': 'gawara-baya-wind-and-bess'},
             {'name': "Guthrie's Gap Solar Power Station", 'developer': 'Edify Energy', 'technology': 'hybrid', 'capacity_mw': 300, 'storage_mwh': 1200, 'state': 'QLD', 'project_id': 'guthries-gap-solar-power-station'},
             {'name': 'Hexham Wind Farm', 'developer': 'AGL', 'technology': 'wind', 'capacity_mw': 600, 'state': 'VIC', 'project_id': 'hexham'},
             {'name': 'Liverpool Range Wind Stage 1', 'developer': 'Tilt Renewables', 'technology': 'wind', 'capacity_mw': 634, 'state': 'NSW', 'project_id': 'liverpool-range-wind-farm'},
             {'name': 'Lower Wonga Solar Farm', 'developer': 'Lightsource bp', 'technology': 'solar', 'capacity_mw': 281, 'state': 'QLD', 'project_id': 'lower-wonga-solar-farm-and-bess'},
             {'name': 'Merino Solar Farm', 'developer': 'EDPR', 'technology': 'hybrid', 'capacity_mw': 450, 'storage_mwh': 1800, 'state': 'NSW', 'project_id': 'merino-solar-farm'},
             {'name': 'Middlebrook Solar Farm', 'developer': 'TotalEnergies', 'technology': 'hybrid', 'capacity_mw': 363, 'storage_mwh': 813, 'state': 'NSW', 'project_id': 'middlebrook-solar-and-bess'},
             {'name': 'Moah Creek Wind Farm', 'developer': 'Central Queensland Power', 'technology': 'wind', 'capacity_mw': 360, 'state': 'QLD', 'project_id': 'moah-creek-wind-farm'},
             {'name': 'Nowingi Solar Power Station', 'developer': 'Edify Energy', 'technology': 'hybrid', 'capacity_mw': 300, 'storage_mwh': 1200, 'state': 'VIC', 'project_id': 'nowingi-solar-farm-edify-kci'},
             {'name': 'Punchs Creek Solar Farm', 'developer': 'EDPR', 'technology': 'hybrid', 'capacity_mw': 400, 'storage_mwh': 1600, 'state': 'QLD'},
             {'name': 'Smoky Creek Solar Power Station', 'developer': 'Edify Energy', 'technology': 'hybrid', 'capacity_mw': 300, 'storage_mwh': 1200, 'state': 'QLD', 'project_id': 'smoky-creek-solar-power-station'},
             {'name': 'Tallawang Solar Hybrid', 'developer': 'Potentia Energy', 'technology': 'hybrid', 'capacity_mw': 500, 'storage_mwh': 1000, 'state': 'NSW', 'project_id': 'tallawang-solar-and-bess'},
             {'name': 'Willogoleche 2 Wind Farm', 'developer': 'ENGIE / Foresight', 'technology': 'wind', 'capacity_mw': 108, 'state': 'SA', 'project_id': 'willogoleche-2-wind-farm'},
         ]},
        # LTESA Rounds
        {'id': 'ltesa-round-1', 'scheme': 'LTESA', 'round': 'Round 1 — Generation + LDS', 'type': 'mixed', 'announced_date': '2023-05-03',
         'projects': [
             {'name': 'New England Solar Farm', 'developer': 'ACEN Australia', 'technology': 'solar', 'capacity_mw': 720, 'state': 'NSW', 'project_id': 'new-england-solar-farm'},
             {'name': 'Stubbo Solar Farm', 'developer': 'ACEN Australia', 'technology': 'solar', 'capacity_mw': 400, 'state': 'NSW', 'project_id': 'stubbo-solar-farm'},
             {'name': 'Coppabella Wind Farm', 'developer': 'Goldwind Australia', 'technology': 'wind', 'capacity_mw': 275, 'state': 'NSW', 'project_id': 'coppabella-wind-farm'},
             {'name': 'Limondale BESS', 'developer': 'RWE Renewables Australia', 'technology': 'bess', 'capacity_mw': 50, 'storage_mwh': 400, 'state': 'NSW', 'project_id': 'limondale-bess'},
         ]},
        {'id': 'ltesa-round-2', 'scheme': 'LTESA', 'round': 'Round 2 — Firming', 'type': 'firming', 'announced_date': '2023-11-22',
         'projects': [
             # Liddell BESS (500 MW) listed under cis-pilot-nsw — single contract under combined round
             {'name': 'Orana BESS', 'developer': 'Akaysha Energy', 'technology': 'bess', 'capacity_mw': 415, 'storage_mwh': 1660, 'state': 'NSW', 'project_id': 'orana-bess'},
             {'name': 'Enel X VPP Portfolio', 'developer': 'Enel X Australia', 'technology': 'vpp', 'capacity_mw': 95, 'state': 'NSW'},
             {'name': 'Smithfield BESS', 'developer': 'Iberdrola', 'technology': 'bess', 'capacity_mw': 65, 'storage_mwh': 130, 'state': 'NSW', 'project_id': 'smithfield-bess'},
         ]},
        {'id': 'ltesa-round-3', 'scheme': 'LTESA', 'round': 'Round 3 — Generation + LDS', 'type': 'mixed', 'announced_date': '2023-12-19',
         'projects': [
             {'name': 'Uungula Wind Farm', 'developer': 'Squadron Energy', 'technology': 'wind', 'capacity_mw': 400, 'state': 'NSW', 'project_id': 'uungula-wind-farm'},
             {'name': 'Culcairn Solar Farm', 'developer': 'Neoen', 'technology': 'solar', 'capacity_mw': 350, 'state': 'NSW', 'project_id': 'culcairn-solar-farm'},
             {'name': 'Richmond Valley BESS', 'developer': 'Ark Energy', 'technology': 'bess', 'capacity_mw': 275, 'storage_mwh': 2200, 'state': 'NSW', 'project_id': 'richmond-valley-bess'},
             {'name': 'Silver City Energy Storage Centre', 'developer': 'Hydrostor', 'technology': 'bess', 'capacity_mw': 200, 'storage_mwh': 1600, 'state': 'NSW', 'project_id': 'silver-city-energy-storage'},
             {'name': 'Goulburn River BESS', 'developer': 'Lightsource bp', 'technology': 'bess', 'capacity_mw': 49, 'storage_mwh': 392, 'state': 'NSW', 'project_id': 'goulburn-river-bess'},
         ]},
        {'id': 'ltesa-round-4', 'scheme': 'LTESA', 'round': 'Round 4 — Generation', 'type': 'generation', 'announced_date': '2024-07-01',
         'projects': [
             {'name': 'Maryvale Solar + BESS', 'developer': 'Unknown', 'technology': 'hybrid', 'capacity_mw': 172, 'storage_mwh': 372, 'state': 'NSW', 'project_id': 'maryvale-solar-and-energy-storage-system'},
             {'name': 'Flyers Creek Wind Farm', 'developer': 'Unknown', 'technology': 'wind', 'capacity_mw': 145, 'state': 'NSW', 'project_id': 'flyers-creek-wind-farm'},
         ]},
        {'id': 'ltesa-round-5', 'scheme': 'LTESA', 'round': 'Round 5 — Long Duration Storage', 'type': 'lds', 'announced_date': '2025-02-27',
         'projects': [
             {'name': 'Phoenix Pumped Hydro', 'developer': 'ACEN Australia', 'technology': 'pumped_hydro', 'capacity_mw': 800, 'storage_mwh': 11990, 'state': 'NSW', 'project_id': 'phoenix-pumped-hydro-project'},
             {'name': 'Stoney Creek BESS', 'developer': 'Enervest Utility', 'technology': 'bess', 'capacity_mw': 125, 'storage_mwh': 1000, 'state': 'NSW', 'project_id': 'stoney-creek-bess'},
             {'name': 'Griffith BESS', 'developer': 'Eku Energy', 'technology': 'bess', 'capacity_mw': 100, 'storage_mwh': 800, 'state': 'NSW', 'project_id': 'griffith-bess'},
         ]},
        {'id': 'ltesa-round-6', 'scheme': 'LTESA', 'round': 'Round 6 — Long Duration Storage', 'type': 'lds', 'announced_date': '2026-02-05',
         'projects': [
             {'name': 'Great Western Battery', 'developer': 'Neoen Australia', 'technology': 'bess', 'capacity_mw': 330, 'storage_mwh': 3500, 'state': 'NSW', 'project_id': 'great-western-battery-project'},
             {'name': 'Bowmans Creek BESS', 'developer': 'Ark Energy', 'technology': 'bess', 'capacity_mw': 250, 'storage_mwh': 2414, 'state': 'NSW', 'project_id': 'bowmans-creek-bess'},
             {'name': 'Bannaby BESS', 'developer': 'BW ESS', 'technology': 'bess', 'capacity_mw': 233, 'storage_mwh': 2676, 'state': 'NSW', 'project_id': 'bannaby-bess'},
             {'name': 'Armidale East BESS', 'developer': 'Unknown', 'technology': 'bess', 'capacity_mw': 158, 'storage_mwh': 1440, 'state': 'NSW', 'project_id': 'armidale-east-bess'},
             {'name': 'Ebor BESS', 'developer': 'Energy Vault / Bridge Energy', 'technology': 'bess', 'capacity_mw': 100, 'storage_mwh': 870, 'state': 'NSW', 'project_id': 'ebor-bess'},
             {'name': 'Kingswood BESS', 'developer': 'Iberdrola Australia', 'technology': 'bess', 'capacity_mw': 100, 'storage_mwh': 1080, 'state': 'NSW', 'project_id': 'kingswood-bess'},
         ]},
    ]

    # ---- Build lookup maps from DB ----
    # Project status from projects table
    project_rows = conn.execute("SELECT id, status, technology, capacity_mw, current_developer, cod_current FROM projects").fetchall()
    project_map = {r['id']: dict(r) for r in project_rows}

    # Timeline events for milestone dates
    event_map = defaultdict(dict)
    for ev in conn.execute("""
        SELECT project_id, event_type, date
        FROM timeline_events
        WHERE event_type IN ('fid', 'construction_start', 'commissioning', 'cod', 'planning_approved')
    """).fetchall():
        event_map[ev['project_id']][ev['event_type']] = ev['date']

    today = date_type.today()
    total_projects = 0
    total_mw = 0.0
    overall_by_stage = defaultdict(lambda: {'count': 0, 'mw': 0.0})

    round_outputs = []

    for rnd in ROUNDS:
        # Skip rounds with no announced date (future tenders)
        if not rnd['announced_date']:
            continue

        announced = date_type.fromisoformat(rnd['announced_date'])
        months_since = (today.year - announced.year) * 12 + (today.month - announced.month)

        by_stage = defaultdict(int)
        by_state = defaultdict(int)
        project_list = []

        for sp in rnd['projects']:
            pid = sp.get('project_id')
            db_proj = project_map.get(pid) if pid else None
            events = event_map.get(pid, {}) if pid else {}

            # Determine stage from DB status
            if db_proj:
                status = db_proj['status'] or 'development'
                developer = db_proj['current_developer'] or sp['developer']
            else:
                status = 'unknown'
                developer = sp['developer']

            # Map status to milestone stage
            stage = status
            if status in ('planning_approved', 'approved'):
                stage = 'planning_approved'
            elif status in ('commissioning',):
                stage = 'commissioning'

            fid_date = events.get('fid')
            construction_start = events.get('construction_start')
            cod_current = db_proj['cod_current'] if db_proj else None

            proj_entry = {
                'name': sp['name'],
                'project_id': pid,
                'developer': developer,
                'technology': sp['technology'],
                'capacity_mw': sp['capacity_mw'],
                'storage_mwh': sp.get('storage_mwh'),
                'state': sp['state'],
                'status': status,
                'stage': stage,
                'fid_date': fid_date,
                'construction_start': construction_start,
                'cod_current': cod_current,
            }

            project_list.append(proj_entry)
            by_stage[stage] += 1
            by_state[sp['state']] += 1

        total_capacity = sum(p['capacity_mw'] for p in project_list)
        total_storage = sum(p.get('storage_mwh') or 0 for p in project_list)

        round_entry = {
            'id': rnd['id'],
            'scheme': rnd['scheme'],
            'round': rnd['round'],
            'type': rnd['type'],
            'announced_date': rnd['announced_date'],
            'months_since_announced': months_since,
            'total_capacity_mw': round(total_capacity, 1),
            'total_storage_mwh': round(total_storage, 1),
            'num_projects': len(project_list),
            'by_stage': dict(by_stage),
            'by_state': dict(by_state),
            'projects': project_list,
        }
        round_outputs.append(round_entry)

        total_projects += len(project_list)
        total_mw += total_capacity
        for stage, count in by_stage.items():
            stage_mw = sum(p['capacity_mw'] for p in project_list if p['stage'] == stage)
            overall_by_stage[stage]['count'] += count
            overall_by_stage[stage]['mw'] += stage_mw

    output = {
        'rounds': round_outputs,
        'summary': {
            'total_projects': total_projects,
            'total_mw': round(total_mw, 1),
            'by_stage': {k: {'count': v['count'], 'mw': round(v['mw'], 1)} for k, v in overall_by_stage.items()},
        },
        'exported_at': datetime.now().isoformat(),
    }
    path = os.path.join(INTEL_DIR, 'scheme-tracker.json')
    write_json(path, clean_none_values(output))
    print(f"  analytics/intelligence/scheme-tracker.json ({total_projects} projects across {len(round_outputs)} rounds)")


# ---- 2. Drift Analysis ----------------------------------------------------

def export_drift_analysis(conn):
    """Comprehensive COD drift analysis across all projects."""
    rows = conn.execute("""
        SELECT id, name, technology, status, state, capacity_mw,
               cod_current, cod_original, current_developer
        FROM projects
        WHERE cod_current IS NOT NULL AND cod_original IS NOT NULL
    """).fetchall()

    projects = []
    by_tech = defaultdict(list)
    by_state = defaultdict(list)
    by_band = defaultdict(list)
    by_developer = defaultdict(list)
    by_year = defaultdict(list)

    for r in rows:
        drift = _months_between(r['cod_original'], r['cod_current'])
        if drift is None:
            continue

        # Only include projects that actually drifted
        if drift == 0:
            continue

        entry = {
            'project_id': r['id'],
            'name': r['name'],
            'technology': r['technology'],
            'status': r['status'],
            'state': r['state'],
            'capacity_mw': r['capacity_mw'],
            'drift_months': drift,
            'cod_current': r['cod_current'],
            'cod_original': r['cod_original'],
            'developer': r['current_developer'],
        }
        projects.append(entry)

        by_tech[r['technology']].append(drift)
        if r['state']:
            by_state[r['state']].append(drift)
        by_band[_capacity_band(r['capacity_mw'])].append(drift)
        if r['current_developer']:
            by_developer[r['current_developer']].append(drift)

        # Group by cod_original year
        orig_dt = _parse_date_loose(r['cod_original'])
        if orig_dt:
            by_year[orig_dt.year].append(drift)

    # Grouped statistics
    tech_stats = {k: _stats_summary(v) for k, v in sorted(by_tech.items())}
    state_stats = {k: _stats_summary(v) for k, v in sorted(by_state.items())}
    band_stats = {k: _stats_summary(v) for k, v in sorted(by_band.items())}

    # Developer ranking (min 3 projects)
    dev_ranking = []
    for dev, drifts in sorted(by_developer.items()):
        if len(drifts) >= 3:
            dev_ranking.append({
                'developer': dev,
                **_stats_summary(drifts),
                'on_time_pct': round(100 * sum(1 for d in drifts if abs(d) <= 6) / len(drifts), 1),
            })
    dev_ranking.sort(key=lambda x: x['median'] if x['median'] is not None else 999)

    # Trend by original COD year
    year_trend = []
    for yr in sorted(by_year.keys()):
        year_trend.append({
            'year': yr,
            **_stats_summary(by_year[yr]),
        })

    output = {
        'projects': sorted(projects, key=lambda x: -abs(x['drift_months'])),
        'by_technology': tech_stats,
        'by_state': state_stats,
        'by_capacity_band': band_stats,
        'developer_ranking': dev_ranking,
        'year_trend': year_trend,
        'total_projects': len(projects),
        'overall': _stats_summary([p['drift_months'] for p in projects]),
        'exported_at': datetime.now().isoformat(),
    }
    path = os.path.join(INTEL_DIR, 'drift-analysis.json')
    write_json(path, clean_none_values(output))
    print(f"  analytics/intelligence/drift-analysis.json ({len(projects)} projects)")


# ---- 3. Wind Resource ------------------------------------------------------

def export_wind_resource(conn):
    """Wind farm capacity factor benchmarks and resource rating."""
    # Operating wind farms with 2024 performance
    operating = conn.execute("""
        SELECT p.id, p.name, p.state, p.rez, p.capacity_mw,
               p.latitude, p.longitude,
               pa.capacity_factor_pct, pa.energy_price_received, pa.revenue_per_mw
        FROM projects p
        JOIN performance_annual pa ON pa.project_id = p.id
        WHERE p.technology = 'wind' AND p.status = 'operating'
              AND pa.year = 2024 AND pa.capacity_factor_pct IS NOT NULL
    """).fetchall()

    # State and REZ benchmarks
    by_state = defaultdict(list)
    by_rez = defaultdict(list)
    farms = []

    for r in operating:
        cf = r['capacity_factor_pct']
        entry = {
            'project_id': r['id'],
            'name': r['name'],
            'state': r['state'],
            'rez': r['rez'],
            'capacity_mw': r['capacity_mw'],
            'latitude': r['latitude'],
            'longitude': r['longitude'],
            'capacity_factor_pct': round(cf, 2) if cf else None,
            'energy_price': r['energy_price_received'],
            'revenue_per_mw': r['revenue_per_mw'],
            'resource_rating': _cf_rating(cf),
        }
        farms.append(entry)
        if r['state']:
            by_state[r['state']].append(cf)
        if r['rez']:
            by_rez[r['rez']].append(cf)

    state_benchmarks = {}
    for st, cfs in sorted(by_state.items()):
        state_benchmarks[st] = {
            **_stats_summary(cfs),
            'rating': _cf_rating(statistics.median(cfs) if cfs else None),
        }

    rez_benchmarks = {}
    for rz, cfs in sorted(by_rez.items()):
        rez_benchmarks[rz] = {
            **_stats_summary(cfs),
            'rating': _cf_rating(statistics.median(cfs) if cfs else None),
        }

    # Development wind projects — assign predicted CF from state average
    dev_wind = conn.execute("""
        SELECT id, name, state, rez, capacity_mw, latitude, longitude
        FROM projects
        WHERE technology = 'wind' AND status IN ('development', 'construction')
    """).fetchall()

    development_projects = []
    for r in dev_wind:
        state_avg = None
        if r['state'] and r['state'] in state_benchmarks:
            state_avg = state_benchmarks[r['state']]['mean']
        development_projects.append({
            'project_id': r['id'],
            'name': r['name'],
            'state': r['state'],
            'rez': r['rez'],
            'capacity_mw': r['capacity_mw'],
            'latitude': r['latitude'],
            'longitude': r['longitude'],
            'predicted_cf_pct': round(state_avg, 1) if state_avg else None,
            'predicted_rating': _cf_rating(state_avg),
            'basis': 'state_average',
        })

    output = {
        'operating_farms': sorted(farms, key=lambda x: -(x['capacity_factor_pct'] or 0)),
        'state_benchmarks': state_benchmarks,
        'rez_benchmarks': rez_benchmarks,
        'development_projects': development_projects,
        'total_operating': len(farms),
        'total_development': len(development_projects),
        'exported_at': datetime.now().isoformat(),
    }
    path = os.path.join(INTEL_DIR, 'wind-resource.json')
    write_json(path, clean_none_values(output))
    print(f"  analytics/intelligence/wind-resource.json ({len(farms)} operating, {len(development_projects)} development)")


# ---- 4. Dunkelflaute -------------------------------------------------------

def export_dunkelflaute(conn):
    """Renewable generation adequacy and BESS coverage analysis by state."""
    # Wind + solar performance by state and year
    perf_rows = conn.execute("""
        SELECT p.state, p.technology, pa.year,
               SUM(pa.energy_mwh) as total_energy,
               AVG(pa.capacity_factor_pct) as avg_cf,
               SUM(p.capacity_mw) as total_mw
        FROM performance_annual pa
        JOIN projects p ON p.id = pa.project_id
        WHERE p.technology IN ('wind', 'solar') AND p.state IS NOT NULL
              AND pa.capacity_factor_pct IS NOT NULL
        GROUP BY p.state, p.technology, pa.year
    """).fetchall()

    # Build state x year x tech matrix
    matrix = defaultdict(lambda: defaultdict(dict))
    for r in perf_rows:
        matrix[r['state']][r['year']][r['technology']] = {
            'avg_cf_pct': round(r['avg_cf'], 2) if r['avg_cf'] else None,
            'total_energy_mwh': round(r['total_energy'], 0) if r['total_energy'] else None,
            'total_mw': round(r['total_mw'], 1) if r['total_mw'] else None,
        }

    # Combined renewable CF by state/year
    state_year_combined = []
    for state in sorted(matrix.keys()):
        for year in sorted(matrix[state].keys()):
            wind = matrix[state][year].get('wind', {})
            solar = matrix[state][year].get('solar', {})
            wind_cf = wind.get('avg_cf_pct')
            solar_cf = solar.get('avg_cf_pct')
            wind_mw = wind.get('total_mw', 0) or 0
            solar_mw = solar.get('total_mw', 0) or 0
            total_mw = wind_mw + solar_mw

            # Weighted combined CF
            combined_cf = None
            if total_mw > 0:
                combined_cf = round(
                    ((wind_cf or 0) * wind_mw + (solar_cf or 0) * solar_mw) / total_mw, 2
                )

            state_year_combined.append({
                'state': state,
                'year': year,
                'wind_cf_pct': wind_cf,
                'solar_cf_pct': solar_cf,
                'combined_cf_pct': combined_cf,
                'wind_mw': round(wind_mw, 1),
                'solar_mw': round(solar_mw, 1),
            })

    # Identify lowest combined CF periods (potential dunkelflaute indicators)
    sorted_periods = sorted(
        [p for p in state_year_combined if p['combined_cf_pct'] is not None],
        key=lambda x: x['combined_cf_pct']
    )
    lowest_periods = sorted_periods[:10]

    # BESS coverage by state
    bess_rows = conn.execute("""
        SELECT state,
               SUM(capacity_mw) as total_mw,
               SUM(storage_mwh) as total_mwh,
               COUNT(*) as count
        FROM projects
        WHERE technology = 'bess' AND status = 'operating' AND state IS NOT NULL
        GROUP BY state
    """).fetchall()

    # Peak demand estimates by state (approximate NEM values in MW)
    peak_demand = {
        'NSW': 14000, 'VIC': 10000, 'QLD': 10000,
        'SA': 3500, 'TAS': 1800, 'WA': 4500,
    }

    bess_coverage = {}
    for r in bess_rows:
        state = r['state']
        total_mwh = r['total_mwh'] or 0
        total_mw = r['total_mw'] or 0
        peak = peak_demand.get(state, 5000)
        coverage_hours = round(total_mwh / peak, 2) if peak > 0 else 0
        bess_coverage[state] = {
            'bess_count': r['count'],
            'bess_mw': round(total_mw, 1),
            'bess_mwh': round(total_mwh, 1),
            'peak_demand_mw_est': peak,
            'coverage_hours': coverage_hours,
            'coverage_rating': 'Good' if coverage_hours >= 2 else ('Moderate' if coverage_hours >= 1 else 'Low'),
        }

    # Pipeline BESS
    pipeline_bess = conn.execute("""
        SELECT state,
               SUM(capacity_mw) as total_mw,
               SUM(storage_mwh) as total_mwh,
               COUNT(*) as count
        FROM projects
        WHERE technology = 'bess' AND status IN ('construction', 'development')
              AND state IS NOT NULL
        GROUP BY state
    """).fetchall()

    bess_pipeline = {}
    for r in pipeline_bess:
        bess_pipeline[r['state']] = {
            'count': r['count'],
            'mw': round(r['total_mw'] or 0, 1),
            'mwh': round(r['total_mwh'] or 0, 1),
        }

    # ── Seasonal (monthly) CF analysis ──
    seasonal_monthly = []
    try:
        monthly_rows = conn.execute("""
            SELECT p.state, p.technology, pm.year, pm.month,
                   AVG(pm.capacity_factor_pct) as avg_cf,
                   SUM(p.capacity_mw) as total_mw
            FROM performance_monthly pm
            JOIN projects p ON p.id = pm.project_id
            WHERE p.technology IN ('wind', 'solar') AND p.state IS NOT NULL
                  AND pm.capacity_factor_pct IS NOT NULL
                  AND pm.capacity_factor_pct > 0
                  AND p.state IN ('NSW', 'QLD', 'VIC', 'SA', 'TAS')
            GROUP BY p.state, p.technology, pm.year, pm.month
        """).fetchall()

        # Build state x year x month x tech matrix
        monthly_matrix = defaultdict(lambda: defaultdict(lambda: defaultdict(dict)))
        for r in monthly_rows:
            monthly_matrix[r['state']][(r['year'], r['month'])][r['technology']] = {
                'avg_cf_pct': round(r['avg_cf'], 1) if r['avg_cf'] else None,
                'total_mw': round(r['total_mw'], 1) if r['total_mw'] else None,
            }

        for state in sorted(monthly_matrix.keys()):
            for (year, month), techs in sorted(monthly_matrix[state].items()):
                wind = techs.get('wind', {})
                solar = techs.get('solar', {})
                wind_cf = wind.get('avg_cf_pct') or 0
                solar_cf = solar.get('avg_cf_pct') or 0
                wind_mw = wind.get('total_mw') or 0
                solar_mw = solar.get('total_mw') or 0
                total_mw = wind_mw + solar_mw
                combined_cf = None
                if total_mw > 0:
                    combined_cf = round(
                        (wind_cf * wind_mw + solar_cf * solar_mw) / total_mw, 1
                    )
                seasonal_monthly.append({
                    'state': state,
                    'year': year,
                    'month': month,
                    'wind_cf': round(wind_cf, 1),
                    'solar_cf': round(solar_cf, 1),
                    'combined_cf': combined_cf,
                    'wind_mw': round(wind_mw, 0),
                    'solar_mw': round(solar_mw, 0),
                })
    except Exception as e:
        print(f"    Warning: Could not export seasonal data: {e}")

    output = {
        'state_year_performance': state_year_combined,
        'lowest_cf_periods': lowest_periods,
        'bess_coverage': bess_coverage,
        'bess_pipeline': bess_pipeline,
        'peak_demand_estimates': peak_demand,
        'seasonal_monthly': seasonal_monthly,
        'exported_at': datetime.now().isoformat(),
    }
    path = os.path.join(INTEL_DIR, 'dunkelflaute.json')
    write_json(path, clean_none_values(output))
    print(f"  analytics/intelligence/dunkelflaute.json ({len(state_year_combined)} state-year, {len(seasonal_monthly)} monthly records)")


# ---- 5. Energy Mix ----------------------------------------------------------

def export_energy_mix(conn):
    """Current and projected energy capacity mix by state and technology."""
    # Operating capacity
    operating = conn.execute("""
        SELECT state, technology,
               COUNT(*) as count,
               SUM(capacity_mw) as total_mw,
               SUM(storage_mwh) as total_mwh
        FROM projects
        WHERE status = 'operating' AND state IS NOT NULL
        GROUP BY state, technology
    """).fetchall()

    current_mix = defaultdict(dict)
    for r in operating:
        current_mix[r['state']][r['technology']] = {
            'count': r['count'],
            'mw': round(r['total_mw'] or 0, 1),
            'mwh': round(r['total_mwh'] or 0, 1) if r['total_mwh'] else None,
        }

    # Pipeline by state x technology x cod year
    pipeline = conn.execute("""
        SELECT state, technology, status,
               SUBSTR(cod_current, 1, 4) as cod_year,
               COUNT(*) as count,
               SUM(capacity_mw) as total_mw
        FROM projects
        WHERE status IN ('construction', 'development', 'commissioning')
              AND state IS NOT NULL
        GROUP BY state, technology, status, cod_year
    """).fetchall()

    pipeline_data = []
    for r in pipeline:
        pipeline_data.append({
            'state': r['state'],
            'technology': r['technology'],
            'status': r['status'],
            'cod_year': r['cod_year'],
            'count': r['count'],
            'mw': round(r['total_mw'] or 0, 1),
        })

    # Forward projection: cumulative capacity by technology by year
    all_projects = conn.execute("""
        SELECT technology, status, capacity_mw,
               SUBSTR(cod_current, 1, 4) as cod_year
        FROM projects
        WHERE capacity_mw IS NOT NULL
    """).fetchall()

    # Sum operating capacity by tech
    operating_by_tech = defaultdict(float)
    future_by_tech_year = defaultdict(lambda: defaultdict(float))

    for r in all_projects:
        tech = r['technology']
        mw = r['capacity_mw'] or 0
        if r['status'] == 'operating':
            operating_by_tech[tech] += mw
        elif r['cod_year'] and r['status'] in ('construction', 'commissioning', 'development'):
            try:
                yr = int(r['cod_year'])
                future_by_tech_year[tech][yr] += mw
            except (ValueError, TypeError):
                pass

    # Build projection
    projection = {}
    current_year = datetime.now().year
    for tech in sorted(set(list(operating_by_tech.keys()) + list(future_by_tech_year.keys()))):
        cumulative = round(operating_by_tech.get(tech, 0), 1)
        yearly = [{'year': 'current', 'cumulative_mw': cumulative}]
        for yr in range(current_year, current_year + 8):
            added = future_by_tech_year.get(tech, {}).get(yr, 0)
            cumulative = round(cumulative + added, 1)
            yearly.append({'year': yr, 'added_mw': round(added, 1), 'cumulative_mw': cumulative})
        projection[tech] = yearly

    # State totals
    state_totals = {}
    for state in sorted(current_mix.keys()):
        total_mw = sum(v.get('mw', 0) for v in current_mix[state].values())
        state_totals[state] = {
            'operating_mw': round(total_mw, 1),
            'technologies': dict(current_mix[state]),
        }

    output = {
        'current_mix': dict(current_mix),
        'state_totals': state_totals,
        'pipeline': pipeline_data,
        'projection': projection,
        'exported_at': datetime.now().isoformat(),
    }
    path = os.path.join(INTEL_DIR, 'energy-mix.json')
    write_json(path, clean_none_values(output))
    print(f"  analytics/intelligence/energy-mix.json ({len(current_mix)} states)")


# ---- 6. Developer Scores ---------------------------------------------------

def export_developer_scores(conn):
    """Developer execution scoring based on delivery track record."""
    rows = conn.execute("""
        SELECT id, current_developer, technology, status, capacity_mw,
               cod_current, cod_original
        FROM projects
        WHERE current_developer IS NOT NULL
    """).fetchall()

    dev_data = defaultdict(lambda: {
        'projects': [], 'drifts': [], 'statuses': [],
        'total_mw': 0, 'technologies': set(),
    })

    for r in rows:
        dev = r['current_developer']
        drift = _months_between(r['cod_original'], r['cod_current']) if r['cod_original'] and r['cod_current'] else None

        dev_data[dev]['projects'].append(r['id'])
        if drift is not None:
            dev_data[dev]['drifts'].append(drift)
        dev_data[dev]['statuses'].append(r['status'])
        dev_data[dev]['total_mw'] += r['capacity_mw'] or 0
        dev_data[dev]['technologies'].add(r['technology'])

    # Only include developers with 2+ projects
    developers = []
    all_drifts = []
    all_on_time = []

    for dev, data in sorted(dev_data.items()):
        count = len(data['projects'])
        if count < 2:
            continue

        drifts = data['drifts']
        statuses = data['statuses']
        operating = sum(1 for s in statuses if s == 'operating')
        withdrawn = sum(1 for s in statuses if s == 'withdrawn')
        completion_rate = round(100 * operating / count, 1) if count else 0

        avg_drift = round(sum(drifts) / len(drifts), 1) if drifts else None
        on_time_pct = round(100 * sum(1 for d in drifts if d <= 0) / len(drifts), 1) if drifts else None

        if avg_drift is not None:
            all_drifts.append(avg_drift)
        if on_time_pct is not None:
            all_on_time.append(on_time_pct)

        # Composite execution score (0-100)
        # Factors: avg_drift (weight 0.4), on_time_pct (0.3), completion_rate (0.3)
        score = 50  # base
        if avg_drift is not None:
            # 0 drift = +40, 6 months = +20, 12 months = 0, 24+ = -20
            drift_component = max(0, min(40, 40 - (avg_drift * 40 / 24)))
            score = drift_component
        else:
            drift_component = 20  # neutral if no data
            score = drift_component

        if on_time_pct is not None:
            score += on_time_pct * 0.3
        else:
            score += 15  # neutral

        score += completion_rate * 0.3
        score = round(max(0, min(100, score)), 1)

        developers.append({
            'developer': dev,
            'project_count': count,
            'total_mw': round(data['total_mw'], 1),
            'technologies': sorted(data['technologies']),
            'operating': operating,
            'withdrawn': withdrawn,
            'completion_rate': completion_rate,
            'avg_drift_months': avg_drift,
            'on_time_pct': on_time_pct,
            'execution_score': score,
            'grade': _grade(score),
            'drift_stats': _stats_summary(drifts) if drifts else None,
        })

    developers.sort(key=lambda x: -x['execution_score'])

    # Industry averages
    industry_avg = {
        'avg_drift_months': round(sum(all_drifts) / len(all_drifts), 1) if all_drifts else None,
        'avg_on_time_pct': round(sum(all_on_time) / len(all_on_time), 1) if all_on_time else None,
        'developer_count': len(developers),
    }

    # Grade distribution
    grade_dist = defaultdict(int)
    for d in developers:
        grade_dist[d['grade']] += 1

    output = {
        'developers': developers,
        'industry_averages': industry_avg,
        'grade_distribution': dict(grade_dist),
        'total_developers': len(developers),
        'exported_at': datetime.now().isoformat(),
    }
    path = os.path.join(INTEL_DIR, 'developer-scores.json')
    write_json(path, clean_none_values(output))
    print(f"  analytics/intelligence/developer-scores.json ({len(developers)} developers)")


# ---- 7. Revenue Intel -------------------------------------------------------

def export_revenue_intel(conn):
    """Revenue analysis by technology, year, with offtake comparison."""
    # Revenue metrics by technology and year
    perf_rows = conn.execute("""
        SELECT p.id, p.technology, p.name, pa.year,
               pa.capacity_factor_pct, pa.revenue_per_mw,
               pa.energy_price_received, pa.revenue_aud,
               pa.avg_charge_price, pa.avg_discharge_price,
               pa.utilisation_pct, pa.cycles
        FROM performance_annual pa
        JOIN projects p ON p.id = pa.project_id
        WHERE pa.year IS NOT NULL
    """).fetchall()

    # Build tech x year groupings
    by_tech_year = defaultdict(lambda: {
        'revenue_per_mw': [], 'energy_price': [], 'cf': [],
        'discharge_price': [], 'charge_price': [], 'spreads': [],
    })

    for r in perf_rows:
        key = (r['technology'], r['year'])
        if r['revenue_per_mw'] is not None:
            by_tech_year[key]['revenue_per_mw'].append(r['revenue_per_mw'])
        if r['energy_price_received'] is not None:
            by_tech_year[key]['energy_price'].append(r['energy_price_received'])
        if r['capacity_factor_pct'] is not None:
            by_tech_year[key]['cf'].append(r['capacity_factor_pct'])
        if r['avg_discharge_price'] is not None:
            by_tech_year[key]['discharge_price'].append(r['avg_discharge_price'])
        if r['avg_charge_price'] is not None:
            by_tech_year[key]['charge_price'].append(r['avg_charge_price'])
        if r['avg_discharge_price'] is not None and r['avg_charge_price'] is not None:
            by_tech_year[key]['spreads'].append(r['avg_discharge_price'] - r['avg_charge_price'])

    tech_year_stats = []
    for (tech, year), data in sorted(by_tech_year.items()):
        entry = {
            'technology': tech,
            'year': year,
            'revenue_per_mw': _stats_summary(data['revenue_per_mw']),
            'energy_price': _stats_summary(data['energy_price']),
            'capacity_factor': _stats_summary(data['cf']),
        }
        if data['spreads']:
            entry['bess_spread'] = _stats_summary(data['spreads'])
        if data['discharge_price']:
            entry['discharge_price'] = _stats_summary(data['discharge_price'])
        if data['charge_price']:
            entry['charge_price'] = _stats_summary(data['charge_price'])
        tech_year_stats.append(entry)

    # YoY trends by technology
    yoy_trends = defaultdict(list)
    tech_years = defaultdict(dict)
    for entry in tech_year_stats:
        tech = entry['technology']
        yr = entry['year']
        tech_years[tech][yr] = entry['revenue_per_mw'].get('median')

    for tech, years in sorted(tech_years.items()):
        sorted_years = sorted(years.keys())
        for i, yr in enumerate(sorted_years):
            trend_entry = {'year': yr, 'median_rpm': years[yr]}
            if i > 0 and years.get(sorted_years[i - 1]) and years[yr]:
                prev = years[sorted_years[i - 1]]
                trend_entry['yoy_change_pct'] = round(100 * (years[yr] - prev) / abs(prev), 1) if prev else None
            yoy_trends[tech].append(trend_entry)

    # Projects with vs without offtakes
    offtake_projects = set()
    for row in conn.execute("SELECT DISTINCT project_id FROM offtakes").fetchall():
        offtake_projects.add(row['project_id'])

    with_offtake = {'revenue_per_mw': [], 'energy_price': []}
    without_offtake = {'revenue_per_mw': [], 'energy_price': []}

    for r in perf_rows:
        if r['year'] != 2024:
            continue
        target = with_offtake if r['id'] in offtake_projects else without_offtake
        if r['revenue_per_mw'] is not None:
            target['revenue_per_mw'].append(r['revenue_per_mw'])
        if r['energy_price_received'] is not None:
            target['energy_price'].append(r['energy_price_received'])

    offtake_comparison = {
        'year': 2024,
        'with_offtake': {
            'count': len(with_offtake['revenue_per_mw']),
            'revenue_per_mw': _stats_summary(with_offtake['revenue_per_mw']),
            'energy_price': _stats_summary(with_offtake['energy_price']),
        },
        'without_offtake': {
            'count': len(without_offtake['revenue_per_mw']),
            'revenue_per_mw': _stats_summary(without_offtake['revenue_per_mw']),
            'energy_price': _stats_summary(without_offtake['energy_price']),
        },
    }

    # Technology comparison (latest year with data)
    tech_comparison = {}
    for entry in tech_year_stats:
        if entry['year'] == 2024:
            tech_comparison[entry['technology']] = {
                'revenue_per_mw': entry['revenue_per_mw'],
                'energy_price': entry['energy_price'],
                'capacity_factor': entry['capacity_factor'],
            }
            if 'bess_spread' in entry:
                tech_comparison[entry['technology']]['bess_spread'] = entry['bess_spread']

    # ---- Top 10 by state per technology ----
    # Group by (tech, state, project) for latest year with data
    project_latest = {}  # (project_id) -> {tech, state, name, capacity_mw, latest_year, latest_rpm, prev_rpm}
    for r in perf_rows:
        pid = r['id']
        yr = r['year']
        rpm = r['revenue_per_mw']
        if rpm is None:
            continue
        if pid not in project_latest or yr > project_latest[pid]['latest_year']:
            prev = project_latest[pid] if pid in project_latest else None
            project_latest[pid] = {
                'project_id': pid, 'name': r['name'], 'technology': r['technology'],
                'state': conn.execute("SELECT state FROM projects WHERE id = ?", (pid,)).fetchone()['state'],
                'capacity_mw': conn.execute("SELECT capacity_mw FROM projects WHERE id = ?", (pid,)).fetchone()['capacity_mw'] or 0,
                'latest_year': yr, 'latest_rpm': rpm,
                'prev_rpm': prev['latest_rpm'] if prev else None,
                'prev_year': prev['latest_year'] if prev else None,
                'cf': r['capacity_factor_pct'],
            }
        elif pid in project_latest and yr > (project_latest[pid].get('prev_year') or 0) and yr < project_latest[pid]['latest_year']:
            project_latest[pid]['prev_rpm'] = rpm
            project_latest[pid]['prev_year'] = yr

    # Build top 10 by state
    top_10_by_state = defaultdict(lambda: defaultdict(list))
    for p in project_latest.values():
        tech = p['technology']
        state = p['state'] or 'Unknown'
        yoy_change = None
        if p.get('prev_rpm') and p['prev_rpm'] > 0:
            yoy_change = round(100 * (p['latest_rpm'] - p['prev_rpm']) / abs(p['prev_rpm']), 1)
        entry = {
            'project_id': p['project_id'], 'name': p['name'],
            'revenue_per_mw': round(p['latest_rpm'], 0),
            'capacity_factor_pct': round(p['cf'], 1) if p['cf'] else None,
            'capacity_mw': p['capacity_mw'],
            'yoy_change_pct': yoy_change,
            'latest_year': p['latest_year'],
        }
        top_10_by_state[tech][state].append(entry)

    # Sort each state list by revenue_per_mw descending, take top 10
    for tech in top_10_by_state:
        for state in top_10_by_state[tech]:
            top_10_by_state[tech][state] = sorted(
                top_10_by_state[tech][state], key=lambda x: x['revenue_per_mw'], reverse=True
            )[:10]

    # ---- Projects in trouble (biggest YoY revenue declines) ----
    projects_in_trouble = []
    for p in project_latest.values():
        if p.get('prev_rpm') and p['prev_rpm'] > 0:
            yoy = round(100 * (p['latest_rpm'] - p['prev_rpm']) / abs(p['prev_rpm']), 1)
            projects_in_trouble.append({
                'project_id': p['project_id'], 'name': p['name'],
                'technology': p['technology'], 'state': p['state'] or 'Unknown',
                'capacity_mw': p['capacity_mw'],
                'latest_revenue_per_mw': round(p['latest_rpm'], 0),
                'prev_revenue_per_mw': round(p['prev_rpm'], 0),
                'yoy_change_pct': yoy,
                'latest_year': p['latest_year'],
            })
    projects_in_trouble.sort(key=lambda x: x['yoy_change_pct'])
    # Keep top 20 worst decliners per tech
    trouble_by_tech = defaultdict(list)
    for p in projects_in_trouble:
        if len(trouble_by_tech[p['technology']]) < 20:
            trouble_by_tech[p['technology']].append(p)
    projects_in_trouble_flat = []
    for tech_list in trouble_by_tech.values():
        projects_in_trouble_flat.extend(tech_list)
    projects_in_trouble_flat.sort(key=lambda x: x['yoy_change_pct'])

    # ---- Revenue magnitude trends (fleet-wide annual totals by tech) ----
    rev_by_tech_year = defaultdict(lambda: defaultdict(lambda: {'total_aud': 0, 'count': 0}))
    for r in perf_rows:
        if r['revenue_per_mw'] is not None:
            tech = r['technology']
            yr = r['year']
            # Use revenue_aud if available, else estimate from revenue_per_mw * capacity_mw
            cap_mw = conn.execute("SELECT capacity_mw FROM projects WHERE id = ?", (r['id'],)).fetchone()['capacity_mw'] or 0
            rev_aud = r['revenue_per_mw'] * cap_mw if r['revenue_per_mw'] else 0
            rev_by_tech_year[tech][yr]['total_aud'] += rev_aud
            rev_by_tech_year[tech][yr]['count'] += 1

    revenue_magnitude = {}
    for tech, years in sorted(rev_by_tech_year.items()):
        entries = []
        for yr in sorted(years.keys()):
            d = years[yr]
            entries.append({
                'year': yr,
                'total_revenue_m_aud': round(d['total_aud'] / 1_000_000, 1),
                'project_count': d['count'],
                'mean_per_project_aud': round(d['total_aud'] / d['count'], 0) if d['count'] > 0 else 0,
            })
        revenue_magnitude[tech] = entries

    output = {
        'by_technology_year': tech_year_stats,
        'yoy_trends': dict(yoy_trends),
        'technology_comparison_2024': tech_comparison,
        'offtake_comparison': offtake_comparison,
        'top_10_by_state': {k: dict(v) for k, v in top_10_by_state.items()},
        'projects_in_trouble': projects_in_trouble_flat,
        'revenue_magnitude_trends': revenue_magnitude,
        'exported_at': datetime.now().isoformat(),
    }
    path = os.path.join(INTEL_DIR, 'revenue-intel.json')
    write_json(path, clean_none_values(output))
    print(f"  analytics/intelligence/revenue-intel.json ({len(tech_year_stats)} tech-year records, {len(projects_in_trouble_flat)} trouble projects)")


# ---- 8. Grid Connection -----------------------------------------------------

def export_grid_connection(conn):
    """REZ-level grid connection analysis and congestion scoring."""
    # REZ breakdown
    rez_rows = conn.execute("""
        SELECT rez, technology, status,
               COUNT(*) as count,
               SUM(capacity_mw) as total_mw,
               SUM(storage_mwh) as total_mwh
        FROM projects
        WHERE rez IS NOT NULL
        GROUP BY rez, technology, status
    """).fetchall()

    rez_data = defaultdict(lambda: {
        'technologies': defaultdict(lambda: defaultdict(lambda: {'count': 0, 'mw': 0})),
        'total_mw': 0, 'total_count': 0,
        'operating_mw': 0, 'pipeline_mw': 0,
    })

    for r in rez_rows:
        rz = r['rez']
        mw = r['total_mw'] or 0
        rez_data[rz]['technologies'][r['technology']][r['status']]['count'] = r['count']
        rez_data[rz]['technologies'][r['technology']][r['status']]['mw'] = round(mw, 1)
        rez_data[rz]['total_mw'] += mw
        rez_data[rz]['total_count'] += r['count']
        if r['status'] == 'operating':
            rez_data[rz]['operating_mw'] += mw
        else:
            rez_data[rz]['pipeline_mw'] += mw

    # Connection status breakdown
    conn_status_rows = conn.execute("""
        SELECT rez, connection_status, COUNT(*) as count, SUM(capacity_mw) as total_mw
        FROM projects
        WHERE rez IS NOT NULL AND connection_status IS NOT NULL
        GROUP BY rez, connection_status
    """).fetchall()

    conn_status_by_rez = defaultdict(dict)
    for r in conn_status_rows:
        conn_status_by_rez[r['rez']][r['connection_status']] = {
            'count': r['count'],
            'mw': round(r['total_mw'] or 0, 1),
        }

    # Build REZ summaries with congestion score
    rez_summaries = []
    for rz in sorted(rez_data.keys()):
        data = rez_data[rz]
        total_mw = round(data['total_mw'], 1)
        pipeline_mw = round(data['pipeline_mw'], 1)
        operating_mw = round(data['operating_mw'], 1)

        # Congestion score: higher = more congested
        # Based on pipeline-to-operating ratio and total project count
        if operating_mw > 0:
            ratio = pipeline_mw / operating_mw
        else:
            ratio = pipeline_mw / 100 if pipeline_mw > 0 else 0

        congestion_score = min(100, round(
            min(50, ratio * 15) +  # pipeline ratio contribution
            min(30, data['total_count'] * 2) +  # project count contribution
            min(20, pipeline_mw / 200)  # absolute pipeline size
        , 1))

        if congestion_score >= 70:
            congestion_level = 'high'
        elif congestion_score >= 40:
            congestion_level = 'moderate'
        else:
            congestion_level = 'low'

        # Flatten technologies for JSON
        tech_breakdown = {}
        for tech, statuses in data['technologies'].items():
            tech_breakdown[tech] = {s: dict(v) for s, v in statuses.items()}

        rez_summaries.append({
            'rez': rz,
            'total_mw': total_mw,
            'operating_mw': operating_mw,
            'pipeline_mw': pipeline_mw,
            'project_count': data['total_count'],
            'congestion_score': congestion_score,
            'congestion_level': congestion_level,
            'technologies': tech_breakdown,
            'connection_status': dict(conn_status_by_rez.get(rz, {})),
        })

    rez_summaries.sort(key=lambda x: -x['congestion_score'])

    # State summary
    state_rez = defaultdict(lambda: {'rez_count': 0, 'total_mw': 0, 'pipeline_mw': 0, 'rezs': []})
    for rz_entry in rez_summaries:
        # Extract state from REZ ID (e.g. 'nsw-central-west-orana' -> 'NSW')
        rz_id = rz_entry['rez']
        state = None
        for st in ['nsw', 'vic', 'qld', 'sa', 'tas', 'wa']:
            if rz_id.lower().startswith(st):
                state = st.upper()
                break
        if state:
            state_rez[state]['rez_count'] += 1
            state_rez[state]['total_mw'] += rz_entry['total_mw']
            state_rez[state]['pipeline_mw'] += rz_entry['pipeline_mw']
            state_rez[state]['rezs'].append(rz_entry['rez'])

    for st in state_rez:
        state_rez[st]['total_mw'] = round(state_rez[st]['total_mw'], 1)
        state_rez[st]['pipeline_mw'] = round(state_rez[st]['pipeline_mw'], 1)

    # Overall connection status
    overall_conn = conn.execute("""
        SELECT connection_status, COUNT(*) as count, SUM(capacity_mw) as total_mw
        FROM projects
        WHERE connection_status IS NOT NULL
        GROUP BY connection_status
    """).fetchall()

    connection_summary = {}
    for r in overall_conn:
        connection_summary[r['connection_status']] = {
            'count': r['count'],
            'mw': round(r['total_mw'] or 0, 1),
        }

    output = {
        'rez_summaries': rez_summaries,
        'state_summary': dict(state_rez),
        'connection_status_overall': connection_summary,
        'total_rez_zones': len(rez_summaries),
        'exported_at': datetime.now().isoformat(),
    }
    path = os.path.join(INTEL_DIR, 'grid-connection.json')
    write_json(path, clean_none_values(output))
    print(f"  analytics/intelligence/grid-connection.json ({len(rez_summaries)} REZ zones)")


def export_rez_access(conn):
    """Export REZ access rights data from timeline events."""
    rows = conn.execute("""
        SELECT project_id, title, date
        FROM timeline_events
        WHERE event_type = 'rez_access'
        ORDER BY date
    """).fetchall()

    access_map = {}
    for r in rows:
        access_map[r['project_id']] = {
            'title': r['title'],
            'date': r['date'],
        }

    path = os.path.join(DATA_DIR, 'analytics', 'rez-access.json')
    write_json(path, access_map)
    print(f"  analytics/rez-access.json ({len(access_map)} projects with REZ access)")


# ---- 9b. NEM Activities Timeline -------------------------------------------

def export_nem_activities(conn):
    """Export month-by-month NEM activities timeline from project timeline events."""

    # Categorise event_types into 5 sections
    DEVELOPMENT_TYPES = {'conceived', 'planning_submitted', 'planning_approved', 'planning_rejected', 'planning_modified', 'fid'}
    GOVT_TYPES = {'offtake_signed'}
    GOVT_KEYWORDS = {'cis', 'ltesa', 'firm', 'arena', 'capacity investment scheme', 'long term energy', 'sips', 'esem'}
    REZ_TYPES = {'rez_access', 'connection_milestone'}
    CONSTRUCTION_TYPES = {'construction_start', 'equipment_order', 'energisation', 'commissioning', 'cod', 'expansion'}
    OPERATIONAL_TYPES = {'cod_change', 'capacity_change', 'stakeholder_issue'}

    rows = conn.execute("""
        SELECT p.id, p.name, p.technology, p.status, p.state, p.capacity_mw,
               p.rez,
               te.date, te.date_precision, te.event_type, te.title, te.detail
        FROM timeline_events te
        JOIN projects p ON p.id = te.project_id
        WHERE te.date IS NOT NULL
        ORDER BY te.date DESC
    """).fetchall()

    months = defaultdict(lambda: {
        'development': [], 'govt_programs': [], 'rez_progress': [],
        'construction': [], 'operational': [],
    })
    section_counts = defaultdict(int)

    def make_event(project_id, name, tech, state, capacity_mw, event_type, title, detail, date):
        return {
            'project_id': project_id,
            'project_name': name,
            'technology': tech or '',
            'state': state or '',
            'capacity_mw': capacity_mw or 0,
            'event_type': event_type,
            'title': title,
            'detail': detail or '',
            'date': date,
        }

    for r in rows:
        evt_type = r['event_type']
        title_lower = (r['title'] or '').lower()
        detail_lower = (r['detail'] or '').lower()
        combined_text = title_lower + ' ' + detail_lower

        # Extract month key
        date_str = r['date']
        if len(date_str) >= 7:
            month_key = date_str[:7]  # YYYY-MM
        elif len(date_str) == 4:
            month_key = date_str + '-01'  # year only → Jan
        else:
            continue

        evt = make_event(r['id'], r['name'], r['technology'], r['state'],
                         r['capacity_mw'], evt_type, r['title'], r['detail'], date_str)

        section = None
        if evt_type in DEVELOPMENT_TYPES:
            section = 'development'
        elif evt_type in CONSTRUCTION_TYPES:
            section = 'construction'
        elif evt_type in OPERATIONAL_TYPES:
            section = 'operational'
        elif evt_type in GOVT_TYPES:
            section = 'govt_programs'
        elif evt_type in REZ_TYPES:
            section = 'rez_progress'
        elif evt_type == 'notable':
            # Classify notable events by context
            if any(kw in combined_text for kw in GOVT_KEYWORDS):
                section = 'govt_programs'
            elif r['rez'] and any(kw in combined_text for kw in ('rez', 'access', 'transmission')):
                section = 'rez_progress'
            elif r['status'] in ('operating', 'commissioning'):
                section = 'operational'
            elif r['status'] == 'construction':
                section = 'construction'
            else:
                section = 'development'
        elif evt_type == 'ownership_change':
            section = 'development'

        if section:
            months[month_key][section].append(evt)
            section_counts[section] += 1

    # Sort months descending, events within each section by date descending then capacity
    sorted_months = []
    for month_key in sorted(months.keys(), reverse=True):
        sections = months[month_key]
        for sec in sections.values():
            sec.sort(key=lambda e: (-e['capacity_mw'], e['date']), reverse=False)
            sec.sort(key=lambda e: e['date'], reverse=True)
        sorted_months.append({'month': month_key, 'sections': sections})

    output = {
        'generated_at': datetime.now().isoformat(),
        'months': sorted_months,
        'section_counts': dict(section_counts),
    }

    path = os.path.join(INTEL_DIR, 'nem-activities.json')
    write_json(path, clean_none_values(output))
    total_events = sum(section_counts.values())
    print(f"  analytics/intelligence/nem-activities.json ({len(sorted_months)} months, {total_events} events)")


# ---- Intelligence Wrapper ---------------------------------------------------

def export_eis_analytics(conn):
    """Export EIS/EIA technical specification analytics across all projects."""
    rows = conn.execute("""
        SELECT e.*, p.name, p.technology, p.status, p.capacity_mw, p.storage_mwh,
               p.state, p.current_developer
        FROM eis_technical_specs e
        JOIN projects p ON e.project_id = p.id
        ORDER BY p.technology, p.capacity_mw DESC
    """).fetchall()

    wind_projects = []
    bess_projects = []
    solar_projects = []

    # Accumulators for stats
    wind_speeds, hub_heights, rotor_diameters, capacity_factors, wind_conn_dists = [], [], [], [], []
    bess_efficiencies, bess_eff_ac, bess_durations, bess_conn_dists = [], [], [], []
    solar_capacity_factors, solar_conn_dists = [], []
    chemistry_counts = {}
    pcs_counts = {}
    cell_suppliers = {}
    inverter_suppliers = {}

    for r in rows:
        d = dict(r)
        tech = d['technology']

        base = {
            'id': d['project_id'], 'name': d['name'], 'state': d['state'],
            'capacity_mw': d['capacity_mw'], 'status': d['status'],
            'developer': d.get('current_developer'),
            'connection_voltage_kv': d.get('connection_voltage_kv'),
            'connection_distance_km': d.get('connection_distance_km'),
            'connection_substation_name': d.get('connection_substation_name'),
            'nsp': d.get('network_service_provider'),
            'connection_augmentation': d.get('connection_augmentation'),
            'document_title': d.get('document_title'),
            'document_url': d.get('document_url'),
            'document_year': d.get('document_year'),
        }

        if tech == 'wind':
            proj = {**base,
                'storage_mwh': d.get('storage_mwh'),
                'turbine_model': d.get('turbine_model'),
                'turbine_count': d.get('turbine_count'),
                'turbine_rated_power_mw': d.get('turbine_rated_power_mw'),
                'hub_height_m': d.get('hub_height_m'),
                'rotor_diameter_m': d.get('rotor_diameter_m'),
                'wind_speed_mean_ms': d.get('wind_speed_mean_ms'),
                'assumed_capacity_factor_pct': d.get('assumed_capacity_factor_pct'),
                'assumed_annual_energy_gwh': d.get('assumed_annual_energy_gwh'),
                'noise_limit_dba': d.get('noise_limit_dba'),
                'minimum_setback_m': d.get('minimum_setback_m'),
            }
            wind_projects.append(clean_none_values(proj))
            if d.get('wind_speed_mean_ms'): wind_speeds.append(d['wind_speed_mean_ms'])
            if d.get('hub_height_m'): hub_heights.append(d['hub_height_m'])
            if d.get('rotor_diameter_m'): rotor_diameters.append(d['rotor_diameter_m'])
            if d.get('assumed_capacity_factor_pct'): capacity_factors.append(d['assumed_capacity_factor_pct'])
            if d.get('connection_distance_km'): wind_conn_dists.append(d['connection_distance_km'])

        elif tech == 'bess':
            proj = {**base,
                'storage_mwh': d.get('storage_mwh'),
                'cell_chemistry': d.get('cell_chemistry'),
                'cell_supplier': d.get('cell_supplier'),
                'inverter_supplier': d.get('inverter_supplier'),
                'inverter_model': d.get('inverter_model'),
                'pcs_type': d.get('pcs_type'),
                'round_trip_efficiency_pct': d.get('round_trip_efficiency_pct'),
                'round_trip_efficiency_ac': d.get('round_trip_efficiency_ac'),
                'duration_hours': d.get('duration_hours'),
                'transformer_mva': d.get('transformer_mva'),
            }
            bess_projects.append(clean_none_values(proj))
            if d.get('round_trip_efficiency_pct'): bess_efficiencies.append(d['round_trip_efficiency_pct'])
            if d.get('round_trip_efficiency_ac'): bess_eff_ac.append(d['round_trip_efficiency_ac'])
            if d.get('duration_hours'): bess_durations.append(d['duration_hours'])
            if d.get('connection_distance_km'): bess_conn_dists.append(d['connection_distance_km'])
            chem = d.get('cell_chemistry')
            if chem: chemistry_counts[chem] = chemistry_counts.get(chem, 0) + 1
            pcs = d.get('pcs_type')
            if pcs: pcs_counts[pcs] = pcs_counts.get(pcs, 0) + 1
            cs = d.get('cell_supplier')
            if cs:
                key = cs.split('(')[0].strip()  # Normalize "CATL (Contemporary...)" to "CATL"
                cell_suppliers[key] = cell_suppliers.get(key, 0) + 1
            inv = d.get('inverter_supplier')
            if inv:
                key = inv.split('(')[0].strip()
                inverter_suppliers[key] = inverter_suppliers.get(key, 0) + 1

        elif tech == 'solar':
            proj = {**base,
                'assumed_capacity_factor_pct': d.get('assumed_capacity_factor_pct'),
                'assumed_annual_energy_gwh': d.get('assumed_annual_energy_gwh'),
            }
            solar_projects.append(clean_none_values(proj))
            if d.get('assumed_capacity_factor_pct'): solar_capacity_factors.append(d['assumed_capacity_factor_pct'])
            if d.get('connection_distance_km'): solar_conn_dists.append(d['connection_distance_km'])

    def avg(lst):
        return round(sum(lst) / len(lst), 1) if lst else None

    all_conn_dists = wind_conn_dists + bess_conn_dists + solar_conn_dists
    # Connection voltage breakdown
    voltage_counts = {}
    for r in rows:
        v = dict(r).get('connection_voltage_kv')
        if v:
            key = f"{int(v)} kV"
            voltage_counts[key] = voltage_counts.get(key, 0) + 1

    result = {
        'wind_projects': wind_projects,
        'bess_projects': bess_projects,
        'solar_projects': solar_projects,
        'summary': {
            'total_eis': len(rows),
            'wind': len(wind_projects),
            'bess': len(bess_projects),
            'solar': len(solar_projects),
            'pumped_hydro': sum(1 for r in rows if dict(r)['technology'] == 'pumped_hydro'),
            'wind_stats': {
                'avg_wind_speed': avg(wind_speeds),
                'avg_hub_height': avg(hub_heights),
                'avg_rotor_diameter': avg(rotor_diameters),
                'avg_capacity_factor': avg(capacity_factors),
                'avg_connection_distance': avg(wind_conn_dists),
            },
            'bess_stats': {
                'chemistry_breakdown': chemistry_counts,
                'pcs_type_breakdown': pcs_counts,
                'avg_efficiency_dc': avg(bess_efficiencies),
                'avg_efficiency_ac': avg(bess_eff_ac),
                'avg_duration': avg(bess_durations),
                'avg_connection_distance': avg(bess_conn_dists),
                'top_cell_suppliers': dict(sorted(cell_suppliers.items(), key=lambda x: -x[1])),
                'top_inverter_suppliers': dict(sorted(inverter_suppliers.items(), key=lambda x: -x[1])),
            },
            'connection': {
                'avg_distance': avg(all_conn_dists),
                'voltage_breakdown': dict(sorted(voltage_counts.items())),
            },
        },
        'exported_at': datetime.now().isoformat(),
    }

    write_json(os.path.join(DATA_DIR, 'analytics', 'eis-analytics.json'), result)
    print(f"  analytics/eis-analytics.json ({len(wind_projects)} wind, {len(bess_projects)} BESS, {len(solar_projects)} solar)")


def export_eis_comparison(conn):
    """Export EIS predicted vs actual operational performance comparison."""
    rows = conn.execute("""
        SELECT e.project_id, p.name, p.technology, p.state, p.capacity_mw,
               e.assumed_capacity_factor_pct, e.assumed_annual_energy_gwh,
               pa.year, pa.capacity_factor_pct, pa.energy_mwh
        FROM eis_technical_specs e
        JOIN projects p ON e.project_id = p.id
        JOIN performance_annual pa ON pa.project_id = e.project_id
        WHERE p.status = 'operating'
          AND pa.data_source = 'openelectricity'
          AND pa.capacity_factor_pct IS NOT NULL
          AND e.assumed_capacity_factor_pct IS NOT NULL
        ORDER BY p.name, pa.year
    """).fetchall()

    # Group by project
    projects = {}
    for r in rows:
        d = dict(r)
        pid = d['project_id']
        if pid not in projects:
            projects[pid] = {
                'id': pid,
                'name': d['name'],
                'technology': d['technology'],
                'state': d['state'],
                'capacity_mw': d['capacity_mw'],
                'eis_cf_pct': round(d['assumed_capacity_factor_pct'], 1),
                'eis_energy_gwh': d['assumed_annual_energy_gwh'],
                'annual_actuals': [],
            }
        projects[pid]['annual_actuals'].append({
            'year': d['year'],
            'cf_pct': round(d['capacity_factor_pct'], 1),
            'energy_mwh': round(d['energy_mwh']) if d['energy_mwh'] else None,
        })

    # Compute averages and deltas
    project_list = []
    total_eis_cf, total_actual_cf = [], []
    above, below = 0, 0
    for p in projects.values():
        actuals_cf = [a['cf_pct'] for a in p['annual_actuals'] if a['cf_pct'] is not None]
        if not actuals_cf:
            continue
        avg_cf = round(sum(actuals_cf) / len(actuals_cf), 1)
        delta = round(avg_cf - p['eis_cf_pct'], 1)
        p['avg_actual_cf_pct'] = avg_cf
        p['cf_delta_pct'] = delta
        project_list.append(p)
        total_eis_cf.append(p['eis_cf_pct'])
        total_actual_cf.append(avg_cf)
        if delta >= 0:
            above += 1
        else:
            below += 1

    project_list.sort(key=lambda x: x['cf_delta_pct'])

    result = {
        'projects': project_list,
        'summary': {
            'total_matched': len(project_list),
            'avg_eis_cf': round(sum(total_eis_cf) / len(total_eis_cf), 1) if total_eis_cf else 0,
            'avg_actual_cf': round(sum(total_actual_cf) / len(total_actual_cf), 1) if total_actual_cf else 0,
            'avg_delta': round(sum(total_actual_cf) / len(total_actual_cf) - sum(total_eis_cf) / len(total_eis_cf), 1) if total_eis_cf else 0,
            'projects_above_eis': above,
            'projects_below_eis': below,
        },
        'exported_at': datetime.now().isoformat(),
    }

    write_json(os.path.join(DATA_DIR, 'analytics', 'eis-comparison.json'), result)
    print(f"  analytics/eis-comparison.json ({len(project_list)} projects matched)")


def export_bess_bidding(conn):
    """Export BESS bidding intelligence from bess_daily_bids table."""
    # Check table exists
    table_check = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='bess_daily_bids'"
    ).fetchone()
    if not table_check:
        print("  bess-bidding.json: skipped (table not created — run import_nemweb_bids.py first)")
        return

    total = conn.execute("SELECT COUNT(*) as c FROM bess_daily_bids").fetchone()['c']
    if total == 0:
        print("  bess-bidding.json: skipped (no data)")
        return

    # --- 1. Per-project strategy profiles ---
    profiles = []
    rows = conn.execute("""
        SELECT
            project_id,
            MIN(settlement_date) as first_date,
            MAX(settlement_date) as last_date,
            COUNT(*) as total_bids,
            SUM(CASE WHEN bid_type='ENERGY' THEN 1 ELSE 0 END) as energy_bids,
            SUM(CASE WHEN bid_type!='ENERGY' THEN 1 ELSE 0 END) as fcas_bids,
            COUNT(DISTINCT bid_type) - 1 as fcas_services,
            SUM(CASE WHEN entry_type='REBID' THEN 1 ELSE 0 END) as rebid_count
        FROM bess_daily_bids
        GROUP BY project_id
        ORDER BY total_bids DESC
    """).fetchall()

    for r in rows:
        pid = r['project_id']
        rebid_pct = round(r['rebid_count'] / r['total_bids'] * 100, 1) if r['total_bids'] > 0 else 0

        # GEN/LOAD price bands for ENERGY
        gen = conn.execute("""
            SELECT
                ROUND(AVG(priceband1), 2) as pb1, ROUND(AVG(priceband2), 2) as pb2,
                ROUND(AVG(priceband3), 2) as pb3, ROUND(AVG(priceband4), 2) as pb4,
                ROUND(AVG(priceband5), 2) as pb5, ROUND(AVG(priceband6), 2) as pb6,
                ROUND(AVG(priceband7), 2) as pb7, ROUND(AVG(priceband8), 2) as pb8,
                ROUND(AVG(priceband9), 2) as pb9, ROUND(AVG(priceband10), 2) as pb10
            FROM bess_daily_bids
            WHERE project_id=? AND bid_type='ENERGY' AND direction='GEN'
        """, (pid,)).fetchone()

        load = conn.execute("""
            SELECT
                ROUND(AVG(priceband1), 2) as pb1, ROUND(AVG(priceband2), 2) as pb2,
                ROUND(AVG(priceband3), 2) as pb3, ROUND(AVG(priceband4), 2) as pb4,
                ROUND(AVG(priceband5), 2) as pb5, ROUND(AVG(priceband6), 2) as pb6,
                ROUND(AVG(priceband7), 2) as pb7, ROUND(AVG(priceband8), 2) as pb8,
                ROUND(AVG(priceband9), 2) as pb9, ROUND(AVG(priceband10), 2) as pb10
            FROM bess_daily_bids
            WHERE project_id=? AND bid_type='ENERGY' AND direction='LOAD'
        """, (pid,)).fetchone()

        gen_bands = [gen[f'pb{i}'] for i in range(1, 11)] if gen else [None]*10
        load_bands = [load[f'pb{i}'] for i in range(1, 11)] if load else [None]*10

        # Load strategy classification
        load_cap = load_bands[9] if load_bands[9] else 0
        if load_cap < 2000:
            load_strategy = 'defensive'
        elif load_cap < 15000:
            load_strategy = 'moderate'
        else:
            load_strategy = 'aggressive'

        # Target spread (gen pb5 - load pb5)
        gen_mid = gen_bands[4] if gen_bands[4] else 0
        load_mid = load_bands[4] if load_bands[4] else 0
        target_spread = round(gen_mid - load_mid, 2)

        # Participant ID
        part = conn.execute("""
            SELECT participant_id, COUNT(*) as cnt
            FROM bess_daily_bids
            WHERE project_id=? AND participant_id IS NOT NULL AND participant_id != ''
            GROUP BY participant_id ORDER BY cnt DESC LIMIT 1
        """, (pid,)).fetchone()

        # Project name from projects table
        proj = conn.execute("SELECT name, capacity_mw, storage_mwh, state FROM projects WHERE id=?", (pid,)).fetchone()

        profiles.append({
            'project_id': pid,
            'project_name': proj['name'] if proj else pid,
            'capacity_mw': proj['capacity_mw'] if proj else None,
            'storage_mwh': proj['storage_mwh'] if proj else None,
            'state': proj['state'] if proj else None,
            'participant_id': part['participant_id'] if part else None,
            'first_date': r['first_date'],
            'last_date': r['last_date'],
            'total_bids': r['total_bids'],
            'energy_bids': r['energy_bids'],
            'fcas_bids': r['fcas_bids'],
            'fcas_services': r['fcas_services'],
            'rebid_pct': rebid_pct,
            'gen_pricebands': gen_bands,
            'load_pricebands': load_bands,
            'load_strategy': load_strategy,
            'target_spread': target_spread,
        })

    # --- 2. Monthly fleet trends ---
    monthly_trends = []
    months = conn.execute("""
        SELECT DISTINCT substr(settlement_date, 1, 7) as month
        FROM bess_daily_bids
        ORDER BY month
    """).fetchall()

    for m in months:
        month = m['month']
        stats = conn.execute("""
            SELECT
                COUNT(DISTINCT duid) as active_duids,
                COUNT(*) as total_bids,
                SUM(CASE WHEN bid_type='ENERGY' THEN 1 ELSE 0 END) as energy_bids,
                ROUND(AVG(CASE WHEN bid_type='ENERGY' AND direction='GEN' THEN priceband5 END), 2) as avg_gen_mid,
                ROUND(AVG(CASE WHEN bid_type='ENERGY' AND direction='LOAD' THEN priceband5 END), 2) as avg_load_mid,
                ROUND(AVG(CASE WHEN bid_type='ENERGY' AND direction='GEN' THEN priceband10 END), 2) as avg_gen_cap,
                ROUND(AVG(CASE WHEN bid_type='ENERGY' AND direction='GEN' THEN priceband1 END), 2) as avg_gen_floor,
                ROUND(MAX(CASE WHEN bid_type='ENERGY' THEN priceband10 END), 2) as max_cap,
                ROUND(SUM(CASE WHEN entry_type='REBID' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as rebid_pct
            FROM bess_daily_bids
            WHERE substr(settlement_date, 1, 7) = ?
        """, (month,)).fetchone()

        monthly_trends.append({
            'month': month,
            'active_duids': stats['active_duids'],
            'total_bids': stats['total_bids'],
            'avg_gen_mid': stats['avg_gen_mid'],
            'avg_load_mid': stats['avg_load_mid'],
            'avg_gen_cap': stats['avg_gen_cap'],
            'avg_gen_floor': stats['avg_gen_floor'],
            'max_cap': stats['max_cap'],
            'rebid_pct': stats['rebid_pct'],
            'target_spread': round((stats['avg_gen_mid'] or 0) - (stats['avg_load_mid'] or 0), 2),
        })

    # --- 3. Quarterly evolution per key project ---
    key_projects = [
        'hornsdale-power-reserve', 'victorian-big-battery', 'waratah-super-battery',
        'torrens-island-bess', 'wallgrove-grid-battery-project', 'eraring-battery',
        'supernode-bess', 'wandoan-south-bess', 'bouldercombe-battery-project',
        'hazelwood-battery-energy-storage-system-hbess',
    ]
    quarterly_evolution = {}
    for pid in key_projects:
        qrows = conn.execute("""
            SELECT
                CASE
                    WHEN substr(settlement_date,6,2) IN ('01','02','03') THEN substr(settlement_date,1,4)||'-Q1'
                    WHEN substr(settlement_date,6,2) IN ('04','05','06') THEN substr(settlement_date,1,4)||'-Q2'
                    WHEN substr(settlement_date,6,2) IN ('07','08','09') THEN substr(settlement_date,1,4)||'-Q3'
                    WHEN substr(settlement_date,6,2) IN ('10','11','12') THEN substr(settlement_date,1,4)||'-Q4'
                END as quarter,
                ROUND(AVG(CASE WHEN direction='GEN' THEN priceband5 END), 2) as gen_mid,
                ROUND(AVG(CASE WHEN direction='LOAD' THEN priceband5 END), 2) as load_mid,
                ROUND(AVG(CASE WHEN direction='GEN' THEN priceband10 END), 2) as gen_cap,
                ROUND(AVG(CASE WHEN direction='LOAD' THEN priceband10 END), 2) as load_cap,
                COUNT(*) as bids,
                ROUND(SUM(CASE WHEN entry_type='REBID' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as rebid_pct
            FROM bess_daily_bids
            WHERE project_id=? AND bid_type='ENERGY'
            GROUP BY quarter
            ORDER BY quarter
        """, (pid,)).fetchall()

        quarterly_evolution[pid] = [{
            'quarter': q['quarter'],
            'gen_mid': q['gen_mid'],
            'load_mid': q['load_mid'],
            'gen_cap': q['gen_cap'],
            'load_cap': q['load_cap'],
            'target_spread': round((q['gen_mid'] or 0) - (q['load_mid'] or 0), 2),
            'rebid_pct': q['rebid_pct'],
        } for q in qrows]

    # --- 4. Rebid reason breakdown ---
    rebid_reasons = []
    reason_rows = conn.execute("""
        SELECT
            CASE
                WHEN LOWER(rebid_explanation) LIKE '%forecast%price%' OR LOWER(rebid_explanation) LIKE '%price forecast%' THEN 'price_forecast'
                WHEN LOWER(rebid_explanation) LIKE '%soc%' OR LOWER(rebid_explanation) LIKE '%state of charge%' OR LOWER(rebid_explanation) LIKE '%soe%' THEN 'state_of_charge'
                WHEN LOWER(rebid_explanation) LIKE '%capability%' THEN 'capability_change'
                WHEN LOWER(rebid_explanation) LIKE '%trapezium%' OR LOWER(rebid_explanation) LIKE '%trap%' THEN 'trapezium_update'
                WHEN LOWER(rebid_explanation) LIKE '%price%' THEN 'price_response'
                WHEN LOWER(rebid_explanation) LIKE '%forecast%' THEN 'forecast_update'
                WHEN LOWER(rebid_explanation) LIKE '%outage%' OR LOWER(rebid_explanation) LIKE '%maintenance%' THEN 'outage'
                WHEN LOWER(rebid_explanation) LIKE '%demand%' THEN 'demand'
                WHEN LOWER(rebid_explanation) LIKE '%fcas%' OR LOWER(rebid_explanation) LIKE '%enablement%' THEN 'fcas_enablement'
                WHEN LOWER(rebid_explanation) LIKE '%avail%' THEN 'availability'
                WHEN LOWER(rebid_explanation) LIKE '%commercial%' OR LOWER(rebid_explanation) LIKE '%trading%' THEN 'commercial'
                ELSE 'other'
            END as reason,
            COUNT(*) as count,
            COUNT(DISTINCT project_id) as projects
        FROM bess_daily_bids
        WHERE entry_type = 'REBID' AND rebid_explanation IS NOT NULL AND rebid_explanation != ''
        GROUP BY reason
        ORDER BY count DESC
    """).fetchall()

    for rr in reason_rows:
        rebid_reasons.append({
            'reason': rr['reason'],
            'count': rr['count'],
            'projects': rr['projects'],
        })

    # --- 5. Key insights (pre-computed narrative data) ---
    # MPC change detection
    mpc_shift = conn.execute("""
        SELECT
            MIN(CASE WHEN priceband10 > 20000 THEN settlement_date END) as first_new_mpc_date,
            MAX(CASE WHEN priceband10 < 19000 AND priceband10 > 17000 THEN priceband10 END) as old_mpc_approx,
            MAX(priceband10) as new_mpc_approx
        FROM bess_daily_bids
        WHERE bid_type='ENERGY'
    """).fetchone()

    # Most/least active rebidders
    rebid_rankings = conn.execute("""
        SELECT
            project_id,
            ROUND(SUM(CASE WHEN entry_type='REBID' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as rebid_pct
        FROM bess_daily_bids
        WHERE bid_type='ENERGY'
        GROUP BY project_id
        HAVING COUNT(*) > 100
        ORDER BY rebid_pct DESC
    """).fetchall()

    # Participant changes (ownership events)
    participant_changes = []
    for pid in key_projects:
        parts = conn.execute("""
            SELECT participant_id, MIN(settlement_date) as first_seen, MAX(settlement_date) as last_seen
            FROM bess_daily_bids
            WHERE project_id=? AND participant_id IS NOT NULL AND participant_id != ''
            GROUP BY participant_id
            ORDER BY first_seen
        """, (pid,)).fetchall()
        if len(parts) > 1:
            participant_changes.append({
                'project_id': pid,
                'changes': [{'participant_id': p['participant_id'], 'first_seen': p['first_seen'], 'last_seen': p['last_seen']} for p in parts],
            })

    insights = {
        'mpc_shift': {
            'first_new_mpc_date': mpc_shift['first_new_mpc_date'],
            'old_mpc_approx': round(mpc_shift['old_mpc_approx']) if mpc_shift['old_mpc_approx'] else None,
            'new_mpc_approx': round(mpc_shift['new_mpc_approx']) if mpc_shift['new_mpc_approx'] else None,
        },
        'most_active_rebidders': [{'project_id': r['project_id'], 'rebid_pct': r['rebid_pct']} for r in rebid_rankings[:5]],
        'least_active_rebidders': [{'project_id': r['project_id'], 'rebid_pct': r['rebid_pct']} for r in rebid_rankings[-5:]],
        'participant_changes': participant_changes,
        'strategy_counts': {
            'defensive': sum(1 for p in profiles if p['load_strategy'] == 'defensive'),
            'moderate': sum(1 for p in profiles if p['load_strategy'] == 'moderate'),
            'aggressive': sum(1 for p in profiles if p['load_strategy'] == 'aggressive'),
        },
        'fcas_only_energy': [p['project_id'] for p in profiles if p['fcas_services'] == 0],
        'fcas_full_stack': [p['project_id'] for p in profiles if p['fcas_services'] >= 8],
    }

    # --- Assemble output ---
    output = {
        'generated_at': datetime.now().isoformat(),
        'data_range': {
            'first_date': monthly_trends[0]['month'] if monthly_trends else None,
            'last_date': monthly_trends[-1]['month'] if monthly_trends else None,
            'total_bids': total,
            'total_projects': len(profiles),
        },
        'profiles': profiles,
        'monthly_trends': monthly_trends,
        'quarterly_evolution': quarterly_evolution,
        'rebid_reasons': rebid_reasons,
        'insights': insights,
    }

    path = os.path.join(INTEL_DIR, 'bess-bidding.json')
    write_json(path, output)
    print(f"  intelligence/bess-bidding.json ({len(profiles)} projects, {total} bids)")


def export_intelligence(conn):
    """Export all intelligence layer JSON files."""
    print("\nIntelligence Layer:")
    ensure_dir(INTEL_DIR)
    export_scheme_tracker(conn)
    export_drift_analysis(conn)
    export_wind_resource(conn)
    export_dunkelflaute(conn)
    export_energy_mix(conn)
    export_developer_scores(conn)
    export_revenue_intel(conn)
    export_grid_connection(conn)
    export_rez_access(conn)
    export_nem_activities(conn)
    export_bess_bidding(conn)


# ---- News Export -----------------------------------------------------------

def export_news(conn):
    """Export latest news articles to JSON."""
    # Check if news_articles table exists
    table_check = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='news_articles'"
    ).fetchone()
    if not table_check:
        print("\nNews: skipped (table not created yet — run import_news_rss.py first)")
        return

    rows = conn.execute("""
        SELECT title, url, source, published_date, summary, matched_project_ids
        FROM news_articles
        ORDER BY published_date DESC
        LIMIT 100
    """).fetchall()

    articles = []
    for r in rows:
        article = {
            'title': r['title'],
            'url': r['url'],
            'source': r['source'],
            'published_date': r['published_date'],
            'summary': r['summary'],
            'matched_project_ids': json.loads(r['matched_project_ids']) if r['matched_project_ids'] else [],
        }
        articles.append(article)

    # Source stats
    source_counts = {}
    for a in articles:
        src = a['source']
        source_counts[src] = source_counts.get(src, 0) + 1

    output = {
        'articles': articles,
        'source_counts': source_counts,
        'total_articles': len(articles),
        'exported_at': datetime.now().isoformat(),
    }

    news_dir = os.path.join(DATA_DIR, 'news')
    ensure_dir(news_dir)
    path = os.path.join(news_dir, 'latest.json')
    write_json(path, output)
    print(f"\nNews: news/latest.json ({len(articles)} articles)")


if __name__ == '__main__':
    export_all()
