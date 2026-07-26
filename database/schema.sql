-- ============================================================
-- AURES Database Schema
-- SQLite 3.x
-- ============================================================
-- Regenerated 2026-07-26 from live database/aures.db as an honest
-- snapshot of the deployed schema. Historical drift left the previous
-- schema.sql out-of-sync with live in ~14 tables; this file is now
-- an accurate baseline.
--
-- Constraint policy is aspirational, not enforced everywhere: the
-- projects table lost CHECKs and most NOT NULL flags in a historical
-- silent recreation and is not restoring them here without a
-- separate data-quality migration. New tables should carry
-- CHECKs / UNIQUE where they make sense (see aemo_generation_info,
-- source_references, timeline_events for recent examples).
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================================
-- CORE: Projects
-- ============================================================

CREATE TABLE IF NOT EXISTS "projects" (
    id TEXT PRIMARY KEY,
    name TEXT, technology TEXT, status TEXT, capacity_mw REAL, storage_mwh REAL, state TEXT, rez TEXT, lga TEXT, latitude REAL, longitude REAL, current_developer TEXT, current_operator TEXT, cod_current TEXT, cod_original TEXT, connection_status TEXT, connection_nsp TEXT, grid_forming TEXT, has_sips TEXT, has_syncon TEXT, has_statcom TEXT, has_harmonic_filter TEXT, performance_score REAL, notable TEXT, data_confidence TEXT, last_updated TEXT, last_verified TEXT, aemo_gen_info_id TEXT, created_at TEXT, updated_at TEXT, confidence_score TEXT, development_stage TEXT
, capex_aud_m REAL, capex_source TEXT, capex_year INTEGER, first_seen TEXT, zombie_flag TEXT, capex_source_url TEXT, rez_access_status TEXT, rez_access_mw     REAL, rez_access_date   TEXT, rez_access_scheme TEXT);
CREATE INDEX IF NOT EXISTS idx_projects_aemo_id ON projects(aemo_gen_info_id);
CREATE INDEX IF NOT EXISTS idx_projects_developer ON projects(current_developer);
CREATE INDEX IF NOT EXISTS idx_projects_rez ON projects(rez);
CREATE INDEX IF NOT EXISTS idx_projects_state ON projects(state);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_technology ON projects(technology);

CREATE TABLE IF NOT EXISTS project_sources (
    project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_id   INTEGER NOT NULL REFERENCES source_references(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, source_id)
);

CREATE TABLE IF NOT EXISTS project_stages (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id      TEXT NOT NULL REFERENCES projects(id),
    stage           INTEGER NOT NULL,           -- 1, 2, 3, ...
    name            TEXT NOT NULL,              -- "Stage 1", "Phase A1", etc.
    capacity_mw     REAL NOT NULL DEFAULT 0,
    storage_mwh     REAL NOT NULL DEFAULT 0,
    status          TEXT NOT NULL CHECK(status IN ('operating','commissioning','construction','development','withdrawn')),
    cod             TEXT,                       -- ISO date
    cod_original    TEXT,
    capex_aud_m     REAL,
    capex_source    TEXT,
    oem             TEXT,
    oem_model       TEXT,
    grid_forming    INTEGER DEFAULT 0,          -- boolean
    notes           TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now')),
    UNIQUE(project_id, stage)
);
CREATE INDEX IF NOT EXISTS idx_project_stages_project ON project_stages(project_id);

CREATE TABLE IF NOT EXISTS source_references (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    url         TEXT NOT NULL,
    date        TEXT,                           -- date of publication
    source_tier INTEGER CHECK(source_tier BETWEEN 1 AND 5)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sources_url ON source_references(url);

-- ============================================================
-- Projects — auxiliary
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
CREATE INDEX IF NOT EXISTS idx_ownership_owner ON ownership_history(owner);
CREATE INDEX IF NOT EXISTS idx_ownership_project ON ownership_history(project_id);

CREATE TABLE IF NOT EXISTS stakeholder_issues (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    issue       TEXT NOT NULL,

    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_stakeholder_project ON stakeholder_issues(project_id);

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
CREATE INDEX IF NOT EXISTS idx_msv_field ON multi_source_values(field_name);
CREATE INDEX IF NOT EXISTS idx_msv_project ON multi_source_values(project_id);

-- ============================================================
-- Timeline events
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

    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
, data_source TEXT DEFAULT 'manual');
CREATE INDEX IF NOT EXISTS idx_timeline_date ON timeline_events(date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_timeline_events_data_source_key
  ON timeline_events(project_id, event_type, date, data_source)
  WHERE data_source != 'manual';
CREATE INDEX IF NOT EXISTS idx_timeline_project ON timeline_events(project_id);
CREATE INDEX IF NOT EXISTS idx_timeline_type ON timeline_events(event_type);

CREATE TABLE IF NOT EXISTS timeline_event_sources (
    event_id    INTEGER NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
    source_id   INTEGER NOT NULL REFERENCES source_references(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, source_id)
);

-- ============================================================
-- COD history
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
-- Contracts & counterparties
-- ============================================================

CREATE TABLE IF NOT EXISTS "offtakes" (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    party           TEXT NOT NULL,
    type            TEXT NOT NULL CHECK(type IN ('PPA','corporate_ppa','government_ppa','tolling','merchant','CIS','LTESA','SIPS','FCAS','other')),
    term_years      INTEGER,
    capacity_mw     REAL,
    source_url      TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
, price_aud_per_mwh REAL, price_structure TEXT, start_date TEXT, end_date TEXT, tenor_description TEXT, volume_structure TEXT, price_notes TEXT, sources TEXT, data_confidence TEXT, last_verified TEXT);
CREATE INDEX IF NOT EXISTS idx_offtakes_project ON offtakes(project_id);

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
-- Suppliers (OEM / EPC / BoP)
-- ============================================================

CREATE TABLE IF NOT EXISTS "suppliers" (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK(role IN (
        'wind_oem','bess_oem','hydro_oem','solar_oem','inverter','bop','epc','syncon','statcom','harmonic_filter'
    )),
    supplier        TEXT NOT NULL,
    model           TEXT,
    quantity         INTEGER,
    grid_forming    INTEGER DEFAULT 0,
    source_url      TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_suppliers_project ON suppliers(project_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier ON suppliers(supplier);

-- ============================================================
-- Technical specs (EIS-verified)
-- ============================================================

CREATE TABLE IF NOT EXISTS eis_technical_specs (
    id                              INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id                      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- ── Document Reference ───────────────────────────────────────────────────
    document_title                  TEXT NOT NULL,
    document_url                    TEXT,
    document_year                   INTEGER,

    -- ── Wind Farm Technical Specs ────────────────────────────────────────────
    turbine_model                   TEXT,           -- e.g. "Vestas V162-6.2 MW"
    turbine_count                   INTEGER,        -- number of WTGs
    turbine_rated_power_mw          REAL,           -- per turbine (MW)
    hub_height_m                    REAL,           -- hub height (m)
    hub_height_note                 TEXT,           -- e.g. "maximum in envelope"
    rotor_diameter_m                REAL,           -- rotor diameter (m)

    -- Wind resource data from EIS met mast / modelling
    wind_speed_mean_ms              REAL,           -- mean annual wind speed (m/s)
    wind_speed_height_m             REAL,           -- measurement height (m AGL)
    wind_speed_period               TEXT,           -- e.g. "10-year modelled average at hub height"

    -- Energy yield assessment
    assumed_capacity_factor_pct     REAL,           -- CF from EIS energy yield (%)
    assumed_annual_energy_gwh       REAL,           -- annual energy output from EIS (GWh)
    energy_yield_method             TEXT,           -- e.g. "WAsP modelling"

    -- Environmental constraints
    noise_limit_dba                 REAL,           -- compliance noise limit at receivers (dBA)
    minimum_setback_m               INTEGER,        -- minimum setback from dwellings (m)

    -- ── BESS Technical Specs ─────────────────────────────────────────────────
    cell_chemistry                  TEXT,           -- e.g. "LFP", "NMC"
    cell_chemistry_full             TEXT,           -- e.g. "Lithium Iron Phosphate (LiFePO4)"
    cell_supplier                   TEXT,           -- e.g. "CATL", "Samsung SDI", "BYD"
    cell_country_of_manufacture     TEXT,           -- e.g. "China", "South Korea"

    inverter_supplier               TEXT,           -- e.g. "Sungrow", "Power Electronics", "SMA"
    inverter_model                  TEXT,           -- e.g. "PCS3600"
    inverter_country_of_manufacture TEXT,           -- e.g. "China", "Spain", "Germany"
    inverter_rated_power_kw         REAL,           -- per inverter unit (kW)
    inverter_count                  INTEGER,        -- number of inverter units

    pcs_type                        TEXT CHECK(pcs_type IN ('grid_forming','grid_following','both')),
    -- 'grid_forming': voltage-source converters, can operate in islanded grid
    -- 'grid_following': current-source converters, requires grid reference
    -- 'both': mixed or upgradeable

    round_trip_efficiency_pct       REAL,           -- DC-DC round trip efficiency (%)
    round_trip_efficiency_ac        REAL,           -- AC-AC round trip efficiency (%)
    duration_hours                  REAL,           -- storage duration at rated power (h)

    -- Grid connection (common to both wind and BESS)
    connection_voltage_kv           REAL,           -- connection voltage (kV)
    transformer_mva                 REAL,           -- main transformer rating (MVA)

    -- Network connection point — directly drives transmission line capex
    network_service_provider        TEXT,           -- NSP, e.g. 'TransGrid', 'AusNet', 'ElectraNet', 'Powerlink'
    connection_substation_name      TEXT,           -- named substation, e.g. 'Eraring 330 kV substation'
    connection_substation_capacity_mva REAL,        -- existing substation capacity (MVA), if known
    connection_distance_km          REAL,           -- km from project boundary to connection point
    connection_distance_note        TEXT,           -- e.g. 'On-site — former power station substation reused'
    connection_augmentation         TEXT,           -- any required network augmentation (TEXT description)

    -- ── General Notes ────────────────────────────────────────────────────────
    notes                           TEXT,

    created_at                      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_eis_project ON eis_technical_specs(project_id);

-- ============================================================
-- AEMO — Generation Information
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
, snapshot             TEXT, unit_name            TEXT, unit_count           INTEGER, unit_capacity_mw_ac  REAL, agg_nameplate_mw_ac  REAL);
CREATE INDEX IF NOT EXISTS idx_aemo_duid ON aemo_generation_info(duid);
CREATE INDEX IF NOT EXISTS idx_aemo_fuel ON aemo_generation_info(fuel_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_aemo_gi_natural_key
  ON aemo_generation_info(
       snapshot,
       station_name,
       COALESCE(duid, ''),
       COALESCE(unit_name, '')
     );
CREATE INDEX IF NOT EXISTS idx_aemo_project ON aemo_generation_info(project_id);
CREATE INDEX IF NOT EXISTS idx_aemo_station ON aemo_generation_info(station_name);
CREATE INDEX IF NOT EXISTS idx_aemo_status ON aemo_generation_info(status);

-- ============================================================
-- AEMO — MMSDM & NEMWEB dispatch
-- ============================================================

CREATE TABLE IF NOT EXISTS dispatch_availability (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    settlement_date     TEXT NOT NULL,           -- ISO 'YYYY-MM-DD HH:MM:SS' of 5-min interval
    duid                TEXT NOT NULL,
    availability_mw     REAL,                    -- MW unit offered as available
    total_cleared_mw    REAL,                    -- MW dispatched
    initial_mw          REAL,                    -- actual MW at start of interval
    dispatch_mode       TEXT,                    -- 'outage' / 'displaced' / 'dispatched' / 'unknown'
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(settlement_date, duid)
);
CREATE INDEX IF NOT EXISTS idx_dispatch_avail_date ON dispatch_availability(settlement_date);
CREATE INDEX IF NOT EXISTS idx_dispatch_avail_duid ON dispatch_availability(duid);

CREATE TABLE IF NOT EXISTS dispatch_price_daily (
            date            TEXT NOT NULL,
            region          TEXT NOT NULL,
            avg_rrp         REAL,
            peak_rrp        REAL,
            peak_rrp_time   TEXT,
            p90_rrp         REAL,
            negative_count  INTEGER DEFAULT 0,
            intervals       INTEGER DEFAULT 0,
            created_at      TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(date, region)
        );
CREATE INDEX IF NOT EXISTS idx_dpd_date   ON dispatch_price_daily(date);
CREATE INDEX IF NOT EXISTS idx_dpd_region ON dispatch_price_daily(region);

CREATE TABLE IF NOT EXISTS generation_daily (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            date            TEXT NOT NULL,
            duid            TEXT NOT NULL,
            fuel_type       TEXT NOT NULL,
            region          TEXT,
            gen_mwh         REAL NOT NULL DEFAULT 0,
            charge_mwh      REAL NOT NULL DEFAULT 0,
            interval_count  INTEGER NOT NULL DEFAULT 0,
            created_at      TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(date, duid)
        );
CREATE INDEX IF NOT EXISTS idx_gen_daily_date ON generation_daily(date);
CREATE INDEX IF NOT EXISTS idx_gen_daily_duid ON generation_daily(duid);
CREATE INDEX IF NOT EXISTS idx_gen_daily_fuel ON generation_daily(fuel_type);
CREATE INDEX IF NOT EXISTS idx_gen_daily_region ON generation_daily(region);

CREATE TABLE IF NOT EXISTS demand_daily (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            date           TEXT NOT NULL,
            region         TEXT NOT NULL,
            demand_mwh     REAL NOT NULL DEFAULT 0,
            peak_demand_mw REAL,
            interval_count INTEGER NOT NULL DEFAULT 0,
            created_at     TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(date, region)
        );
CREATE INDEX IF NOT EXISTS idx_demand_date ON demand_daily(date);
CREATE INDEX IF NOT EXISTS idx_demand_region ON demand_daily(region);

-- ============================================================
-- AEMO — IASR + ISP
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
CREATE INDEX IF NOT EXISTS idx_aemo_iasr_region    ON aemo_iasr_projects(region);
CREATE INDEX IF NOT EXISTS idx_aemo_iasr_rez       ON aemo_iasr_projects(rez_id);
CREATE INDEX IF NOT EXISTS idx_aemo_iasr_status    ON aemo_iasr_projects(status);

CREATE TABLE IF NOT EXISTS rez_isp_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rez_id TEXT NOT NULL,
            isp_year INTEGER NOT NULL,
            hosting_capacity_mw REAL,
            connection_capacity_mw REAL,
            transmission_status TEXT,
            expected_available TEXT,
            notes TEXT,
            import_date TEXT DEFAULT (date('now')),
            UNIQUE(rez_id, isp_year)
        );

-- ============================================================
-- AEMO — BESS 5-minute + daily
-- ============================================================

CREATE TABLE IF NOT EXISTS battery_daily_scada (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    settlement_date       TEXT NOT NULL,       -- YYYY-MM-DD (NEM time = AEST, no DST)
    region                TEXT NOT NULL,       -- 'NEM' or 'NSW1' / 'VIC1' / 'QLD1' / 'SA1' / 'TAS1'
    discharged_mwh        REAL DEFAULT 0,
    charged_mwh           REAL DEFAULT 0,
    peak_discharge_mw     REAL,
    peak_charge_mw        REAL,
    peak_discharge_time   TEXT,                -- ISO datetime of the peak discharge interval
    peak_charge_time      TEXT,
    intervals_counted     INTEGER,
    created_at            TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(settlement_date, region)
);
CREATE INDEX IF NOT EXISTS idx_bat_daily_date ON battery_daily_scada(settlement_date);
CREATE INDEX IF NOT EXISTS idx_bat_daily_region ON battery_daily_scada(region);

CREATE TABLE IF NOT EXISTS battery_records (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    metric            TEXT NOT NULL,       -- max_discharge_5min / max_charge_5min / max_daily_discharge / max_daily_charge
    region            TEXT NOT NULL,
    value             REAL NOT NULL,
    unit              TEXT,                -- 'MW' or 'MWh'
    recorded_at       TEXT,                -- ISO datetime when the record was set
    settlement_date   TEXT,                -- YYYY-MM-DD for daily records
    details           TEXT,                -- JSON blob with extras
    updated_at        TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(metric, region)
);
CREATE INDEX IF NOT EXISTS idx_bat_rec_region ON battery_records(region);

CREATE TABLE IF NOT EXISTS bess_5min_peaks (
            id                    INTEGER PRIMARY KEY AUTOINCREMENT,
            date                  TEXT NOT NULL,
            duid                  TEXT NOT NULL,
            region                TEXT,
            peak_discharge_mw     REAL,
            peak_discharge_time   TEXT,
            peak_charge_mw        REAL,
            peak_charge_time      TEXT,
            intervals_counted     INTEGER DEFAULT 0,
            created_at            TEXT NOT NULL DEFAULT (datetime('now')), peak_30min_mwh REAL, peak_30min_start TEXT, peak_30min_charge_mwh REAL, peak_30min_charge_start TEXT, peak_1hr_mwh REAL, peak_1hr_start TEXT, peak_1hr_charge_mwh REAL, peak_1hr_charge_start TEXT,
            UNIQUE(date, duid)
        );
CREATE INDEX IF NOT EXISTS idx_bess5m_date ON bess_5min_peaks(date);
CREATE INDEX IF NOT EXISTS idx_bess5m_duid ON bess_5min_peaks(duid);

CREATE TABLE IF NOT EXISTS bess_band_capture (
            year           INTEGER NOT NULL,
            month          INTEGER NOT NULL,
            duid           TEXT NOT NULL,
            project_id     TEXT,
            region         TEXT NOT NULL,
            direction      TEXT NOT NULL,   -- 'GEN' (discharge) or 'LOAD' (charge)
            band_label     TEXT NOT NULL,
            band_min       REAL NOT NULL,
            band_max       REAL NOT NULL,
            energy_mwh     REAL NOT NULL DEFAULT 0,
            interval_count INTEGER NOT NULL DEFAULT 0,
            energy_pct     REAL,
            avg_price      REAL,
            UNIQUE(year, month, duid, direction, band_label)
        );
CREATE INDEX IF NOT EXISTS idx_bbc_duid
            ON bess_band_capture(duid, year, month);
CREATE INDEX IF NOT EXISTS idx_bbc_project
            ON bess_band_capture(project_id, year, month);

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
CREATE INDEX IF NOT EXISTS idx_bess_bids_date ON bess_daily_bids(settlement_date);
CREATE INDEX IF NOT EXISTS idx_bess_bids_duid ON bess_daily_bids(duid);
CREATE INDEX IF NOT EXISTS idx_bess_bids_project ON bess_daily_bids(project_id);

CREATE TABLE IF NOT EXISTS price_band_capture (
            year           INTEGER NOT NULL,
            month          INTEGER NOT NULL,
            duid           TEXT NOT NULL,
            project_id     TEXT,
            region         TEXT NOT NULL,
            band_label     TEXT NOT NULL,
            band_min       REAL NOT NULL,
            band_max       REAL NOT NULL,
            gen_mwh        REAL NOT NULL DEFAULT 0,
            interval_count INTEGER NOT NULL DEFAULT 0,
            gen_pct        REAL,
            avg_price      REAL,
            UNIQUE(year, month, duid, band_label)
        );
CREATE INDEX IF NOT EXISTS idx_pbc_duid
            ON price_band_capture(duid, year, month);
CREATE INDEX IF NOT EXISTS idx_pbc_project
            ON price_band_capture(project_id, year, month);

-- ============================================================
-- EnergyCo NSW REZ access
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
-- EPBC / Planning
-- ============================================================

CREATE TABLE IF NOT EXISTS epbc_referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    jurisdiction TEXT,
    referral_decision TEXT,
    status_description TEXT,
    stage_name TEXT,
    year INTEGER,
    category TEXT,
    referral_url TEXT,
    project_id TEXT,
    match_score REAL,
    imported_at TEXT
);

-- ============================================================
-- Performance
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

CREATE TABLE IF NOT EXISTS performance_monthly (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT NOT NULL REFERENCES projects(id),
            year INTEGER NOT NULL,
            month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
            energy_mwh REAL,
            capacity_factor_pct REAL,
            energy_price_received REAL,
            revenue_aud REAL,
            energy_charged_mwh REAL,
            energy_discharged_mwh REAL,
            avg_charge_price REAL,
            avg_discharge_price REAL,
            data_source TEXT,
            import_date TEXT DEFAULT (date('now')),
            UNIQUE(project_id, year, month)
        );

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
CREATE INDEX IF NOT EXISTS idx_league_quartile ON league_table_entries(quartile);
CREATE INDEX IF NOT EXISTS idx_league_year_tech ON league_table_entries(year, technology);

-- ============================================================
-- News
-- ============================================================

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
        );

-- ============================================================
-- Provenance & audit
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
