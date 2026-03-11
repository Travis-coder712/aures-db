-- Migration 005: Add confidence_score numeric column
-- Stores raw computed score (0-100) alongside the tier in data_confidence

ALTER TABLE projects ADD COLUMN confidence_score INTEGER NOT NULL DEFAULT 0;
