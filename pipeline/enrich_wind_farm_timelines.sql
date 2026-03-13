-- ============================================================
-- Wind Farm Timeline Events Enrichment
-- Adds planning, FID, construction, energisation, COD, and
-- notable events for operating/commissioning/construction wind farms.
-- Run: sqlite3 database/aures.db < pipeline/enrich_wind_farm_timelines.sql
-- ============================================================

-- Delete existing auto-generated timeline events (keep manually curated ones)
-- We'll use data_source = 'timeline_enrichment' to tag our inserts
-- First, remove any previous enrichment pass so this is idempotent
DELETE FROM timeline_events WHERE data_source = 'timeline_enrichment';

-- ============================================================
-- SECTION 1: LARGEST OPERATING WIND FARMS (500+ MW)
-- ============================================================

-- Stockyard Hill Wind Farm (530 MW, VIC) — Goldwind, Origin Energy
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('stockyard-hill-wind-farm', '2010-06', 'month', 'planning_approved', 'Victorian planning permit granted', 'Minister for Planning approved the project for up to 149 turbines', 'timeline_enrichment'),
('stockyard-hill-wind-farm', '2017-12', 'month', 'ownership_change', 'Origin Energy acquires project', 'Origin Energy purchased the development rights from WestWind Energy', 'timeline_enrichment'),
('stockyard-hill-wind-farm', '2018-06', 'month', 'fid', 'Financial close — A$800M+', 'Origin Energy reached financial close with Goldwind as turbine supplier', 'timeline_enrichment'),
('stockyard-hill-wind-farm', '2018-09', 'month', 'construction_start', 'Construction commenced', 'Site works began with 149 Goldwind turbines planned', 'timeline_enrichment'),
('stockyard-hill-wind-farm', '2020-12', 'month', 'energisation', 'First turbines generating', 'Initial turbines connected and generating power to the grid', 'timeline_enrichment'),
('stockyard-hill-wind-farm', '2021-07-07', 'day', 'cod', 'Full commercial operations', 'All 149 turbines commissioned — largest wind farm in southern hemisphere at COD', 'timeline_enrichment');

-- Coopers Gap Wind Farm (453 MW, QLD) — GE Renewable Energy, AGL
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('coopers-gap-wind-farm', '2017-03', 'month', 'planning_approved', 'Coordinator-General approval', 'Queensland Coordinator-General approved the project', 'timeline_enrichment'),
('coopers-gap-wind-farm', '2017-06', 'month', 'planning_approved', 'Development permit granted', 'Queensland Government granted development permit', 'timeline_enrichment'),
('coopers-gap-wind-farm', '2017', 'year', 'fid', 'Financial close — PARF acquisition', 'AGL sold project to Powering Australian Renewables Fund; PPA at <$60/MWh bundled for 5 years', 'timeline_enrichment'),
('coopers-gap-wind-farm', '2018-02', 'month', 'construction_start', 'Construction commenced', 'Site works began for 123 GE turbines', 'timeline_enrichment'),
('coopers-gap-wind-farm', '2018-11', 'month', 'equipment_order', 'Turbine installation begins', 'First GE turbines installed after September 2018 delivery', 'timeline_enrichment'),
('coopers-gap-wind-farm', '2019-06-24', 'day', 'energisation', 'First turbine generates to grid', 'First of 123 turbines connected to grid', 'timeline_enrichment'),
('coopers-gap-wind-farm', '2020-04', 'month', 'notable', 'Last turbine completed', 'All 123 GE turbines erected; commissioning continued', 'timeline_enrichment'),
('coopers-gap-wind-farm', '2021-06', 'month', 'cod', 'Full commercial operations', 'Final cost A$850M (initially expected $1.2B); Queenslands largest wind farm', 'timeline_enrichment');

-- ============================================================
-- SECTION 2: LARGE OPERATING WIND FARMS (300-500 MW)
-- ============================================================

-- Macarthur Wind Farm (420 MW, VIC) — Vestas, AGL/Meridian
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('macarthur-wind-farm', '2006-10', 'month', 'planning_approved', 'Victorian Government approval', 'Planning permit granted by Victorian Government', 'timeline_enrichment'),
('macarthur-wind-farm', '2010-08', 'month', 'equipment_order', 'Vestas turbine contract signed', 'Deal for 140 Vestas V112-3.0 MW turbines cemented', 'timeline_enrichment'),
('macarthur-wind-farm', '2010-10', 'quarter', 'construction_start', 'Construction commenced', 'Site clearance and civil works began Q4 2010', 'timeline_enrichment'),
('macarthur-wind-farm', '2011-11', 'month', 'notable', 'First turbine erected', 'First of 140 turbines physically erected on site', 'timeline_enrichment'),
('macarthur-wind-farm', '2012-09', 'month', 'energisation', 'First turbines connected to grid', 'Initial turbines began generating electricity', 'timeline_enrichment'),
('macarthur-wind-farm', '2013-01', 'month', 'cod', 'Full commercial operations', 'A$1B project completed 3 months ahead of schedule; largest wind farm in southern hemisphere at the time', 'timeline_enrichment');

-- Rye Park Wind Farm (396 MW, NSW) — Vestas, Tilt Renewables
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('rye-park-wind-farm', '2014', 'year', 'ownership_change', 'Tilt Renewables acquires project', 'Tilt Renewables acquired development rights from Epuron', 'timeline_enrichment'),
('rye-park-wind-farm', '2017-05', 'month', 'planning_approved', 'NSW planning approval', 'Development consent granted for up to 92 turbines', 'timeline_enrichment'),
('rye-park-wind-farm', '2021-04', 'month', 'planning_modified', 'Modified development consent', 'Updated consent reflecting design changes', 'timeline_enrichment'),
('rye-park-wind-farm', '2021-06', 'month', 'planning_approved', 'EPBC federal approval', 'Commonwealth EPBC Act approval received', 'timeline_enrichment'),
('rye-park-wind-farm', '2021-09', 'month', 'equipment_order', 'Vestas and Zenviron contracts', 'Vestas contracted for turbine supply/install; Zenviron awarded A$250M BoP contract', 'timeline_enrichment'),
('rye-park-wind-farm', '2021-12-01', 'day', 'construction_start', 'Construction commenced', 'Construction began 1 December 2021', 'timeline_enrichment'),
('rye-park-wind-farm', '2024-10-07', 'day', 'cod', 'Full commercial operations', 'All turbines commissioned and generating', 'timeline_enrichment');

-- Dundonnell Wind Farm (336 MW, VIC) — Vestas, Tilt Renewables
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('dundonnell-wind-farm', '2013-01', 'month', 'notable', 'EES required', 'Minister for Planning determined Environment Effects Statement required', 'timeline_enrichment'),
('dundonnell-wind-farm', '2016-02', 'month', 'planning_approved', 'EES assessment completed', 'Minister released assessment under Environment Effects Act 1978', 'timeline_enrichment'),
('dundonnell-wind-farm', '2018-09', 'month', 'notable', 'VREAS auction winner', 'Selected as one of six winners of Victorian Renewable Energy Auction Scheme', 'timeline_enrichment'),
('dundonnell-wind-farm', '2018-10', 'month', 'fid', 'Final investment decision', 'Tilt Renewables made final investment decision on the $560M project', 'timeline_enrichment'),
('dundonnell-wind-farm', '2018-11', 'month', 'fid', 'Financial close', 'Project financing completed', 'timeline_enrichment'),
('dundonnell-wind-farm', '2019-01', 'month', 'construction_start', 'Construction commenced', 'Construction began for 80 Vestas turbines', 'timeline_enrichment'),
('dundonnell-wind-farm', '2020-09', 'month', 'cod', 'Full commercial operations', '80 Vestas turbines fully commissioned', 'timeline_enrichment');

-- Moorabool Wind Farm (305 MW, VIC) — Goldwind
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('moorabool-wind-farm', '2007', 'year', 'conceived', 'Site investigations begin', 'WestWind Energy began site investigations', 'timeline_enrichment'),
('moorabool-wind-farm', '2010-10', 'month', 'planning_approved', 'Victorian planning permit', 'Minister for Planning issued permit for up to 107 turbines', 'timeline_enrichment'),
('moorabool-wind-farm', '2016-09', 'month', 'ownership_change', 'Goldwind acquires project', 'Goldwind Australia purchased development from WestWind Energy', 'timeline_enrichment'),
('moorabool-wind-farm', '2018-07', 'month', 'construction_start', 'Construction commenced', 'Goldwind began construction as EPC contractor', 'timeline_enrichment'),
('moorabool-wind-farm', '2020', 'year', 'energisation', 'Partial operation begins', 'First turbines connected to Victorian transmission network', 'timeline_enrichment'),
('moorabool-wind-farm', '2022-06', 'month', 'cod', 'Full commissioning complete', '104 of 107 approved turbines erected and commissioned; Goldwind 51%, Nebras Power 49%', 'timeline_enrichment');

-- Berrybank Wind Farm (281.1 MW, VIC)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('berrybank-wind-farm', '2018-09', 'month', 'notable', 'VREAS auction winner', 'Selected as winner of Victorian Renewable Energy Auction Scheme', 'timeline_enrichment'),
('berrybank-wind-farm', '2019', 'year', 'construction_start', 'Construction commenced', 'Site works began for Stage 1 and Stage 2', 'timeline_enrichment'),
('berrybank-wind-farm', '2021-02-15', 'day', 'cod', 'Full commercial operations', 'All turbines commissioned', 'timeline_enrichment');

-- Sapphire Wind Farm (270 MW, NSW) — Vestas, CWP Renewables
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('sapphire-wind-farm', '2016-12', 'month', 'fid', 'Financial close — A$600M', 'CWP Renewables reached financial closure for A$600M project', 'timeline_enrichment'),
('sapphire-wind-farm', '2017-01', 'month', 'construction_start', 'Construction commenced', 'Site works began near Inverell NSW', 'timeline_enrichment'),
('sapphire-wind-farm', '2017-04', 'month', 'notable', 'First foundation laid', 'First turbine foundation poured', 'timeline_enrichment'),
('sapphire-wind-farm', '2017-10', 'month', 'equipment_order', 'Turbine erection begins', 'Vestas turbine erection commenced on site', 'timeline_enrichment'),
('sapphire-wind-farm', '2017-12', 'month', 'commissioning', 'Commissioning begins', 'First turbines enter commissioning phase', 'timeline_enrichment'),
('sapphire-wind-farm', '2018-02', 'month', 'energisation', 'Grid commissioning', 'Wind farm began grid commissioning', 'timeline_enrichment'),
('sapphire-wind-farm', '2018-11', 'month', 'cod', 'Full commercial operations', 'All 75 Vestas V126-3.6 MW turbines fully commissioned', 'timeline_enrichment');

-- Snowtown S2 Wind Farm (270 MW, SA) — Siemens, TrustPower
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('snowtown-s2-wind-farm', '2012-10', 'month', 'construction_start', 'Construction commenced', 'Stage 2 construction began for 90 Siemens turbines', 'timeline_enrichment'),
('snowtown-s2-wind-farm', '2014-06', 'month', 'cod', 'Full commercial operations', 'All 90 Stage 2 turbines commissioned', 'timeline_enrichment');

-- Ararat Wind Farm (240 MW, VIC) — GE, RES Group
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('ararat-wind-farm', '2010', 'year', 'planning_approved', 'Victorian planning permit', 'Planning permit granted for wind farm near Ararat', 'timeline_enrichment'),
('ararat-wind-farm', '2014-10', 'month', 'fid', 'Financial close', 'RES Group reached financial close on the A$450M project', 'timeline_enrichment'),
('ararat-wind-farm', '2014-11', 'month', 'construction_start', 'Construction commenced', 'Site works began for 75 GE 3.2 MW turbines', 'timeline_enrichment'),
('ararat-wind-farm', '2016-08-18', 'day', 'cod', 'Full commercial operations', 'All 75 turbines commissioned; Victorias largest wind farm at the time', 'timeline_enrichment');

-- ============================================================
-- SECTION 3: MEDIUM OPERATING WIND FARMS (200-300 MW)
-- ============================================================

-- Murra Warra Wind Farm Stage 1 (225.7 MW, VIC) — Vestas
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('murra-warra-wind-farm-stage-1', '2018', 'year', 'construction_start', 'Construction commenced', 'RES Group began construction of Stage 1', 'timeline_enrichment'),
('murra-warra-wind-farm-stage-1', '2019-04-08', 'day', 'cod', 'Full commercial operations', 'All 61 Vestas V136-3.6 MW turbines commissioned', 'timeline_enrichment');

-- Collector Wind Farm (219 MW, NSW) — Vestas
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('collector', '2018', 'year', 'construction_start', 'Construction commenced', 'RATCH-Australia began construction', 'timeline_enrichment'),
('collector', '2020-11-12', 'day', 'cod', 'Full commercial operations', '54 Vestas turbines commissioned near Collector NSW', 'timeline_enrichment');

-- Ryan Corner Wind Farm (218 MW, VIC)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('ryan-corner-wind-farm', '2022', 'year', 'construction_start', 'Construction commenced', 'WestWind Energy began construction in western Victoria', 'timeline_enrichment'),
('ryan-corner-wind-farm', '2024-07-29', 'day', 'cod', 'Full commercial operations', 'All turbines commissioned', 'timeline_enrichment');

-- Port Augusta Renewable Energy Park - Wind (210 MW, SA) — Vestas
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('port-augusta-renewable-energy-park-wind', '2019', 'year', 'fid', 'Financial close', 'DP Energy / Iberdrola reached financial close', 'timeline_enrichment'),
('port-augusta-renewable-energy-park-wind', '2020', 'year', 'construction_start', 'Construction commenced', 'Site works began for 50 Vestas turbines near Port Augusta', 'timeline_enrichment'),
('port-augusta-renewable-energy-park-wind', '2022-04-19', 'day', 'cod', 'Full commercial operations', 'All 50 Vestas V136-4.2 MW turbines commissioned', 'timeline_enrichment');

-- Goyder South Wind Farm 1A (209 MW, SA) — Vestas, Neoen
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('goyder-south-wind-farm-1a', '2021', 'year', 'fid', 'Financial close', 'Neoen reached financial close for Goyder South Stage 1A', 'timeline_enrichment'),
('goyder-south-wind-farm-1a', '2022', 'year', 'construction_start', 'Construction commenced', 'Construction began for Vestas turbines', 'timeline_enrichment'),
('goyder-south-wind-farm-1a', '2024-04-04', 'day', 'cod', 'Full commercial operations', 'Goyder South 1A fully commissioned in Mid North SA', 'timeline_enrichment');

-- Goyder South Wind Farm 1B (203.5 MW, SA)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('goyder-south-wind-farm-1b', '2023', 'year', 'construction_start', 'Construction commenced', 'Stage 1B construction began', 'timeline_enrichment'),
('goyder-south-wind-farm-1b', '2025-07-02', 'day', 'cod', 'Full commercial operations', 'Stage 1B fully commissioned', 'timeline_enrichment');

-- Murra Warra Wind Farm Stage 2 (209 MW, VIC)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('murra-warra-wind-farm-stage-2', '2019', 'year', 'construction_start', 'Construction commenced', 'Stage 2 construction began alongside Stage 1 completion', 'timeline_enrichment'),
('murra-warra-wind-farm-stage-2', '2019-04-08', 'day', 'cod', 'Full commercial operations', 'Stage 2 turbines commissioned', 'timeline_enrichment');

-- Silverton Wind Farm (200 MW, NSW) — GE, AGL
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('silverton-wind-farm', '2016', 'year', 'fid', 'Financial close', 'AGL reached financial close on the project', 'timeline_enrichment'),
('silverton-wind-farm', '2017', 'year', 'construction_start', 'Construction commenced', 'Construction began near Broken Hill NSW', 'timeline_enrichment'),
('silverton-wind-farm', '2018-05-14', 'day', 'cod', 'Full commercial operations', '58 GE turbines commissioned in western NSW', 'timeline_enrichment');

-- Bulgana Green Power Hub (194 MW, VIC) — Vestas
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('bulgana-green-power-hub-wind-farm', '2018', 'year', 'fid', 'Financial close', 'Neoen reached financial close for wind+battery hybrid project', 'timeline_enrichment'),
('bulgana-green-power-hub-wind-farm', '2019', 'year', 'construction_start', 'Construction commenced', 'Construction began for 56 Vestas turbines + 20 MW/34 MWh battery', 'timeline_enrichment'),
('bulgana-green-power-hub-wind-farm', '2020-05-13', 'day', 'cod', 'Full commercial operations', 'Wind farm and battery fully commissioned; PPA with Nectar Farms', 'timeline_enrichment');

-- Waubra Wind Farm (192 MW, VIC) — Acciona
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('waubra', '2007', 'year', 'construction_start', 'Construction commenced', 'Acciona began construction of 128 turbines', 'timeline_enrichment'),
('waubra', '2009-06-30', 'day', 'cod', 'Commercial operations commenced', 'A$450M project; 128 Acciona AW-1500/77 turbines; Australias largest wind farm at completion', 'timeline_enrichment');

-- ============================================================
-- SECTION 4: MEDIUM OPERATING WIND FARMS (150-200 MW)
-- ============================================================

-- Dulacca Wind Farm (180.6 MW, QLD) — Vestas, RES/Octopus
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('dulacca-wind-farm', '2021-08', 'month', 'ownership_change', 'Octopus acquires from RES', 'Octopus Investments Australia acquired the project from RES', 'timeline_enrichment'),
('dulacca-wind-farm', '2021', 'year', 'construction_start', 'Construction commenced', 'Construction began for 43 Vestas V150-4.2 MW turbines', 'timeline_enrichment'),
('dulacca-wind-farm', '2023-04-12', 'day', 'cod', 'Commercial operations commenced', '43 Vestas turbines commissioned; Australias tallest turbines at time of construction', 'timeline_enrichment'),
('dulacca-wind-farm', '2023-10-18', 'day', 'notable', 'Official opening', 'Dulacca Wind Farm officially opened', 'timeline_enrichment');

-- Mount Emerald Wind Farm (180.5 MW, QLD) — Vestas, RATCH
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('mount-emerald', '2016', 'year', 'construction_start', 'Construction commenced', 'RATCH-Australia began construction on Atherton Tablelands', 'timeline_enrichment'),
('mount-emerald', '2018-08', 'month', 'energisation', 'First grid output', 'Initial turbines connected and generating', 'timeline_enrichment'),
('mount-emerald', '2019-01', 'month', 'cod', 'Full commercial operations', 'A$380M project; 53 Vestas V117-3.45 MW turbines; Queenslands largest wind farm at commissioning', 'timeline_enrichment');

-- White Rock Wind Farm Stage 1 (175 MW, NSW) — Goldwind
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('white-rock-wind-farm-stage-1', '2012-07', 'month', 'planning_approved', 'NSW planning approval', 'Original planning approval granted', 'timeline_enrichment'),
('white-rock-wind-farm-stage-1', '2014-10', 'month', 'ownership_change', 'Goldwind acquires from Epuron', 'Goldwind Australia acquired development rights', 'timeline_enrichment'),
('white-rock-wind-farm-stage-1', '2016-04', 'month', 'construction_start', 'Construction commenced', 'Construction began for 70 Goldwind GW121/2500 turbines near Glen Innes', 'timeline_enrichment'),
('white-rock-wind-farm-stage-1', '2017-07-07', 'day', 'cod', 'Full commercial operations', '70 Goldwind PMDD turbines commissioned', 'timeline_enrichment');

-- Musselroe Wind Farm (168 MW, TAS) — Vestas
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('musselroe-wind-farm', '2012', 'year', 'construction_start', 'Construction commenced', 'Roaring 40s JV began construction at Cape Portland', 'timeline_enrichment'),
('musselroe-wind-farm', '2013', 'year', 'energisation', 'First 37 turbines connected', 'Initial turbines generating to grid', 'timeline_enrichment'),
('musselroe-wind-farm', '2014-01', 'month', 'cod', 'Full commercial operations', '56 Vestas V90-3.0 MW turbines; 17.5-year offtake with Hydro Tasmania', 'timeline_enrichment');

-- Gullen Range Wind Farm (165.5 MW, NSW) — Goldwind
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('gullen-range-wind-farm', '2012', 'year', 'construction_start', 'Construction commenced', 'Goldwind began construction for 73 turbines', 'timeline_enrichment'),
('gullen-range-wind-farm', '2014-12', 'month', 'cod', 'Full commercial operations', '73 Goldwind turbines (56 x GW100/2500 + 17 x GW82/1500); Goldwinds largest overseas project at the time', 'timeline_enrichment');

-- Bango 973 + 999 Wind Farms (NSW)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('bango-973-wind-farm', '2019', 'year', 'construction_start', 'Construction commenced', 'CWP Renewables began construction near Boorowa NSW', 'timeline_enrichment'),
('bango-999-wind-farm', '2019', 'year', 'construction_start', 'Construction commenced', 'CWP Renewables began construction near Boorowa NSW', 'timeline_enrichment');

-- Lake Bonney 2 Wind Farm (159 MW, SA) — Vestas
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('lake-bonney-2-wind-farm', '2006-11', 'month', 'construction_start', 'Construction commenced', 'Babcock & Brown began Stage 2 construction', 'timeline_enrichment'),
('lake-bonney-2-wind-farm', '2008-04', 'month', 'cod', 'Commercial operations commenced', '53 Vestas V90-3.0 MW turbines; PPA with AGL', 'timeline_enrichment');

-- ============================================================
-- SECTION 5: MEDIUM-SMALL OPERATING WIND FARMS (100-160 MW)
-- ============================================================

-- Mortlake South Wind Farm (157.5 MW, VIC) — Nordex, Acciona
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('mortlake-south-wind-farm', '2010-10', 'month', 'planning_approved', 'Original planning permit', 'Minister for Planning approved 52 turbines', 'timeline_enrichment'),
('mortlake-south-wind-farm', '2017-04', 'month', 'planning_modified', 'Amended permit — larger turbines', 'Permit amended for fewer but larger modern turbines', 'timeline_enrichment'),
('mortlake-south-wind-farm', '2018-09', 'month', 'notable', 'VRET auction winner', 'Selected as winner of Victorian Renewable Energy Target reverse auction', 'timeline_enrichment'),
('mortlake-south-wind-farm', '2019-03-04', 'day', 'construction_start', 'Construction commenced', 'A$275M project; 35 Nordex N149/4.5 MW turbines + battery', 'timeline_enrichment'),
('mortlake-south-wind-farm', '2023-07', 'month', 'cod', 'Full commercial operations', 'Acciona 5th Australian wind farm; includes Victorias first underground transmission line', 'timeline_enrichment');

-- Kaban Wind Farm (152 MW, QLD) — Vestas, Neoen
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('kaban-wind-farm', '2018-05', 'month', 'planning_approved', 'QLD development approval', 'State Development department granted approval for Kaban Green Power Hub', 'timeline_enrichment'),
('kaban-wind-farm', '2021-05', 'month', 'fid', 'Financial close — A$373M', 'Neoen completed financing; Vestas contracted for EPC', 'timeline_enrichment'),
('kaban-wind-farm', '2021-06', 'month', 'construction_start', 'Construction commenced', 'Civil works began; 21-month construction program', 'timeline_enrichment'),
('kaban-wind-farm', '2022-01', 'month', 'equipment_order', 'Turbine components arrive', 'Vestas V162-5.6 MW components arrive at Port of Cairns', 'timeline_enrichment'),
('kaban-wind-farm', '2022-10', 'month', 'energisation', 'First power generated', 'First project in Queenslands first REZ to generate power', 'timeline_enrichment'),
('kaban-wind-farm', '2023', 'year', 'cod', 'Full commercial operations', '28 Vestas V162-5.6 MW turbines; includes BESS + 320km transmission upgrade', 'timeline_enrichment');

-- Portland Wind Farm (151.7 MW, VIC) — Mixed OEMs, Pacific Hydro
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('portland-wind-farm', '2001', 'year', 'cod', 'Stage 1 (Yambuk) operational', '20 x Bonus 1.5 MW turbines at Yambuk site — 30 MW', 'timeline_enrichment'),
('portland-wind-farm', '2008', 'year', 'cod', 'Stage 2 (Cape Bridgewater) operational', '29 x REpower MM82/2.05 MW turbines — 58 MW', 'timeline_enrichment'),
('portland-wind-farm', '2009', 'year', 'cod', 'Stage 3 (Cape Nelson South) operational', '22 x REpower MM82/2.05 MW turbines — 44 MW', 'timeline_enrichment'),
('portland-wind-farm', '2010', 'year', 'cod', 'Stage 4 (Cape Nelson North) operational', '23 x REpower MM92/2.05 MW turbines — 47 MW; A$330M total project cost', 'timeline_enrichment');

-- Flyers Creek Wind Farm (145.5 MW, NSW) — GE, Iberdrola
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('flyers-creek-wind-farm', '2012', 'year', 'planning_approved', 'NSW development approval', 'Original planning approval granted but project shelved', 'timeline_enrichment'),
('flyers-creek-wind-farm', '2022-03', 'month', 'construction_start', 'Construction commenced', 'Iberdrola revived project; 38 GE 3.8 MW turbines; 230 construction jobs', 'timeline_enrichment'),
('flyers-creek-wind-farm', '2023-09', 'month', 'energisation', 'First turbines generating', 'Initial 3 turbines complete and generating; 18 more mechanically installed', 'timeline_enrichment'),
('flyers-creek-wind-farm', '2023-09-19', 'day', 'cod', 'Full commercial operations', 'All 38 GE Cypress turbines commissioned near Orange NSW', 'timeline_enrichment');

-- Yendon Wind Farm (142 MW, VIC) — Vestas (part of Lal Lal)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('yendon-wind-farm', '2017-05', 'month', 'ownership_change', 'Macquarie Capital acquires from WestWind', 'Macquarie Capital purchased Lal Lal Wind Farms from WestWind Energy', 'timeline_enrichment'),
('yendon-wind-farm', '2018', 'year', 'construction_start', 'Construction commenced', 'Zenviron construction; Vestas V136-3.8 MW turbine supply; RES managing build', 'timeline_enrichment'),
('yendon-wind-farm', '2020-06', 'month', 'cod', 'Full commercial operations', '38 Vestas turbines; PPA with Orora Packaging; innovative proxy revenue swap financing', 'timeline_enrichment');

-- Capital Wind Farm (140.7 MW, NSW) — Suzlon, Infigen
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('capital-wind-farm', '2008', 'year', 'construction_start', 'Construction commenced', 'Infigen Energy began construction; Suzlon EPC contractor', 'timeline_enrichment'),
('capital-wind-farm', '2009-10', 'month', 'cod', 'Commercial operations commenced', '67 Suzlon S88/2.1 MW turbines; opened by PM Kevin Rudd; 30 km NE of Canberra', 'timeline_enrichment'),
('capital-wind-farm', '2020', 'year', 'ownership_change', 'Iberdrola acquires Infigen', 'Iberdrola Australia acquired project through takeover of Infigen Energy', 'timeline_enrichment');

-- Woolnorth Studland Bay / Bluff Point (138 MW, TAS) — Vestas
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('woolnorth-studland-bay-bluff-point', '2002', 'year', 'cod', 'Bluff Point Stage 1 operational', 'First Vestas V66/1.75 MW turbines at NW Tasmania', 'timeline_enrichment'),
('woolnorth-studland-bay-bluff-point', '2004', 'year', 'cod', 'Bluff Point Stage 2 complete', '36 Vestas V66/1.75 MW turbines — 63 MW total', 'timeline_enrichment'),
('woolnorth-studland-bay-bluff-point', '2007', 'year', 'cod', 'Studland Bay operational', '25 Vestas V90-3.0 MW turbines — 75 MW; total complex 138 MW', 'timeline_enrichment');

-- Cattle Hill Wind Farm (144 MW, TAS) — Goldwind
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('cattle-hill-wind-farm', '2017', 'year', 'offtake_signed', 'Aurora Energy PPA', 'Long-term agreement with Aurora Energy for RECs', 'timeline_enrichment'),
('cattle-hill-wind-farm', '2018', 'year', 'construction_start', 'Construction commenced', 'Goldwind/PowerChina began construction at Lake Echo', 'timeline_enrichment'),
('cattle-hill-wind-farm', '2019-11', 'month', 'commissioning', 'Commissioning begins', 'First turbines enter commissioning', 'timeline_enrichment'),
('cattle-hill-wind-farm', '2020-08', 'month', 'cod', 'Full commercial operations', '48 Goldwind GW140/3S turbines; 170m tip height', 'timeline_enrichment');

-- Hallett Stage 1 Brown Hill (133 MW, SA) — Suzlon, AGL
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('hallett-stage-1-brown-hill', '2007', 'year', 'construction_start', 'Construction commenced', 'AGL/Wind Prospect began construction; Suzlon EPC', 'timeline_enrichment'),
('hallett-stage-1-brown-hill', '2008-06', 'month', 'cod', 'Commercial operations commenced', '45 Suzlon S88/2.1 MW turbines; first of the Hallett complex', 'timeline_enrichment');

-- Hallett 4 North Brown Hill (132.3 MW, SA) — Suzlon, AGL
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('hallett-4-north-brown-hill', '2009', 'year', 'construction_start', 'Construction commenced', 'A$334M project; AGL/Suzlon construction', 'timeline_enrichment'),
('hallett-4-north-brown-hill', '2010-08', 'month', 'energisation', 'First power generated', 'Initial turbines connected to grid', 'timeline_enrichment'),
('hallett-4-north-brown-hill', '2011', 'year', 'cod', 'Full commercial operations', '63 Suzlon S88/2.1 MW turbines; 25-year PPA with AGL; largest of four Hallett stages', 'timeline_enrichment');

-- Mt Gellibrand Wind Farm (132 MW, VIC) — Nordex, Acciona
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('mt-gellibrand-wind-farm', '2017-04', 'month', 'construction_start', 'Construction commenced', 'Acciona began construction; Nordex turbine supply', 'timeline_enrichment'),
('mt-gellibrand-wind-farm', '2018-06', 'month', 'energisation', 'First electricity generated', 'Initial Nordex AW125/3000 turbines connected', 'timeline_enrichment'),
('mt-gellibrand-wind-farm', '2018-08', 'month', 'cod', 'Full commercial operations', '44 Nordex AW125/3.0 MW turbines; PPA with Viva Energy for Geelong refinery', 'timeline_enrichment');

-- Mt Mercer Wind Farm (131.2 MW, VIC) — Senvion
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('mt-mercer-wind-farm', '2009', 'year', 'ownership_change', 'Meridian Energy acquires project', 'Meridian Energy purchased from WestWind Energy', 'timeline_enrichment'),
('mt-mercer-wind-farm', '2012', 'year', 'construction_start', 'Construction commenced', 'A$260M project; Senvion turbines; Downer EDI A$70M civil/electrical', 'timeline_enrichment'),
('mt-mercer-wind-farm', '2013-11', 'month', 'energisation', 'First power generated', 'Initial turbines connected to grid', 'timeline_enrichment'),
('mt-mercer-wind-farm', '2014-09', 'month', 'cod', 'Full commercial operations', '64 Senvion MM92/2.05 MW turbines in Golden Plains Shire', 'timeline_enrichment');

-- Waterloo Wind Farm (130.8 MW, SA) — Vestas
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('waterloo-wind-farm', '2009', 'year', 'construction_start', 'Stage 1 construction commenced', 'Roaring 40s JV began construction; A$300M Stage 1', 'timeline_enrichment'),
('waterloo-wind-farm', '2010-10', 'month', 'cod', 'Stage 1 operational', '37 Vestas V90-3.0 MW turbines; 111 MW Stage 1', 'timeline_enrichment'),
('waterloo-wind-farm', '2017', 'year', 'expansion', 'Stage 2 extension complete', '6 Vestas V117-3.3 MW turbines added; total 130.8 MW', 'timeline_enrichment');

-- Lincoln Gap Wind Farm Stage 1 (126 MW, SA) — Senvion
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('lincoln-gap-wind-farm-stage-1', '2018', 'year', 'construction_start', 'Construction commenced', 'Nexif Energy began construction near Port Augusta', 'timeline_enrichment'),
('lincoln-gap-wind-farm-stage-1', '2019-04-30', 'day', 'cod', 'Commercial operations commenced', '35 Senvion 3.6M140 turbines commissioned', 'timeline_enrichment');

-- Lincoln Gap Wind Farm Stage 2 (86 MW, SA)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('lincoln-gap-wind-farm-stage-2', '2018', 'year', 'construction_start', 'Construction commenced', 'Stage 2 construction alongside Stage 1', 'timeline_enrichment'),
('lincoln-gap-wind-farm-stage-2', '2019-04-30', 'day', 'cod', 'Commercial operations commenced', 'Stage 2 turbines commissioned alongside Stage 1', 'timeline_enrichment');

-- Willogoleche Wind Farm (119.76 MW, SA) — GE, ENGIE
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('willogoleche-wind-farm', '2008', 'year', 'ownership_change', 'ENGIE acquires development', 'ENGIE purchased development rights from Wind Prospect', 'timeline_enrichment'),
('willogoleche-wind-farm', '2017-08', 'month', 'fid', 'Financial close — A$250M', 'CIC and Natixis underwriting A$250M debt facility', 'timeline_enrichment'),
('willogoleche-wind-farm', '2018', 'year', 'construction_start', 'Construction commenced', 'First large-scale Australian deployment of GE 3.8 MW onshore turbines', 'timeline_enrichment'),
('willogoleche-wind-farm', '2019-07-30', 'day', 'cod', 'Full commercial operations', '32 GE 3.8 MW turbines; ENGIE/Mitsui JV; offtake to Simply Energy', 'timeline_enrichment');

-- Boco Rock Wind Farm (113 MW, NSW)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('boco-rock-wind-farm', '2012', 'year', 'construction_start', 'Construction commenced', 'CWP Renewables began construction near Nimmitabel', 'timeline_enrichment'),
('boco-rock-wind-farm', '2014-08-28', 'day', 'cod', 'Commercial operations commenced', '67 turbines commissioned in southern NSW', 'timeline_enrichment');

-- Bodangora Wind Farm (111.3 MW, NSW) — GE
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('bodangora-wind-farm', '2017', 'year', 'construction_start', 'Construction commenced', 'Infigen Energy began construction near Wellington NSW', 'timeline_enrichment'),
('bodangora-wind-farm', '2018-08-07', 'day', 'cod', 'Commercial operations commenced', '33 GE 3.4 MW turbines commissioned', 'timeline_enrichment');

-- Granville Harbour Wind Farm (111 MW, TAS)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('granville-harbour-wind-farm', '2018', 'year', 'construction_start', 'Construction commenced', 'Palisade Investment Partners began construction on west coast of Tasmania', 'timeline_enrichment'),
('granville-harbour-wind-farm', '2020-01-27', 'day', 'cod', 'Commercial operations commenced', '31 Vestas V126-3.6 MW turbines; one of Tasmanias windiest sites', 'timeline_enrichment');

-- Hornsdale Wind Farm Stages 1-3 (SA)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('hornsdale-wind-farm-stage-1', '2015', 'year', 'fid', 'Financial close', 'Neoen reached financial close on ACT reverse auction contract', 'timeline_enrichment'),
('hornsdale-wind-farm-stage-1', '2015', 'year', 'construction_start', 'Construction commenced', 'Construction began for 32 Siemens SWT-3.15-113 turbines', 'timeline_enrichment'),
('hornsdale-wind-farm-stage-2', '2016', 'year', 'construction_start', 'Construction commenced', 'Stage 2 construction began', 'timeline_enrichment'),
('hornsdale-wind-farm-stage-2', '2017-02-21', 'day', 'cod', 'Stage 2 commercial operations', 'Stage 2 fully commissioned', 'timeline_enrichment'),
('hornsdale-wind-farm-stage-3', '2016', 'year', 'construction_start', 'Construction commenced', 'Stage 3 construction began', 'timeline_enrichment'),
('hornsdale-wind-farm-stage-3', '2017-08-07', 'day', 'cod', 'Stage 3 commercial operations', 'Stage 3 fully commissioned; total Hornsdale complex 309 MW', 'timeline_enrichment');

-- Crudine Ridge Wind Farm (138 MW, NSW) — GE, CWP
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('crudine-ridge-wind-farm', '2019', 'year', 'fid', 'Financial close — A$250M', 'CEFC financing; Zenviron/GE consortium A$200M EPC contract', 'timeline_enrichment'),
('crudine-ridge-wind-farm', '2020', 'year', 'construction_start', 'Construction commenced', '37 GE 3.63 MW turbines; 45 km south of Mudgee', 'timeline_enrichment'),
('crudine-ridge-wind-farm', '2021-02', 'month', 'notable', 'BoP completed', 'Balance of plant civil and electrical works finished', 'timeline_enrichment'),
('crudine-ridge-wind-farm', '2022-02', 'month', 'cod', 'Full commercial operations', 'All 37 turbines commissioned; PPA with Meridian Energy and Origin', 'timeline_enrichment');

-- ============================================================
-- SECTION 6: SMALLER OPERATING WIND FARMS (<110 MW)
-- ============================================================

-- Taralga Wind Farm (106.8 MW, NSW) — Pacific Hydro
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('taralga-wind-farm', '2006-01', 'month', 'planning_approved', 'NSW state approval', 'Approval granted 17 January 2006 for 61 turbines', 'timeline_enrichment'),
('taralga-wind-farm', '2007-02', 'month', 'notable', 'Land & Environment Court determination', 'Approval upheld after appeal to NSW L&E Court', 'timeline_enrichment'),
('taralga-wind-farm', '2012-02', 'month', 'construction_start', 'Construction commenced', 'Approval for works; modified to 51 turbines with larger capacity', 'timeline_enrichment'),
('taralga-wind-farm', '2015', 'year', 'cod', 'Commercial operations commenced', '51 turbines; owned by Pacific Blue (formerly Pacific Hydro)', 'timeline_enrichment');

-- Bald Hills Wind Farm (106 MW, VIC) — Senvion, Mitsui
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('bald-hills-wind-farm', '2006-06', 'month', 'notable', 'Federal approval refused', 'Environment Minister Ian Campbell refused EPBC approval citing migratory birds', 'timeline_enrichment'),
('bald-hills-wind-farm', '2006-12', 'month', 'planning_approved', 'Revised federal approval', 'EPBC approval granted after Federal Court challenge and project modifications', 'timeline_enrichment'),
('bald-hills-wind-farm', '2012-08', 'month', 'construction_start', 'Construction commenced', 'Mitsui commenced construction; VCAT ordered approval of development plans', 'timeline_enrichment'),
('bald-hills-wind-farm', '2015-05', 'month', 'cod', 'Full commercial operations', '52 x Senvion MM82/2.05 MW turbines in South Gippsland', 'timeline_enrichment');

-- Snowtown Wind Farm Stage 1 (98.7 MW, SA) — Suzlon
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('snowtown-wind-farm', '2004-01', 'month', 'planning_approved', 'Planning approval', 'Wakefield Regional Council approved construction', 'timeline_enrichment'),
('snowtown-wind-farm', '2006-04', 'month', 'construction_start', 'Stage 1 construction commenced', 'TrustPower began construction', 'timeline_enrichment'),
('snowtown-wind-farm', '2007-12', 'month', 'energisation', 'First power to grid', 'First turbines generating to public grid', 'timeline_enrichment'),
('snowtown-wind-farm', '2008-10', 'month', 'cod', 'Stage 1 substantially complete', '47 turbines operational (1 more added 2011)', 'timeline_enrichment');

-- Crookwell 2 Wind Farm (91 MW, NSW)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('crookwell-2-wind-farm', '2009', 'year', 'construction_start', 'Construction commenced', 'Global Power Generation began construction; A$200M project', 'timeline_enrichment'),
('crookwell-2-wind-farm', '2017', 'year', 'planning_modified', 'Turbine modification approved', 'Hub height increased 80→95m; rotor diameter 96→130m', 'timeline_enrichment'),
('crookwell-2-wind-farm', '2018-11', 'month', 'cod', 'Commercial operations commenced', '28 turbines; 92 MW commissioned', 'timeline_enrichment');

-- Hallett Stage 2 Hallett Hill (71 MW, SA)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('hallett-stage-2-hallett-hill', '2008', 'year', 'construction_start', 'Construction commenced', 'AGL/Wind Prospect began Stage 2 construction', 'timeline_enrichment'),
('hallett-stage-2-hallett-hill', '2009-05-12', 'day', 'cod', 'Commercial operations commenced', 'Second stage of Hallett complex commissioned', 'timeline_enrichment');

-- Hallett 5 The Bluff (53 MW, SA)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('hallett-5-the-bluff-wf', '2010', 'year', 'construction_start', 'Construction commenced', 'AGL began Stage 5 construction', 'timeline_enrichment'),
('hallett-5-the-bluff-wf', '2011-07-05', 'day', 'cod', 'Commercial operations commenced', 'Final stage of the Hallett wind farm complex', 'timeline_enrichment');

-- Cherry Tree Wind Farm (57.6 MW, VIC)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('cherry-tree-wind-farm', '2019', 'year', 'construction_start', 'Construction commenced', 'OSMI began construction near Seymour', 'timeline_enrichment'),
('cherry-tree-wind-farm', '2020-05-01', 'day', 'cod', 'Commercial operations commenced', '16 Goldwind GW140/3.57 MW turbines', 'timeline_enrichment');

-- Woodlawn Wind Farm (48.3 MW, NSW)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('woodlawn-wind-farm', '2010', 'year', 'construction_start', 'Construction commenced', 'Infigen Energy began construction near Tarago NSW', 'timeline_enrichment'),
('woodlawn-wind-farm', '2011-05-31', 'day', 'cod', 'Commercial operations commenced', '23 Suzlon S88/2.1 MW turbines; adjacent to former mine site', 'timeline_enrichment');

-- Gunning Wind Farm (46.5 MW, NSW)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('gunning-wind-farm', '2010', 'year', 'construction_start', 'Construction commenced', 'Acciona began construction near Gunning NSW', 'timeline_enrichment'),
('gunning-wind-farm', '2011-04-04', 'day', 'cod', 'Commercial operations commenced', '31 Acciona AW-1500/77 turbines', 'timeline_enrichment');

-- Oaklands Hill Wind Farm (68 MW, VIC)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('oaklands-hill-wind-farm', '2010', 'year', 'construction_start', 'Construction commenced', 'Hydro Tasmania/Shenhua JV began construction', 'timeline_enrichment'),
('oaklands-hill-wind-farm', '2011-08-24', 'day', 'cod', 'Commercial operations commenced', '32 Suzlon S88/2.1 MW turbines', 'timeline_enrichment');

-- Crowlands Wind Farm (79.95 MW, VIC)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('crowlands-wind-farm', '2017', 'year', 'construction_start', 'Construction commenced', 'Pacific Hydro began construction near Ararat', 'timeline_enrichment'),
('crowlands-wind-farm', '2018-12-08', 'day', 'cod', 'Commercial operations commenced', 'Vestas turbines commissioned', 'timeline_enrichment');

-- Elaine Wind Farm (82 MW, VIC) — part of Lal Lal
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('elaine-wind-farm', '2018', 'year', 'construction_start', 'Construction commenced', 'Part of Lal Lal Wind Farms; 22 Vestas V136-3.8 MW turbines', 'timeline_enrichment'),
('elaine-wind-farm', '2020-04-06', 'day', 'cod', 'Commercial operations commenced', 'Elaine section of Lal Lal project commissioned', 'timeline_enrichment');

-- Kennedy Energy Park Wind (43.3 MW, QLD)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('kennedy-energy-park-phase-1-wind', '2019', 'year', 'construction_start', 'Construction commenced', 'Windlab/Eurus hybrid project near Hughenden QLD', 'timeline_enrichment'),
('kennedy-energy-park-phase-1-wind', '2021-07-05', 'day', 'cod', 'Commercial operations commenced', 'Australias first co-located wind+solar+battery project', 'timeline_enrichment');

-- Kiata Wind Farm (31 MW, VIC)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('kiata-wind-farm', '2017', 'year', 'construction_start', 'Construction commenced', 'Tilt Renewables began construction in western Victoria', 'timeline_enrichment'),
('kiata-wind-farm', '2017-11-09', 'day', 'cod', 'Commercial operations commenced', '9 Senvion turbines; small but fast-build project', 'timeline_enrichment');

-- Salt Creek Wind Farm (54 MW, VIC)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('salt-creek-wind-farm', '2017', 'year', 'construction_start', 'Construction commenced', 'RES Group began construction', 'timeline_enrichment'),
('salt-creek-wind-farm', '2018-06-06', 'day', 'cod', 'Commercial operations commenced', '15 Vestas V126-3.6 MW turbines', 'timeline_enrichment');

-- Clements Gap Wind Farm (57 MW, SA)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('clements-gap-wind-farm', '2008', 'year', 'construction_start', 'Construction commenced', 'Pacific Hydro began construction in Mid North SA', 'timeline_enrichment'),
('clements-gap-wind-farm', '2009-05-07', 'day', 'cod', 'Commercial operations commenced', '27 Suzlon S88/2.1 MW turbines', 'timeline_enrichment');

-- Cathedral Rocks (66 MW, SA)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('cathedral-rocks', '2004', 'year', 'construction_start', 'Construction commenced', 'Acciona/Hydro Tasmania began construction on Eyre Peninsula', 'timeline_enrichment'),
('cathedral-rocks', '2005-08', 'month', 'cod', 'Commercial operations commenced', '33 Vestas V80-2.0 MW turbines', 'timeline_enrichment');

-- Lake Bonney 1 (80.5 MW, SA)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('lake-bonney-1-wind-farm', '2004', 'year', 'construction_start', 'Construction commenced', 'Babcock & Brown began Stage 1 construction near Millicent', 'timeline_enrichment'),
('lake-bonney-1-wind-farm', '2005', 'year', 'cod', 'Commercial operations commenced', '46 Vestas V66/1.75 MW turbines; first of three-stage complex', 'timeline_enrichment');

-- Lake Bonney 3 (39 MW, SA)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('lake-bonney-3-wind-farm', '2009', 'year', 'construction_start', 'Construction commenced', 'Third and final stage of Lake Bonney complex', 'timeline_enrichment'),
('lake-bonney-3-wind-farm', '2010-07-02', 'day', 'cod', 'Commercial operations commenced', '13 Vestas V90-3.0 MW turbines', 'timeline_enrichment');

-- Hawkesdale Wind Farm (89.5 MW, VIC)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('hawkesdale-wind-farm', '2022', 'year', 'construction_start', 'Construction commenced', 'WestWind Energy began construction in western Victoria', 'timeline_enrichment'),
('hawkesdale-wind-farm', '2024-06-16', 'day', 'cod', 'Commercial operations commenced', 'Vestas turbines commissioned', 'timeline_enrichment');

-- Gullen Range Wind Farm 2 (110.67 MW, NSW)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('gullen-range-wind-farm-2', '2019', 'year', 'construction_start', 'Construction commenced', 'BJCE/Goldwind began Stage 2 construction', 'timeline_enrichment'),
('gullen-range-wind-farm-2', '2020-06-19', 'day', 'cod', 'Commercial operations commenced', 'Stage 2 commissioned alongside 10 MW solar farm', 'timeline_enrichment');

-- Cullerin Range Wind Farm (30 MW, NSW)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('cullerin-range-wind-farm', '2008', 'year', 'construction_start', 'Construction commenced', 'Origin Energy began construction near Goulburn', 'timeline_enrichment'),
('cullerin-range-wind-farm', '2009-06-30', 'day', 'cod', 'Commercial operations commenced', '15 REpower MM82/2.0 MW turbines', 'timeline_enrichment');

-- Mt Millar Wind Farm (70 MW, SA)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('mt-millar-wind-farm', '2005', 'year', 'construction_start', 'Construction commenced', 'Tarong Energy began construction on Eyre Peninsula', 'timeline_enrichment'),
('mt-millar-wind-farm', '2006-01-31', 'day', 'cod', 'Commercial operations commenced', '35 Enercon E-70 2.0 MW turbines', 'timeline_enrichment');

-- Challicum Hills (52.5 MW, VIC)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('challicum-hills', '2002', 'year', 'construction_start', 'Construction commenced', 'Pacific Hydro began construction near Ararat', 'timeline_enrichment'),
('challicum-hills', '2003-07', 'month', 'cod', 'Commercial operations commenced', '35 NEG Micon NM64c/1500 turbines; one of Victorias earliest wind farms', 'timeline_enrichment');

-- Crookwell 3 Wind Farm (56 MW, NSW)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('crookwell-3-wind-farm', '2020-10', 'month', 'planning_approved', 'NSW planning approval', 'Approved for 16 turbines with max 157m tip height', 'timeline_enrichment'),
('crookwell-3-wind-farm', '2022', 'year', 'construction_start', 'Construction commenced', 'Global Power Generation began Stage 3 construction', 'timeline_enrichment'),
('crookwell-3-wind-farm', '2024-09-30', 'day', 'cod', 'Commercial operations commenced', '16 turbines commissioned; ~50 MW', 'timeline_enrichment');

-- ============================================================
-- SECTION 7: COMMISSIONING / CONSTRUCTION WIND FARMS
-- ============================================================

-- MacIntyre Wind Farm (923 MW, QLD) — GE/Acciona, Acciona
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('macintyre-wind-farm', '2019', 'year', 'planning_approved', 'QLD development approval', 'Queensland Government approved the project', 'timeline_enrichment'),
('macintyre-wind-farm', '2021-07', 'month', 'fid', 'Financial close — A$1.96B', 'Acciona reached financial close; largest single-site wind farm in southern hemisphere', 'timeline_enrichment'),
('macintyre-wind-farm', '2021-09', 'month', 'construction_start', 'Construction commenced', 'Construction began for 162 GE Cypress 5.7 MW turbines', 'timeline_enrichment'),
('macintyre-wind-farm', '2024', 'year', 'energisation', 'First turbines generating', 'Initial turbines connected to Powerlink network', 'timeline_enrichment');

-- Golden Plains Wind Farm (1300 MW, VIC) — Vestas/Goldwind
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('golden-plains-wind', '2020', 'year', 'planning_approved', 'Victorian planning permit', 'Planning permit granted for up to 228 turbines', 'timeline_enrichment'),
('golden-plains-wind', '2022', 'year', 'fid', 'Financial close — A$2B+', 'Australias largest wind farm reached financial close', 'timeline_enrichment'),
('golden-plains-wind', '2022', 'year', 'construction_start', 'Construction commenced', 'Staged construction for 1.3 GW across East and West sections', 'timeline_enrichment');

-- Golden Plains Wind Farm East (756 MW, VIC)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('golden-plains-wind-farm-east', '2023', 'year', 'construction_start', 'East section construction began', 'Turbine installation commenced for eastern section', 'timeline_enrichment');

-- Golden Plains Wind Farm West (577 MW, VIC)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('golden-plains-wind-farm-west', '2024', 'year', 'construction_start', 'West section construction began', 'Construction commenced for western section', 'timeline_enrichment');

-- Clarke Creek Wind Farm (450 MW, QLD) — GE
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('clarke-creek-wind-farm', '2020', 'year', 'planning_approved', 'QLD development approval', 'Queensland Government approved the project', 'timeline_enrichment'),
('clarke-creek-wind-farm', '2021', 'year', 'fid', 'Financial close — A$1.5B', 'Lacour Energy/Squadron Energy reached financial close', 'timeline_enrichment'),
('clarke-creek-wind-farm', '2022', 'year', 'construction_start', 'Construction commenced', 'Construction began for 66 GE Cypress 5.7 MW turbines + 33 GE 3.8 MW', 'timeline_enrichment');

-- Uungula Wind Farm (414 MW, NSW) — GE, Squadron Energy
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('uungula-wind-farm', '2020', 'year', 'planning_approved', 'NSW development consent', 'Planning approval granted near Mudgee NSW', 'timeline_enrichment'),
('uungula-wind-farm', '2023', 'year', 'fid', 'Financial close — A$820M', 'Squadron Energy reached financial close', 'timeline_enrichment'),
('uungula-wind-farm', '2023', 'year', 'construction_start', 'Construction commenced', '69 GE Cypress 6.0 MW turbines planned', 'timeline_enrichment');

-- Wambo Wind Farm (506 MW, QLD)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('wambo-wind-farm', '2021', 'year', 'planning_approved', 'QLD development approval', 'Queensland Government approved the project', 'timeline_enrichment'),
('wambo-wind-farm', '2022', 'year', 'fid', 'Financial close', 'Acciona reached financial close', 'timeline_enrichment'),
('wambo-wind-farm', '2022', 'year', 'construction_start', 'Construction commenced', 'Acciona began construction near Dalby QLD', 'timeline_enrichment');

-- Lotus Creek Wind Farm (285 MW, QLD)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('lotus-creek-wind-farm', '2022', 'year', 'fid', 'Financial close — A$1.3B', 'Goldwind/Ark Energy reached financial close', 'timeline_enrichment'),
('lotus-creek-wind-farm', '2023', 'year', 'construction_start', 'Construction commenced', 'Goldwind turbines being installed in central QLD', 'timeline_enrichment');

-- Carmodys Hill Wind Farm (256 MW, SA)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('carmodys-hill-wind-farm', '2023', 'year', 'fid', 'Financial close — A$900M', 'Tilt Renewables reached financial close', 'timeline_enrichment'),
('carmodys-hill-wind-farm', '2024', 'year', 'construction_start', 'Construction commenced', 'Construction began in South Australia', 'timeline_enrichment');

-- Boulder Creek Wind Farm (228 MW, QLD)
INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source) VALUES
('boulder-creek-wind-farm', '2024-10', 'month', 'fid', 'Financial close — A$740M', 'Squadron Energy reached financial close', 'timeline_enrichment'),
('boulder-creek-wind-farm', '2024', 'year', 'construction_start', 'Construction commenced', 'Construction began in central QLD', 'timeline_enrichment');

-- ============================================================
-- Done. Verify count:
-- ============================================================
-- SELECT COUNT(*) FROM timeline_events WHERE data_source = 'timeline_enrichment';
