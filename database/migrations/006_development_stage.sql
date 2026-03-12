-- Migration 006: Add development_stage column to projects
-- Allows sub-classification of development projects:
--   planning_approved, planning_submitted, early_stage

ALTER TABLE projects ADD COLUMN development_stage TEXT
    CHECK(development_stage IN ('planning_approved','planning_submitted','early_stage'));
