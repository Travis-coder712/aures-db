-- ============================================================
-- Migration 003: Performance Analytics Tables
-- Phase 3: Operational performance data + league table rankings
-- ============================================================

-- Annual performance metrics per project
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

-- Pre-computed league table rankings per project per year
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
