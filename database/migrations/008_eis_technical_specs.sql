-- Migration 008: EIS / EIA Technical Specifications
-- Stores structured technical data extracted from Environmental Impact Statement
-- and Environmental Impact Assessment documents for renewable energy projects.
--
-- Covers:
--   Wind farms: turbine model, hub height, rotor diameter, wind speed data,
--               energy yield assessment (capacity factor + annual energy output),
--               noise limits, setback distances
--   BESS:       cell chemistry, cell supplier + country, inverter make/model +
--               country, PCS type (grid-forming vs grid-following),
--               round-trip efficiency, transformer rating, connection voltage
--
-- Every field includes a document reference (title + URL) for source attribution.

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

    -- ── General Notes ────────────────────────────────────────────────────────
    notes                           TEXT,

    created_at                      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_eis_project ON eis_technical_specs(project_id);
