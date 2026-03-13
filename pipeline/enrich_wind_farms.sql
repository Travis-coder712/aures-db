-- Wind Farm Data Enrichment & Corrections
-- Based on comprehensive web research March 2026
-- Covers operating, commissioning, and construction wind farms

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  SECTION 1: CAPACITY CORRECTIONS (Suspicious CFs)          ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Murra Warra Stage 2: 203.5 → 209 MW (38 x GE 5.5 MW Cypress)
UPDATE projects SET capacity_mw = 209.0 WHERE id = 'murra-warra-wind-farm-stage-2';

-- Goyder South 1A: 201 → 209 MW (38 x GE 5.5 MW Cypress)
UPDATE projects SET capacity_mw = 209.0 WHERE id = 'goyder-south-wind-farm-1a';

-- Bango 999: 82 → 84.8 MW (16 x GE 5.3 MW Cypress)
UPDATE projects SET capacity_mw = 84.8 WHERE id = 'bango-999-wind-farm';

-- Bango 973: 155 → 159 MW (30 x GE 5.3 MW Cypress)
UPDATE projects SET capacity_mw = 159.0 WHERE id = 'bango-973-wind-farm';

-- Lincoln Gap Stage 2: 85 → 86 MW (24 x Vestas V136-3.45 MW in 3.6 MW mode)
UPDATE projects SET capacity_mw = 86.0 WHERE id = 'lincoln-gap-wind-farm-stage-2';

-- Rye Park: 384 → 396 MW (66 x Vestas V162-6.0 MW)
UPDATE projects SET capacity_mw = 396.0 WHERE id = 'rye-park-wind-farm';

-- Stockyard Hill: 511 → 530 MW (149 x Goldwind GW140-3.57S)
UPDATE projects SET capacity_mw = 530.0 WHERE id = 'stockyard-hill-wind-farm';

-- Dulacca: 172.99 → 180.6 MW (43 x Vestas V150-4.2 MW)
UPDATE projects SET capacity_mw = 180.6 WHERE id = 'dulacca-wind-farm';

-- White Rock Stage 1: 172.5 → 175 MW (70 x Goldwind GW121/2.5 MW)
UPDATE projects SET capacity_mw = 175.0 WHERE id = 'white-rock-wind-farm-stage-1';

-- Mt Emerald: 178.2 → 180.5 MW (53 x Vestas V117-3.45 MW)
UPDATE projects SET capacity_mw = 180.5 WHERE id = 'mount-emerald';

-- MacIntyre: 890 → 923 MW (162 x Nordex N163/5.7 MW)
UPDATE projects SET capacity_mw = 923.0 WHERE id = 'macintyre-wind-farm';

-- Golden Plains East: 733 → 756 MW (122 x Vestas V162-6.2 MW)
UPDATE projects SET capacity_mw = 756.0 WHERE id = 'golden-plains-wind-farm-east';

-- Golden Plains West: 557 → 577 MW (93 x Vestas V162-6.2 MW)
UPDATE projects SET capacity_mw = 577.0 WHERE id = 'golden-plains-wind-farm-west';

-- Clarke Creek: 439 → 450 MW (100 x Goldwind ~4.5 MW)
UPDATE projects SET capacity_mw = 450.0 WHERE id = 'clarke-creek-wind-farm';

-- Bulgana: 204.4 → 194 MW (56 turbines, wind component is 194 MW, 20MW is BESS)
UPDATE projects SET capacity_mw = 194.0 WHERE id = 'bulgana-green-power-hub-wind-farm';

-- Ryan Corner: 205 → 218 MW (52 x Vestas V150-4.2 MW)
UPDATE projects SET capacity_mw = 218.0 WHERE id = 'ryan-corner-wind-farm';

-- Flyers Creek: 140 → 145.5 MW (38 x GE 3.8 MW)
UPDATE projects SET capacity_mw = 145.5 WHERE id = 'flyers-creek-wind-farm';

-- Mortlake South: 153 → 157.5 MW (ACCIONA confirms 157.5 MW)
UPDATE projects SET capacity_mw = 157.5 WHERE id = 'mortlake-south-wind-farm';

-- Elaine: 82 → 83.6 MW (correction based on research)
-- UPDATE projects SET capacity_mw = 83.6 WHERE id = 'elaine-wind-farm';

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  SECTION 2: NOTABLE / DESCRIPTION UPDATES                  ║
-- ╚══════════════════════════════════════════════════════════════╝

UPDATE projects SET notable = 'Largest wind farm in southern hemisphere at commissioning (2021). 149 turbines, Goldwind GW140-3.57S. 4x STATCOM units + 5x harmonic filters.' WHERE id = 'stockyard-hill-wind-farm';
UPDATE projects SET notable = 'Largest wind farm in Queensland. 123 turbines (91x GE 3.6MW + 32x GE 3.8MW). AGL developed, sold to Tilt 2017.' WHERE id = 'coopers-gap-wind-farm';
UPDATE projects SET notable = 'Was largest wind farm in southern hemisphere at commissioning (2013). 140x Vestas V112-3.0MW. ~A$1B cost.' WHERE id = 'macarthur-wind-farm';
UPDATE projects SET notable = 'Largest wind farm in NSW. 66x Vestas V162-6.0MW EnVentus — among highest capacity onshore turbines in Australia.' WHERE id = 'rye-park-wind-farm';
UPDATE projects SET notable = '80x Vestas V150-4.2MW. PPAs with Victorian Govt, Snowy Hydro, ALDI.' WHERE id = 'dundonnell-wind-farm';
UPDATE projects SET notable = '107x Goldwind GW136/3.0MW across North (50) and South (57) stages. 312MW total, developed by Goldwind Australia.' WHERE id = 'moorabool-wind-farm';
UPDATE projects SET notable = 'Stage 1: 43x Vestas V136-4.2MW (180.6MW). Stage 2: 37x Vestas V136-4.2MW (100.5MW). Owned by GPG/Naturgy.' WHERE id = 'berrybank-wind-farm';
UPDATE projects SET notable = '75x Vestas V117-3.6MW. ACT Govt 20yr PPA + CBA 12yr corporate PPA. Located in New England REZ.' WHERE id = 'sapphire-wind-farm';
UPDATE projects SET notable = 'First deployment of GE Cypress 5.3-158 turbines globally. 16 turbines. Woolworths PPA for ~108 NSW supermarkets.' WHERE id = 'bango-999-wind-farm';
UPDATE projects SET notable = '30x GE Cypress 5.3-158 turbines. Snowy Hydro 100MW offtake for combined Bango project.' WHERE id = 'bango-973-wind-farm';
UPDATE projects SET notable = '38x GE Cypress 5.5-158. PPAs: ACT Govt 100MW (14yr) + Flow Power 40MW (10yr). Inaugurated 2024, Neoen sold to Brookfield.' WHERE id = 'goyder-south-wind-farm-1a';
UPDATE projects SET notable = '37x GE Cypress 5.5-158. PPAs: BHP 70MW baseload agreement. Part of 412MW Goyder South complex.' WHERE id = 'goyder-south-wind-farm-1b';
UPDATE projects SET notable = '35x Senvion 3.6M140 EBC. Snowy Hydro offtake. Owned by RATCH-Australia (acquired Dec 2022 from Nexif).' WHERE id = 'lincoln-gap-wind-farm-stage-1';
UPDATE projects SET notable = '24x Vestas V136-3.45MW (3.6MW optimised). Owned by RATCH-Australia. Very high capacity factor site near Port Augusta.' WHERE id = 'lincoln-gap-wind-farm-stage-2';
UPDATE projects SET notable = '38x GE Cypress 5.5-158. Telstra corporate PPA + Snowy Hydro offtake. Senvion bearing failures required staged maintenance (2024).' WHERE id = 'murra-warra-wind-farm-stage-2';
UPDATE projects SET notable = '61x Senvion 3.7MW (3XM class). Telstra PPA + ANZ/Coca-Cola Amatil/UniMelb consortium + Monash Uni. Bearing failure issues.' WHERE id = 'murra-warra-wind-farm-stage-1';
UPDATE projects SET notable = '50x Vestas V150-4.2MW (wind) + 110MW solar. BHP Olympic Dam PPA + Woolworths PPA. Owned by Iberdrola. Elecnor EPC.' WHERE id = 'port-augusta-renewable-energy-park-wind';
UPDATE projects SET notable = '56 turbines. Neoen project with 15yr Victorian Govt support agreement. Nectar Farms 10yr PPA (collapsed). 20MW/34MWh BESS co-located.' WHERE id = 'bulgana-green-power-hub-wind-farm';
UPDATE projects SET notable = '52x Vestas V150-4.2MW. Snowy Hydro PPA. Owned by GPG/Naturgy. Decmil/RJE JV BOP. Opened Dec 2024.' WHERE id = 'ryan-corner-wind-farm';
UPDATE projects SET notable = 'ACT Govt 20yr PPA. Infigen developed, now Iberdrola Australia.' WHERE id = 'ararat-wind-farm';
UPDATE projects SET notable = '40x Vestas V117-3.3MW. Origin Energy PPA. CWP Renewables developed, Squadron Energy now owns.' WHERE id = 'collector';
UPDATE projects SET notable = '200MW, 58 x Siemens SWT-3.4-108 turbines. AGL PPA. AGL developed.' WHERE id = 'silverton-wind-farm';
UPDATE projects SET notable = '128x Acciona AW-1500/77 (1.5MW). Zen Energy 10yr PPA for 70% of output. Was Australias largest at 2009 commissioning.' WHERE id = 'waubra';
UPDATE projects SET notable = '53x Vestas V117-3.45MW. Ergon Energy 12.5yr PPA. Queenslands largest wind farm at commissioning. RATCH-Australia owns.' WHERE id = 'mount-emerald';
UPDATE projects SET notable = '43x Vestas V150-4.2MW. CleanCo 126MW PPA. RES developed, Octopus acquired. Opened Oct 2023.' WHERE id = 'dulacca-wind-farm';
UPDATE projects SET notable = '70x Goldwind GW121/2.5MW PMDD. CECEP 75%, Goldwind 25%. Goldwind EPC, Fulton Hogan BOP.' WHERE id = 'white-rock-wind-farm-stage-1';
UPDATE projects SET notable = '56x Vestas V90-3.0MW. Shenhua 75%, Hydro Tasmania 25%. 17.5yr Hydro Tas offtake. 5% of Tasmanias electricity.' WHERE id = 'musselroe-wind-farm';
UPDATE projects SET notable = '73 Goldwind turbines (56x GW100/2.5MW + 17x GW82/1.5MW). EnergyAustralia PPA. Goldwinds largest overseas project at time.' WHERE id = 'gullen-range-wind-farm';
UPDATE projects SET notable = '53x Vestas V90-3.0MW. Iberdrola Australia (prev Infigen). Located near Millicent, SA.' WHERE id = 'lake-bonney-2-wind-farm';
UPDATE projects SET notable = 'ACCIONA. Nordex N149/5.X turbines. Zen Energy PPA. Fully operational July 2024.' WHERE id = 'mortlake-south-wind-farm';
UPDATE projects SET notable = '37x Vestas V117-4.2MW. 100MW/200MWh BESS co-located. Neoen developed. Powerlink SynCon for system strength. Far North QLD.' WHERE id = 'kaban-wind-farm';
UPDATE projects SET notable = '44x Vestas V126-3.45MW. Cattle Hill Wind Farm Holdings (Goldwind subsidiary). Launched Feb 2020.' WHERE id = 'cattle-hill-wind-farm';
UPDATE projects SET notable = '38x GE 3.8-137 turbines. Iberdrola Australia developed. Located near Orange, NSW.' WHERE id = 'flyers-creek-wind-farm';
UPDATE projects SET notable = '37x Goldwind GW140-3.57S. CWP Renewables/Squadron Energy. COD 2021.' WHERE id = 'crudine-ridge-wind-farm';

-- Construction/commissioning notable updates
UPDATE projects SET notable = 'Largest onshore wind farm in southern hemisphere. 162x Nordex N163/5.7MW. A$1.96B. CleanCo 400MW PPA + Stanwell + Ark/Telstra.' WHERE id = 'macintyre-wind-farm';
UPDATE projects SET notable = 'Stage 1 of Australias largest wind farm. 122x Vestas V162-6.2MW. Snowy Hydro 40% + Equinix 20% PPAs. A$2B. TagEnergy/IKEA.' WHERE id = 'golden-plains-wind-farm-east';
UPDATE projects SET notable = 'Stage 2, 93x Vestas V162-6.2MW. Brings Golden Plains total to 1,333MW. Financial close reached.' WHERE id = 'golden-plains-wind-farm-west';
UPDATE projects SET notable = '100x Goldwind ~4.5MW. Squadron Energy. Stanwell 348MW 15yr PPA. SynCon installed. A$1B financing Dec 2025.' WHERE id = 'clarke-creek-wind-farm';
UPDATE projects SET notable = '97x Vestas V150-4.2MW. Vestas EPC. Shell Energy PPA. Owned by Squadron Energy.' WHERE id = 'wambo-wind-farm';
UPDATE projects SET notable = '84x GE 5.5-158 Cypress. GE/NACAP/CCP consortium EPC. Squad Energy. Had significant construction delays.' WHERE id = 'uungula-wind-farm';
UPDATE projects SET notable = '55x Vestas V150-4.2MW. Vestas EPC. Nexif/RATCH-Australia. Located near Marlborough, QLD.' WHERE id = 'lotus-creek-wind-farm';

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  SECTION 3: SYNCON / STATCOM / GRID FLAGS                  ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Stockyard Hill has 4x STATCOMs + 5x harmonic filters
UPDATE projects SET has_statcom = 1, has_harmonic_filter = 1 WHERE id = 'stockyard-hill-wind-farm';

-- Clarke Creek has a SynCon
UPDATE projects SET has_syncon = 1 WHERE id = 'clarke-creek-wind-farm';

-- Kaban: Powerlink installed SynCon for system strength
UPDATE projects SET has_syncon = 1 WHERE id = 'kaban-wind-farm';

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  SECTION 4: CURRENT OPERATOR UPDATES                       ║
-- ╚══════════════════════════════════════════════════════════════╝

UPDATE projects SET current_operator = 'Goldwind Australia' WHERE id = 'stockyard-hill-wind-farm';
UPDATE projects SET current_operator = 'Tilt Renewables' WHERE id = 'coopers-gap-wind-farm';
UPDATE projects SET current_operator = 'AGL Energy' WHERE id = 'macarthur-wind-farm';
UPDATE projects SET current_operator = 'Tilt Renewables' WHERE id = 'rye-park-wind-farm';
UPDATE projects SET current_operator = 'Tilt Renewables' WHERE id = 'dundonnell-wind-farm';
UPDATE projects SET current_operator = 'Goldwind Australia' WHERE id = 'moorabool-wind-farm';
UPDATE projects SET current_operator = 'GPG Australia' WHERE id = 'berrybank-wind-farm';
UPDATE projects SET current_operator = 'Squadron Energy' WHERE id = 'sapphire-wind-farm';
UPDATE projects SET current_operator = 'Squadron Energy' WHERE id = 'bango-999-wind-farm';
UPDATE projects SET current_operator = 'Squadron Energy' WHERE id = 'bango-973-wind-farm';
UPDATE projects SET current_operator = 'Brookfield' WHERE id = 'goyder-south-wind-farm-1a';
UPDATE projects SET current_operator = 'Brookfield' WHERE id = 'goyder-south-wind-farm-1b';
UPDATE projects SET current_operator = 'RATCH-Australia' WHERE id = 'lincoln-gap-wind-farm-stage-1';
UPDATE projects SET current_operator = 'RATCH-Australia' WHERE id = 'lincoln-gap-wind-farm-stage-2';
UPDATE projects SET current_operator = 'Squadron Energy' WHERE id = 'murra-warra-wind-farm-stage-1';
UPDATE projects SET current_operator = 'Squadron Energy' WHERE id = 'murra-warra-wind-farm-stage-2';
UPDATE projects SET current_operator = 'Iberdrola Australia' WHERE id = 'port-augusta-renewable-energy-park-wind';
UPDATE projects SET current_operator = 'Neoen' WHERE id = 'bulgana-green-power-hub-wind-farm';
UPDATE projects SET current_operator = 'GPG Australia' WHERE id = 'ryan-corner-wind-farm';
UPDATE projects SET current_operator = 'Iberdrola Australia' WHERE id = 'ararat-wind-farm';
UPDATE projects SET current_operator = 'Squadron Energy' WHERE id = 'collector';
UPDATE projects SET current_operator = 'AGL Energy' WHERE id = 'silverton-wind-farm';
UPDATE projects SET current_operator = 'ACCIONA' WHERE id = 'waubra';
UPDATE projects SET current_operator = 'RATCH-Australia' WHERE id = 'mount-emerald';
UPDATE projects SET current_operator = 'Octopus Australia' WHERE id = 'dulacca-wind-farm';
UPDATE projects SET current_operator = 'CECEP/Goldwind' WHERE id = 'white-rock-wind-farm-stage-1';
UPDATE projects SET current_operator = 'Shenhua/Hydro Tasmania' WHERE id = 'musselroe-wind-farm';
UPDATE projects SET current_operator = 'Ark Energy' WHERE id = 'gullen-range-wind-farm';
UPDATE projects SET current_operator = 'Iberdrola Australia' WHERE id = 'lake-bonney-2-wind-farm';
UPDATE projects SET current_operator = 'ACCIONA' WHERE id = 'mortlake-south-wind-farm';
UPDATE projects SET current_operator = 'Neoen' WHERE id = 'kaban-wind-farm';
UPDATE projects SET current_operator = 'Goldwind Australia' WHERE id = 'cattle-hill-wind-farm';
UPDATE projects SET current_operator = 'Iberdrola Australia' WHERE id = 'flyers-creek-wind-farm';
UPDATE projects SET current_operator = 'Squadron Energy' WHERE id = 'crudine-ridge-wind-farm';
UPDATE projects SET current_operator = 'Goldwind Australia' WHERE id = 'gullen-range-wind-farm-2';
UPDATE projects SET current_operator = 'Iberdrola Australia' WHERE id = 'lake-bonney-1-wind-farm';
UPDATE projects SET current_operator = 'Iberdrola Australia' WHERE id = 'lake-bonney-3-wind-farm';
UPDATE projects SET current_operator = 'AGL Energy' WHERE id = 'hallett-stage-1-brown-hill';
UPDATE projects SET current_operator = 'AGL Energy' WHERE id = 'hallett-4-north-brown-hill';
UPDATE projects SET current_operator = 'AGL Energy' WHERE id = 'hallett-stage-2-hallett-hill';
UPDATE projects SET current_operator = 'AGL Energy' WHERE id = 'hallett-5-the-bluff-wf';
UPDATE projects SET current_operator = 'GPG Australia' WHERE id = 'hawkesdale-wind-farm';
UPDATE projects SET current_operator = 'Palisade/Aware Super' WHERE id = 'waterloo-wind-farm';
UPDATE projects SET current_operator = 'Tilt Renewables' WHERE id = 'salt-creek-wind-farm';
UPDATE projects SET current_operator = 'Squadron Energy' WHERE id = 'bodangora-wind-farm';
UPDATE projects SET current_operator = 'Hydro Tasmania' WHERE id = 'woolnorth-studland-bay-bluff-point';
UPDATE projects SET current_operator = 'Hydro Tasmania' WHERE id = 'granville-harbour-wind-farm';
UPDATE projects SET current_operator = 'Pacific Blue' WHERE id = 'portland-wind-farm';
UPDATE projects SET current_operator = 'ACCIONA' WHERE id = 'mt-gellibrand-wind-farm';
UPDATE projects SET current_operator = 'Meridian Energy' WHERE id = 'mt-mercer-wind-farm';
UPDATE projects SET current_operator = 'Squadron Energy' WHERE id = 'boco-rock-wind-farm';
UPDATE projects SET current_operator = 'EnergyAustralia' WHERE id = 'capital-wind-farm';
UPDATE projects SET current_operator = 'Neoen' WHERE id = 'hornsdale-wind-farm-stage-1';
UPDATE projects SET current_operator = 'Neoen' WHERE id = 'hornsdale-wind-farm-stage-2';
UPDATE projects SET current_operator = 'Neoen' WHERE id = 'hornsdale-wind-farm-stage-3';
UPDATE projects SET current_operator = 'Tilt Renewables' WHERE id = 'snowtown-wind-farm';
UPDATE projects SET current_operator = 'Tilt Renewables' WHERE id = 'snowtown-s2-wind-farm';
UPDATE projects SET current_operator = 'Engie' WHERE id = 'willogoleche-wind-farm';

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  SECTION 5: OEM / SUPPLIER INSERTS                         ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Operating wind farms missing OEM
INSERT OR IGNORE INTO suppliers (project_id, supplier, role, model) VALUES
('stockyard-hill-wind-farm', 'Goldwind', 'wind_oem', 'GW140-3.57S'),
('coopers-gap-wind-farm', 'GE Vernova', 'wind_oem', 'GE 3.6-137 / GE 3.8-130'),
('macarthur-wind-farm', 'Vestas', 'wind_oem', 'V112-3.0 MW'),
('rye-park-wind-farm', 'Vestas', 'wind_oem', 'V162-6.0 MW EnVentus'),
('dundonnell-wind-farm', 'Vestas', 'wind_oem', 'V150-4.2 MW'),
('moorabool-wind-farm', 'Goldwind', 'wind_oem', 'GW136/3000'),
('berrybank-wind-farm', 'Vestas', 'wind_oem', 'V136-4.2 MW'),
('sapphire-wind-farm', 'Vestas', 'wind_oem', 'V117-3.6 MW'),
('snowtown-s2-wind-farm', 'Siemens Gamesa', 'wind_oem', 'SWT-3.0-113'),
('ararat-wind-farm', 'GE Vernova', 'wind_oem', 'GE 2.5-120'),
('collector', 'Vestas', 'wind_oem', 'V117-3.3 MW'),
('port-augusta-renewable-energy-park-wind', 'Vestas', 'wind_oem', 'V150-4.2 MW'),
('ryan-corner-wind-farm', 'Vestas', 'wind_oem', 'V150-4.2 MW'),
('bulgana-green-power-hub-wind-farm', 'Vestas', 'wind_oem', 'V126-3.45 MW'),
('silverton-wind-farm', 'Siemens', 'wind_oem', 'SWT-3.4-108'),
('murra-warra-wind-farm-stage-1', 'Senvion', 'wind_oem', '3.7M class'),
('murra-warra-wind-farm-stage-2', 'GE Vernova', 'wind_oem', 'Cypress 5.5-158'),
('goyder-south-wind-farm-1a', 'GE Vernova', 'wind_oem', 'Cypress 5.5-158'),
('goyder-south-wind-farm-1b', 'GE Vernova', 'wind_oem', 'Cypress 5.5-158'),
('bango-999-wind-farm', 'GE Vernova', 'wind_oem', 'Cypress 5.3-158'),
('bango-973-wind-farm', 'GE Vernova', 'wind_oem', 'Cypress 5.3-158'),
('lincoln-gap-wind-farm-stage-1', 'Senvion', 'wind_oem', '3.6M140 EBC'),
('lincoln-gap-wind-farm-stage-2', 'Vestas', 'wind_oem', 'V136-3.45 MW (3.6MW optimised)'),
('waubra', 'Acciona Windpower', 'wind_oem', 'AW-1500/77'),
('mount-emerald', 'Vestas', 'wind_oem', 'V117-3.45 MW'),
('dulacca-wind-farm', 'Vestas', 'wind_oem', 'V150-4.2 MW'),
('white-rock-wind-farm-stage-1', 'Goldwind', 'wind_oem', 'GW121/2500 PMDD'),
('musselroe-wind-farm', 'Vestas', 'wind_oem', 'V90-3.0 MW'),
('gullen-range-wind-farm', 'Goldwind', 'wind_oem', 'GW100/2500 + GW82/1500'),
('lake-bonney-2-wind-farm', 'Vestas', 'wind_oem', 'V90-3.0 MW'),
('mortlake-south-wind-farm', 'Nordex', 'wind_oem', 'N149/5.X'),
('kaban-wind-farm', 'Vestas', 'wind_oem', 'V117-4.2 MW'),
('cattle-hill-wind-farm', 'Vestas', 'wind_oem', 'V126-3.45 MW'),
('flyers-creek-wind-farm', 'GE Vernova', 'wind_oem', 'GE 3.8-137'),
('crudine-ridge-wind-farm', 'Goldwind', 'wind_oem', 'GW140-3.57S'),
('gullen-range-wind-farm-2', 'Goldwind', 'wind_oem', 'GW140-3.57S'),
('waterloo-wind-farm', 'Vestas', 'wind_oem', 'V90-3.0 MW'),
('willogoleche-wind-farm', 'Siemens Gamesa', 'wind_oem', 'SWT-3.4-108'),
('hallett-stage-1-brown-hill', 'Suzlon', 'wind_oem', 'S88-2.1 MW'),
('hallett-4-north-brown-hill', 'Suzlon', 'wind_oem', 'S88-2.1 MW'),
('hallett-stage-2-hallett-hill', 'Suzlon', 'wind_oem', 'S88-2.1 MW'),
('hallett-5-the-bluff-wf', 'Suzlon', 'wind_oem', 'S88-2.1 MW'),
('lake-bonney-1-wind-farm', 'Vestas', 'wind_oem', 'V66-1.75 MW'),
('lake-bonney-3-wind-farm', 'Vestas', 'wind_oem', 'V90-3.0 MW'),
('bodangora-wind-farm', 'Goldwind', 'wind_oem', 'GW121/2500'),
('boco-rock-wind-farm', 'Goldwind', 'wind_oem', 'GW100/2500'),
('capital-wind-farm', 'Suzlon', 'wind_oem', 'S88-2.1 MW'),
('hornsdale-wind-farm-stage-1', 'Siemens Gamesa', 'wind_oem', 'SWT-3.2-113'),
('hornsdale-wind-farm-stage-2', 'Siemens Gamesa', 'wind_oem', 'SWT-3.2-113'),
('hornsdale-wind-farm-stage-3', 'Siemens Gamesa', 'wind_oem', 'SWT-DD-130 3.6MW'),
('snowtown-wind-farm', 'Suzlon', 'wind_oem', 'S88-2.1 MW'),
('snowtown-s2-wind-farm', 'Siemens Gamesa', 'wind_oem', 'SWT-3.0-113'),
('mt-gellibrand-wind-farm', 'Vestas', 'wind_oem', 'V126-3.3 MW'),
('mt-mercer-wind-farm', 'Senvion', 'wind_oem', 'REpower MM92 2.05 MW'),
('hawkesdale-wind-farm', 'Vestas', 'wind_oem', 'V150-4.2 MW'),
('salt-creek-wind-farm', 'Vestas', 'wind_oem', 'V126-3.6 MW'),
('portland-wind-farm', 'Senvion', 'wind_oem', 'REpower MM82/MM92 2.05 MW'),
('woolnorth-studland-bay-bluff-point', 'Vestas', 'wind_oem', 'V66-1.75 MW / V90-3.0 MW'),
('granville-harbour-wind-farm', 'Vestas', 'wind_oem', 'V126-3.45 MW'),
('bald-hills-wind-farm', 'Senvion', 'wind_oem', 'REpower MM92 2.05 MW'),
('taralga-wind-farm', 'Vestas', 'wind_oem', 'V90-3.0 MW'),
('crookwell-2-wind-farm', 'Goldwind', 'wind_oem', 'GW121/2500'),
('yendon-wind-farm', 'Vestas', 'wind_oem', 'V150-4.2 MW'),
('oaklands-hill-wind-farm', 'Suzlon', 'wind_oem', 'S88-2.1 MW'),
('cherry-tree-wind-farm', 'Vestas', 'wind_oem', 'V126-3.6 MW');

-- Commissioning wind farms missing OEM
INSERT OR IGNORE INTO suppliers (project_id, supplier, role, model) VALUES
('macintyre-wind-farm', 'Nordex', 'wind_oem', 'N163/5.7 MW Delta4000'),
('golden-plains-wind-farm-east', 'Vestas', 'wind_oem', 'V162-6.2 MW EnVentus'),
('clarke-creek-wind-farm', 'Goldwind', 'wind_oem', '~4.5 MW');

-- EPC contractors for major operating farms
INSERT OR IGNORE INTO suppliers (project_id, supplier, role) VALUES
('stockyard-hill-wind-farm', 'SNC-Lavalin / WBHO JV', 'bop'),
('coopers-gap-wind-farm', 'CATCON', 'epc'),
('macarthur-wind-farm', 'Vestas', 'epc'),
('rye-park-wind-farm', 'Zenviron', 'bop'),
('dundonnell-wind-farm', 'Zenviron', 'bop'),
('port-augusta-renewable-energy-park-wind', 'Elecnor', 'epc'),
('ryan-corner-wind-farm', 'Decmil/RJE JV', 'bop'),
('dulacca-wind-farm', 'RES', 'epc'),
('white-rock-wind-farm-stage-1', 'Fulton Hogan', 'bop');

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  SECTION 6: OFFTAKE / PPA INSERTS                          ║
-- ╚══════════════════════════════════════════════════════════════╝

-- New offtakes (won't duplicate due to unique constraint logic)
INSERT OR IGNORE INTO offtakes (project_id, party, type) VALUES
('stockyard-hill-wind-farm', 'Origin Energy', 'PPA'),
('coopers-gap-wind-farm', 'AGL Energy', 'PPA'),
('macarthur-wind-farm', 'AGL Energy', 'PPA'),
('dundonnell-wind-farm', 'Victorian Government', 'government_ppa'),
('dundonnell-wind-farm', 'Snowy Hydro', 'PPA'),
('dundonnell-wind-farm', 'ALDI', 'corporate_ppa'),
('bango-999-wind-farm', 'Woolworths', 'corporate_ppa'),
('bango-973-wind-farm', 'Snowy Hydro', 'PPA'),
('goyder-south-wind-farm-1a', 'ACT Government', 'government_ppa'),
('goyder-south-wind-farm-1a', 'Flow Power', 'PPA'),
('goyder-south-wind-farm-1b', 'BHP', 'corporate_ppa'),
('lincoln-gap-wind-farm-stage-1', 'Snowy Hydro', 'PPA'),
('murra-warra-wind-farm-stage-1', 'Telstra', 'corporate_ppa'),
('murra-warra-wind-farm-stage-2', 'Snowy Hydro', 'PPA'),
('port-augusta-renewable-energy-park-wind', 'BHP', 'corporate_ppa'),
('port-augusta-renewable-energy-park-wind', 'Woolworths', 'corporate_ppa'),
('waubra', 'Zen Energy', 'PPA'),
('mount-emerald', 'Ergon Energy', 'PPA'),
('dulacca-wind-farm', 'CleanCo Queensland', 'government_ppa'),
('musselroe-wind-farm', 'Hydro Tasmania', 'PPA'),
('gullen-range-wind-farm', 'EnergyAustralia', 'PPA'),
('macintyre-wind-farm', 'CleanCo Queensland', 'government_ppa'),
('macintyre-wind-farm', 'Stanwell Corporation', 'PPA'),
('golden-plains-wind-farm-east', 'Snowy Hydro', 'PPA'),
('golden-plains-wind-farm-east', 'Equinix', 'corporate_ppa'),
('clarke-creek-wind-farm', 'Stanwell Corporation', 'PPA'),
('wambo-wind-farm', 'Shell Energy', 'PPA'),
('flyers-creek-wind-farm', 'Iberdrola portfolio', 'PPA'),
('silverton-wind-farm', 'AGL Energy', 'PPA'),
('kaban-wind-farm', 'Neoen portfolio', 'PPA');

-- Update existing incomplete offtakes with term_years where known
UPDATE offtakes SET term_years = 15 WHERE project_id = 'rye-park-wind-farm' AND party = 'AGL Energy';
UPDATE offtakes SET term_years = 20 WHERE project_id = 'sapphire-wind-farm' AND party = 'ACT Government';
UPDATE offtakes SET term_years = 12 WHERE project_id = 'sapphire-wind-farm' AND party LIKE '%CBA%';
UPDATE offtakes SET term_years = 10 WHERE project_id = 'waubra' AND party = 'Zen Energy';
UPDATE offtakes SET term_years = 20 WHERE project_id = 'ararat-wind-farm' AND party = 'ACT Government';
UPDATE offtakes SET term_years = 20 WHERE project_id = 'hornsdale-wind-farm-stage-1' AND party = 'ACT Government';
UPDATE offtakes SET term_years = 20 WHERE project_id = 'hornsdale-wind-farm-stage-2' AND party = 'ACT Government';
UPDATE offtakes SET term_years = 20 WHERE project_id = 'hornsdale-wind-farm-stage-3' AND party = 'ACT Government';
UPDATE offtakes SET term_years = 20 WHERE project_id = 'crookwell-2-wind-farm' AND party = 'ACT Government';
UPDATE offtakes SET term_years = 10 WHERE project_id = 'crowlands-wind-farm' AND party LIKE '%NAB%';
