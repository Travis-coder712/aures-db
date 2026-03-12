-- Migration 007: Expand development_stage to include EPBC-specific stages
-- and create epbc_referrals table

-- SQLite doesn't support ALTER CHECK constraints, so we drop and recreate
-- Since development_stage already exists, we just need to update the values

-- Reclassify existing planning_approved → planning_submitted (will be re-evaluated by EPBC import)
UPDATE projects SET development_stage = 'planning_submitted'
    WHERE development_stage = 'planning_approved';

-- Create EPBC referrals table
CREATE TABLE IF NOT EXISTS epbc_referrals (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    reference_number    TEXT NOT NULL UNIQUE,
    name                TEXT NOT NULL,
    jurisdiction        TEXT,
    referral_decision   TEXT,
    status_description  TEXT,
    stage_name          TEXT,
    year                INTEGER,
    category            TEXT,
    referral_url        TEXT,
    project_id          TEXT REFERENCES projects(id),
    match_score         REAL,
    imported_at         TEXT NOT NULL DEFAULT (datetime('now'))
);
