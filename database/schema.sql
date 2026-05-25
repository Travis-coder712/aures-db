-- ============================================================
-- AURES Database Schema
-- SQLite 3.x
-- ============================================================
-- This schema maps directly to the TypeScript types in
-- frontend/src/lib/types.ts and supports the multi-source
-- intelligence model described in PROJECT-PLAN.md.
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================================
-- CORE: Projects
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
    id                  TEXT PRIMARY KEY,       -- slug, e.g. 'yanco-delta'
    name                TEXT NOT NULL,
    technology          TEXT NOT NULL CHECK(technology IN ('wind','solar','bess','hybrid','pumped_hydro','offshore_wind','gas')),
    status              TEXT NOT NULL CHECK(status IN ('operating','commissioning','construction','development','withdrawn')),
    capacity_mw         REAL NOT NULL,
    storage_mwh         REAL,                   -- NULL for non-storage
    state               TEXT NOT NULL CHECK(state IN ('NSW','VIC','QLD','SA','WA','TAS','NT','ACT')),
    rez                 TEXT,
    lga                 TEXT,
    latitude            REAL,
    longitude           REAL,

    -- Current ownership
    current_developer   TEXT,
    current_operator    TEXT,

    -- Current estimates
    cod_current         TEXT,
    cod_original        TEXT,

    -- Grid connection
    connection_status   TEXT,
    connection_nsp      TEXT,
    grid_forming        INTEGER DEFAULT 0,      -- boolean
    has_sips            INTEGER DEFAULT 0,
    has_syncon          INTEGER DEFAULT 0,
    has_statcom         INTEGER DEFAULT 0,
    has_harmonic_filter INTEGER DEFAULT 0,

    -- Scores (pre-computed by pipeline)
    development_score   REAL,
    performance_score   REAL,

    -- Development sub-stage (for development status projects)
    development_stage   TEXT CHECK(development_stage IN ('epbc_approved','epbc_submitted','planning_submitted','early_stage')),

    -- Notable
    notable             TEXT,

    -- Metadata
    data_confidence     TEXT NOT NULL DEFAULT 'unverified' CHECK(data_confidence IN ('high','good','medium','low','unverified')),
    last_updated        TEXT NOT NULL DEFAULT (date('now')),
    last_verified       TEXT NOT NULL DEFAULT (date('now')),
    aemo_gen_info_id    TEXT,                   -- AEMO DUID or station ID

    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_technology ON projects(technology);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_state ON projects(state);
CREATE INDEX IF NOT EXISTS idx_projects_rez ON projects(rez);
CREATE INDEX IF NOT EXISTS idx_projects_developer ON projects(current_developer);
CREATE INDEX IF NOT EXISTS idx_projects_aemo_id ON projects(aemo_gen_info_id);

-- ============================================================
-- TIMELINE: Project events (core differentiating feature)
-- ============================================================

CREATE TABLE IF NOT EXISTS timeline_events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date            TEXT NOT NULL,              -- ISO date
    date_precision  TEXT NOT NULL DEFAULT 'month' CHECK(date_precision IN ('day','month','quarter','year')),
    event_type      TEXT NOT NULL CHECK(event_type IN (
        'conceived','planning_submitted','planning_approved','planning_rejected',
        'planning_modified','ownership_change','offtake_signed','rez_access',
        'connection_milestone','fid','construction_start','equipment_order',
        'energisation','commissioning','cod','expansion',
        'cod_change','cost_change','capacity_change','stakeholder_issue','notable'
    )),
    title           TEXT NOT NULL,
    detail          TEXT,
    data_source     TEXT DEFAULT 'manual',       -- 'manual', 'openelectricity', 'aemo'

    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_timeline_project ON timeline_events(project_id);
CREATE INDEX IF NOT EXISTS idx_timeline_date ON timeline_events(date);
CREATE INDEX IF NOT EXISTS idx_timeline_type ON timeline_events(event_type);

-- ============================================================
-- SOURCES: Every fact must be sourced
-- ============================================================

CREATE TABLE IF NOT EXISTS source_references (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    url         TEXT NOT NULL,
    date        TEXT,                           -- date of publication
    source_tier INTEGER CHECK(source_tier BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_sources_url ON source_references(url);

-- Link sources to projects (general project sources)
CREATE TABLE IF NOT EXISTS project_sources (
    project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_id   INTEGER NOT NULL REFERENCES source_references(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, source_id)
);

-- Link sources to timeline events
CREATE TABLE IF NOT EXISTS timeline_event_sources (
    event_id    INTEGER NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
    source_id   INTEGER NOT NULL REFERENCES source_references(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, source_id)
);

-- ============================================================
-- OWNERSHIP: Full ownership history
-- ============================================================

CREATE TABLE IF NOT EXISTS ownership_history (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id              TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    period                  TEXT NOT NULL,       -- e.g. '2020-2023'
    owner                   TEXT NOT NULL,
    role                    TEXT NOT NULL,       -- e.g. 'Developer & Owner'
    acquisition_value_aud   REAL,
    transaction_structure   TEXT,
    source_url              TEXT,

    created_at              TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ownership_project ON ownership_history(project_id);
CREATE INDEX IF NOT EXISTS idx_ownership_owner ON ownership_history(owner);

-- ============================================================
-- COD HISTORY: Track how expected COD has drifted
-- ============================================================

CREATE TABLE IF NOT EXISTS cod_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date        TEXT NOT NULL,                  -- when this estimate was made
    estimate    TEXT NOT NULL,                  -- the estimated COD at that time
    source      TEXT NOT NULL,
    source_url  TEXT,

    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cod_project ON cod_history(project_id);

-- ============================================================
-- SUPPLIERS: Equipment and service providers
-- ============================================================

CREATE TABLE IF NOT EXISTS suppliers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK(role IN (
        'wind_oem','bess_oem','hydro_oem','inverter','bop','epc','syncon','statcom','harmonic_filter'
    )),
    supplier        TEXT NOT NULL,
    model           TEXT,
    quantity         INTEGER,
    grid_forming    INTEGER DEFAULT 0,          -- boolean
    source_url      TEXT,

    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_suppliers_project ON suppliers(project_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier ON suppliers(supplier);

-- ============================================================
-- OFFTAKES: PPAs, CIS, LTESA, etc.
-- ============================================================

CREATE TABLE IF NOT EXISTS offtakes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    party           TEXT NOT NULL,
    type            TEXT NOT NULL CHECK(type IN ('PPA','corporate_ppa','government_ppa','tolling','merchant','CIS','LTESA','SIPS','FCAS','other')),
    term_years      INTEGER,
    capacity_mw     REAL,
    source_url      TEXT,

    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_offtakes_project ON offtakes(project_id);

-- ============================================================
-- SCHEME CONTRACTS: CIS / LTESA links
-- ============================================================

CREATE TABLE IF NOT EXISTS scheme_contracts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    scheme          TEXT NOT NULL,
    round           TEXT DEFAULT '',
    capacity_mw     REAL,
    storage_mwh     REAL,
    contract_type   TEXT,
    source_url      TEXT,

    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_schemes_project ON scheme_contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_schemes_round ON scheme_contracts(round);

-- ============================================================
-- MULTI-SOURCE VALUES: For contested data points (e.g. cost)
-- ============================================================

CREATE TABLE IF NOT EXISTS multi_source_values (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id          TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    field_name          TEXT NOT NULL,           -- e.g. 'cost_aud_million'
    value               TEXT NOT NULL,
    source              TEXT NOT NULL,
    source_url          TEXT,
    date                TEXT NOT NULL,
    context             TEXT,
    what_this_covers    TEXT,

    created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_msv_project ON multi_source_values(project_id);
CREATE INDEX IF NOT EXISTS idx_msv_field ON multi_source_values(field_name);

-- ============================================================
-- STAKEHOLDER ISSUES
-- ============================================================

CREATE TABLE IF NOT EXISTS stakeholder_issues (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    issue       TEXT NOT NULL,

    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_stakeholder_project ON stakeholder_issues(project_id);

-- ============================================================
-- PROJECT STAGES: Multi-stage project tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS project_stages (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id          TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage               TEXT NOT NULL,              -- '1', '2', '3-5', etc.
    name                TEXT,                       -- 'Stage 1', 'Phase A1', 'East (Phase 1)', etc.
    capacity_mw         REAL,
    storage_mwh         REAL,
    status              TEXT,                       -- operating, construction, commissioning, development
    cod                 TEXT,                       -- actual or expected COD date
    cod_original        TEXT,                       -- original COD if revised
    capex_aud_m         REAL,
    capex_source        TEXT,
    oem                 TEXT,
    oem_model           TEXT,
    grid_forming        INTEGER DEFAULT 0,
    notes               TEXT,

    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_project_stages_project ON project_stages(project_id);

-- ============================================================
-- BESS BIDS: Daily bid/offer data from NEMWEB MMSDM archives
-- ============================================================

CREATE TABLE IF NOT EXISTS bess_daily_bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    settlement_date TEXT NOT NULL,
    duid TEXT NOT NULL,
    project_id TEXT,
    bid_type TEXT NOT NULL,       -- ENERGY, LOWER5MIN, RAISE5MIN, etc.
    direction TEXT NOT NULL,      -- GEN, LOAD, BIDIRECTIONAL
    participant_id TEXT,
    rebid_explanation TEXT,
    priceband1 REAL, priceband2 REAL, priceband3 REAL, priceband4 REAL, priceband5 REAL,
    priceband6 REAL, priceband7 REAL, priceband8 REAL, priceband9 REAL, priceband10 REAL,
    entry_type TEXT,              -- DAILY, REBID
    offer_date TEXT,
    version_no INTEGER,
    UNIQUE(settlement_date, duid, bid_type, direction, version_no)
);

CREATE INDEX IF NOT EXISTS idx_bess_bids_duid ON bess_daily_bids(duid);
CREATE INDEX IF NOT EXISTS idx_bess_bids_date ON bess_daily_bids(settlement_date);
CREATE INDEX IF NOT EXISTS idx_bess_bids_project ON bess_daily_bids(project_id);

-- ============================================================
-- AEMO DATA: Raw imported data from Generation Information
-- ============================================================

CREATE TABLE IF NOT EXISTS aemo_generation_info (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    station_name            TEXT,
    duid                    TEXT,
    region                  TEXT,               -- NEM region (NSW1, VIC1, QLD1, SA1, TAS1)
    fuel_type               TEXT,               -- e.g. 'Wind', 'Solar', 'Battery'
    technology_type         TEXT,
    physical_unit_no        TEXT,
    unit_size_mw            REAL,
    registered_capacity_mw  REAL,
    max_capacity_mw         REAL,
    max_roc_per_min         REAL,
    status                  TEXT,               -- 'Existing', 'Committed', 'Proposed', etc.
    classification          TEXT,               -- 'Scheduled', 'Semi-Scheduled', 'Non-Scheduled'
    dispatch_type           TEXT,               -- 'Generator', 'Load'
    owner                   TEXT,
    connection_point_id     TEXT,
    expected_closure_year   TEXT,
    expected_storage_mwh    REAL,
    full_year_commissioning TEXT,

    -- Linkage
    project_id              TEXT REFERENCES projects(id),

    -- Import metadata
    import_date             TEXT NOT NULL DEFAULT (date('now')),
    source_file             TEXT,

    created_at              TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_aemo_duid ON aemo_generation_info(duid);
CREATE INDEX IF NOT EXISTS idx_aemo_station ON aemo_generation_info(station_name);
CREATE INDEX IF NOT EXISTS idx_aemo_status ON aemo_generation_info(status);
CREATE INDEX IF NOT EXISTS idx_aemo_fuel ON aemo_generation_info(fuel_type);
CREATE INDEX IF NOT EXISTS idx_aemo_project ON aemo_generation_info(project_id);

-- ============================================================
-- AUDIT LOG: Track all data changes
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name  TEXT NOT NULL,
    record_id   TEXT NOT NULL,
    field_name  TEXT NOT NULL,
    old_value   TEXT,
    new_value   TEXT,
    source      TEXT,
    changed_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_log(table_name, record_id);

-- ============================================================
-- METADATA: Track import runs and data freshness
-- ============================================================

CREATE TABLE IF NOT EXISTS import_runs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    source          TEXT NOT NULL,              -- e.g. 'aemo_generation_info'
    source_file     TEXT,
    records_imported INTEGER NOT NULL DEFAULT 0,
    records_updated  INTEGER NOT NULL DEFAULT 0,
    records_new      INTEGER NOT NULL DEFAULT 0,
    started_at      TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at    TEXT,
    status          TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running','completed','failed')),
    error_message   TEXT
);

-- ============================================================
-- PERFORMANCE: Annual operational metrics (Phase 3)
-- ============================================================

CREATE TABLE IF NOT EXISTS performance_annual (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id              TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    year                    INTEGER NOT NULL,

    -- Generation metrics (wind/solar/hybrid)
    energy_mwh              REAL,
    capacity_factor_pct     REAL,
    curtailment_pct         REAL,
    energy_price_received   REAL,           -- volume-weighted avg $/MWh
    revenue_aud             REAL,
    revenue_per_mw          REAL,           -- $/MW/year

    -- BESS metrics
    energy_charged_mwh      REAL,
    energy_discharged_mwh   REAL,
    avg_charge_price        REAL,           -- avg $/MWh when charging
    avg_discharge_price     REAL,           -- avg $/MWh when discharging
    utilisation_pct         REAL,           -- % of hours with non-zero dispatch
    cycles                  REAL,           -- equivalent full cycles

    -- Common
    market_value_aud        REAL,           -- total market revenue
    data_source             TEXT,           -- e.g. 'openelectricity', 'aemo_nemweb'
    import_date             TEXT NOT NULL DEFAULT (date('now')),

    created_at              TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at              TEXT NOT NULL DEFAULT (datetime('now')),

    UNIQUE(project_id, year)
);

CREATE INDEX IF NOT EXISTS idx_perf_annual_project ON performance_annual(project_id);
CREATE INDEX IF NOT EXISTS idx_perf_annual_year ON performance_annual(year);

-- ============================================================
-- LEAGUE TABLES: Pre-computed rankings (Phase 3)
-- ============================================================

CREATE TABLE IF NOT EXISTS league_table_entries (
    id                          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id                  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    year                        INTEGER NOT NULL,
    technology                  TEXT NOT NULL,

    -- Rankings (1 = best)
    rank_capacity_factor        INTEGER,
    rank_revenue_per_mw         INTEGER,
    rank_curtailment            INTEGER,
    rank_composite              INTEGER,

    -- Percentiles (0-100, higher = better)
    percentile_capacity_factor  REAL,
    percentile_revenue_per_mw   REAL,

    -- Quartile and composite
    quartile                    INTEGER CHECK(quartile BETWEEN 1 AND 4),
    composite_score             REAL,           -- 0-100

    created_at                  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at                  TEXT NOT NULL DEFAULT (datetime('now')),

    UNIQUE(project_id, year)
);

CREATE INDEX IF NOT EXISTS idx_league_project ON league_table_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_league_year_tech ON league_table_entries(year, technology);
CREATE INDEX IF NOT EXISTS idx_league_quartile ON league_table_entries(quartile);

-- ============================================================
-- ENERGYCO REZ ACCESS RIGHTS: per-access-right rows from
-- EnergyCo's Access Rights Register (Central-West Orana + South
-- West REZ schemes). One row per access right (a project can
-- hold multiple — e.g. Liverpool Range Stage 1 + Stage 2; or
-- Dinawan Energy Hub which has 3 sub-stages).
--
-- Importer: pipeline/importers/import_energyco_rez_access.py
-- Source:   https://www.energyco.nsw.gov.au/.../access-rights-register.xlsx
-- Cadence:  Updated by EnergyCo on a rolling basis (no fixed period).
--           Re-run as part of regular data refresh.
-- ============================================================

CREATE TABLE IF NOT EXISTS energyco_rez_access (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    access_right_id     TEXT NOT NULL UNIQUE,       -- e.g. 'CWO2025-01', 'SW2025-03'
    project_id          TEXT REFERENCES projects(id) ON DELETE SET NULL,
    rez_scheme          TEXT NOT NULL,              -- 'CWO' | 'SW'
    project_name_raw    TEXT NOT NULL,              -- Raw name from the register
    access_holder       TEXT,                       -- Legal entity name
    abn_acn             TEXT,
    max_capacity_mw     REAL,
    primary_technology  TEXT,                       -- 'Wind' | 'Solar' | 'BESS'
    has_hybrid_bess     INTEGER DEFAULT 0,
    bess_mwh            REAL,                       -- Storage capacity if hybrid
    allocation_process  TEXT,                       -- e.g. 'EnergyCo application' / 'AEMO Services T5 tender'
    registration_date   TEXT,                       -- ISO date
    access_status       TEXT,                       -- 'Registered' | 'Transferred' | 'Terminated' | 'Expired'
    connection_point    TEXT,                       -- Eastings/Northings or substation name
    coordinates         TEXT,                       -- Substation coords
    ner_3_13_3_b2_2     INTEGER DEFAULT 0,          -- Boolean: subject to NER cl 3.13.3(b2)(2)
    last_imported_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_energyco_rez_project   ON energyco_rez_access(project_id);
CREATE INDEX IF NOT EXISTS idx_energyco_rez_scheme    ON energyco_rez_access(rez_scheme);
CREATE INDEX IF NOT EXISTS idx_energyco_rez_status    ON energyco_rez_access(access_status);

-- ============================================================
-- AEMO IASR PROJECTS: per-project rows from AEMO's Inputs and
-- Assumptions Workbook (Existing Gen Data Summary sheet).
-- Covers Existing + Committed + Anticipated + Additional policy-
-- supported projects across the NEM with REZ ID/Location detail
-- that the monthly Gen Info Excel does NOT expose.
--
-- Importer: pipeline/importers/import_aemo_iasr.py
-- Source:   AEMO 2025 IASR Workbook (xlsx, ~18 MB, 83 sheets)
-- Cadence:  Annual (final IASR released August, Draft IASR in
--           Dec/Feb cycles for each ISP). Re-run as part of regular
--           data refresh.
-- ============================================================

CREATE TABLE IF NOT EXISTS aemo_iasr_projects (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    iasr_id             TEXT NOT NULL,              -- e.g. 'AVLSF1', 'BHBG1'
    project_id          TEXT REFERENCES projects(id) ON DELETE SET NULL,
    power_station       TEXT NOT NULL,              -- e.g. 'Avonlie Solar Farm'
    technology_type     TEXT,                       -- e.g. 'Large scale Solar PV', 'Wind', 'Battery storage (2hrs storage)'
    fuel_type           TEXT,
    region              TEXT,                       -- 'NSW' | 'VIC' | 'QLD' | 'SA' | 'TAS'
    sub_region          TEXT,                       -- e.g. 'CNSW', 'SNW', 'CQ'
    rez_location        TEXT,                       -- Human-readable REZ name, e.g. 'Wagga Wagga', 'Central-West Orana'
    rez_id              TEXT,                       -- AEMO REZ code, e.g. 'N5', 'V5', 'Q8a'
    status              TEXT,                       -- 'Existing' | 'Committed' | 'Anticipated' | 'Additional policy-supported'
    max_capacity_mw     REAL,
    storage_mwh         REAL,
    workbook_version    TEXT NOT NULL,              -- e.g. '2025-iasr-aug2025'
    last_imported_at    TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(iasr_id, workbook_version)
);

CREATE INDEX IF NOT EXISTS idx_aemo_iasr_project   ON aemo_iasr_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_aemo_iasr_status    ON aemo_iasr_projects(status);
CREATE INDEX IF NOT EXISTS idx_aemo_iasr_rez       ON aemo_iasr_projects(rez_id);
CREATE INDEX IF NOT EXISTS idx_aemo_iasr_region    ON aemo_iasr_projects(region);
