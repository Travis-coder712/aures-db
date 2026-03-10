-- Migration 004: Add data_source to timeline_events
-- Tracks where each timeline event came from (manual, openelectricity, aemo, etc.)

ALTER TABLE timeline_events ADD COLUMN data_source TEXT DEFAULT 'manual';
