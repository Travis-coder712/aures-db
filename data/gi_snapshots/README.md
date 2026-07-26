# AEMO Generation Information — snapshot archive

Each `gi-YYYY-MM.xlsx` is a copy of an AEMO NEM Generation Information
workbook release, named after the release month (e.g. `gi-2026-01.xlsx`
is the January 2026 release).

**Why archive?** AEMO removes older workbooks from their site as new
releases publish, so a reproducible re-run of `import_aemo_gen_info.py`
would silently switch to whatever release AEMO currently serves. Keeping
the workbook in git makes the full snapshot history reproducible from
any commit.

**Which files are here?** Only workbooks the importer has actually
ingested. The pattern is one file per release we've imported at least
once. Historical releases prior to AURES tracking are not backfilled
unless we deliberately do so.

**Import behaviour.** `pipeline/importers/import_aemo_gen_info.py`
prefers a file here (`gi-<snapshot>.xlsx`) over re-downloading. A fresh
download is auto-copied into this directory so future runs re-use it.

**Snapshot label** in the `aemo_generation_info.snapshot` column is
derived from the filename: `gi-2026-01.xlsx` → `snapshot='2026-01'`.
Same convention as the AEMO release page.
