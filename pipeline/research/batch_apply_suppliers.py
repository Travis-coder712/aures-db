#!/usr/bin/env python3
"""Batch apply solar and hydro supplier data from web research.

Inserts solar_oem, inverter, epc, and hydro_oem records.
Uses INSERT OR IGNORE to never overwrite existing supplier records.
"""

import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'aures.db')

# ── SOLAR SUPPLIERS (78 projects) ──────────────────────────────────────────

SOLAR_SUPPLIERS = [
    # Batch 1: Large (>100 MW)
    {"project_id": "stubbo-solar-farm", "panel_oem": None, "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "PCL Construction", "source_url": "https://www.pv-tech.org/acen-australia-appoints-pcl-construction-as-epc-contractor-for-400mwac-stubbo-solar-plant/"},
    {"project_id": "western-downs-green-power-hub-pl", "panel_oem": None, "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "Sterling & Wilson", "source_url": "https://www.nsenergybusiness.com/projects/western-downs-green-power-hub/"},
    {"project_id": "aldoga-solar-farm", "panel_oem": "JA Solar", "panel_model": None, "inverter_oem": "Ingeteam", "inverter_model": "INGECON SUN 3Power C", "epc": "ACCIONA Energia", "source_url": "https://www.pv-magazine-australia.com/2024/05/15/ingeteam-trots-out-australian-first-inverter-tech-at-aldoga-solar-farm/"},
    {"project_id": "culcairn-solar-farm", "panel_oem": None, "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "Bouygues Construction Australia", "source_url": "https://neoen.com/en/news/2023/neoen-signs-contract-in-new-south-wales-and-launches-construction-of-440-mwp-culcairn-solar-farm-in-australia/"},
    {"project_id": "wellington-north-solar-farm-lightsource", "panel_oem": None, "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "GRS (Gransolar)", "source_url": "https://grs.energy/grs-agreement-lightsource-bp-solar-epc/"},
    {"project_id": "limondale-solar-farm-1", "panel_oem": "SunPower", "panel_model": "P-Series", "inverter_oem": "SMA", "inverter_model": "MPVS", "epc": "BELECTRIC", "source_url": "https://www.nsenergybusiness.com/projects/limondale-solar-farm-new-south-wales/"},
    {"project_id": "walla-walla-solar-farm", "panel_oem": "Astronergy", "panel_model": "ASTRO N5", "inverter_oem": None, "inverter_model": None, "epc": "GRS / CHINT Solar (JV)", "source_url": "https://www.astronergy.com/astronergy-355mw-topcon-modules-to-offer-green-energy-in-australia/"},
    {"project_id": "wollar-solar-farm", "panel_oem": None, "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "DT Infrastructure (Gamuda)", "source_url": "https://www.power-technology.com/projects/goulburn-river-solar-farm/"},
    {"project_id": "darlington-point-solar-farm", "panel_oem": "Canadian Solar", "panel_model": "HiKu CS3W-P", "inverter_oem": "SMA", "inverter_model": None, "epc": "Canadian Solar / Signal Energy (JV)", "source_url": "https://investors.canadiansolar.com/news-releases/news-release-details/canadian-solar-provide-epc-services-and-supply-solar-modules"},
    {"project_id": "avonlie-solar-farm", "panel_oem": None, "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "Beon Energy Solutions", "source_url": "https://www.pv-tech.org/iberdrola-australia-completes-the-golden-row-of-its-largest-solar-pv-power-plant/"},
    {"project_id": "kiamal-solar-farm-stage-1", "panel_oem": "Canadian Solar", "panel_model": "KuMax CS3U-P", "inverter_oem": None, "inverter_model": None, "epc": "Canadian Solar / Biosar (JV)", "source_url": "https://investors.canadiansolar.com/news-releases/news-release-details/canadian-solar-partners-biosar-build-256-mwp-solar-project-total"},
    {"project_id": "sunraysia-solar-farm", "panel_oem": "Jinko Solar", "panel_model": "Cheetah HC", "inverter_oem": "Schneider Electric", "inverter_model": None, "epc": "Decmil", "source_url": "https://www.nsenergybusiness.com/projects/sunraysia-solar-farm-new-south-wales/"},
    {"project_id": "edenvale-solar-park", "panel_oem": None, "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "GRS (Gransolar)", "source_url": "https://www.sojitz.com/en/news/2021/06/20210610.php"},
    {"project_id": "woolooga-solar-farm", "panel_oem": "Risen Energy", "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "PCL Construction", "source_url": "https://risenenergy.com.au/portfolio/woolooga-solar-farm/"},
    {"project_id": "wellington-solar-farm", "panel_oem": "Canadian Solar", "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "Sterling & Wilson", "source_url": "https://www.pv-tech.org/sterling-and-wilson-starts-building-200mw-solar-project-in-australia/"},
    {"project_id": "columboola-solar-farm", "panel_oem": None, "panel_model": None, "inverter_oem": "SMA", "inverter_model": "Sunny Central", "epc": "Sterling & Wilson", "source_url": "https://www.pv-magazine-australia.com/2022/12/01/162-mw-queensland-solar-farm-begins-commercial-operations/"},
    {"project_id": "coleambally-solar-farm", "panel_oem": None, "panel_model": None, "inverter_oem": "Schneider Electric", "inverter_model": "SC2000", "epc": "Bouygues Construction Australia", "source_url": "https://www.power-technology.com/projects/coleambally-solar-farm-new-south-wales/"},
    {"project_id": "daydream-solar-farm", "panel_oem": "First Solar", "panel_model": "Series 4", "inverter_oem": None, "inverter_model": None, "epc": "RCR Tomlinson", "source_url": "https://www.pv-tech.org/news/first-solar-tops-500mw-of-series-4-module-orders-in-australia"},
    {"project_id": "suntop-solar-farm", "panel_oem": "Canadian Solar", "panel_model": "BiHiKu CS3W-MB-AG", "inverter_oem": "Ingeteam", "inverter_model": None, "epc": "Bouygues Construction", "source_url": "https://www.power-technology.com/data-insights/power-plant-profile-suntop-solar-pv-park-australia/"},
    {"project_id": "bluegrass-solar-farm", "panel_oem": None, "panel_model": None, "inverter_oem": "Ingeteam", "inverter_model": None, "epc": "GRS (Gransolar)", "source_url": "https://www.pv-magazine-australia.com/2020/12/04/grs-named-as-epc-of-x-elios-200-mw-blue-grass-solar-farm/"},
    {"project_id": "finley-solar-farm", "panel_oem": "Canadian Solar", "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "Canadian Solar / Signal Energy (JV)", "source_url": "https://www.nsenergybusiness.com/projects/finley-solar-farm-new-south-wales/"},
    {"project_id": "numurkah-solar-farm", "panel_oem": "LONGi", "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "Downer", "source_url": "https://www.powerinfotoday.com/solar-energy/longi-supplied-128mw-high-efficiency-monocrystalline-panels-to-the-biggest-numurkah-solar-farm-in-australia/"},
    {"project_id": "sun-metals-corporation-solar-farm", "panel_oem": "First Solar", "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "RCR Tomlinson", "source_url": "https://en.wikipedia.org/wiki/Sun_Metals_Solar_Farm"},
    {"project_id": "ross-river-solar-farm", "panel_oem": "JA Solar", "panel_model": None, "inverter_oem": "Schneider Electric", "inverter_model": None, "epc": "Downer", "source_url": "https://www.power-technology.com/projects/ross-river-solar-farm/"},
    {"project_id": "metz-solar-farm", "panel_oem": None, "panel_model": None, "inverter_oem": "SMA", "inverter_model": None, "epc": "Beon Energy Solutions", "source_url": "https://www.pv-magazine-australia.com/2022/09/13/frv-australia-reveals-115-mw-solar-farm-now-at-100-capacity/"},
    {"project_id": "bungala-one-solar-farm", "panel_oem": "Jinko Solar", "panel_model": None, "inverter_oem": "SMA", "inverter_model": None, "epc": "Elecnor", "source_url": "https://www.nsenergybusiness.com/news/jinkosolar-delivers-275-4-mw-of-solar-modules-for-bungala-solar-farm/"},

    # Batch 2: Medium (50-110 MW)
    {"project_id": "bungala-two-solar-farm", "panel_oem": "Jinko Solar", "panel_model": None, "inverter_oem": "SMA", "inverter_model": None, "epc": "Green Light Contractors", "source_url": "https://www.power-technology.com/projects/bungala-solar-pv-plant-port-augusta/"},
    {"project_id": "darling-downs-solar-farm", "panel_oem": "JA Solar", "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "RCR Tomlinson", "source_url": "https://www.power-technology.com/data-insights/power-plant-profile-darling-downs-solar-farm-australia/"},
    {"project_id": "glenrowan-west-solar-farm", "panel_oem": "Jinko Solar", "panel_model": "Cheetah 395/400W", "inverter_oem": "SMA", "inverter_model": "Sunny Central 2750", "epc": "Signal Energy Australia", "source_url": "https://www.pv-magazine-australia.com/2021/06/10/glenrowan-west-solar-farm-completed-and-commissioned/"},
    {"project_id": "gunnedah-solar-farm", "panel_oem": "Canadian Solar", "panel_model": None, "inverter_oem": "Ingeteam", "inverter_model": "INGECON SUN CON20/CON40", "epc": "PCL Construction", "source_url": "https://www.pcl.com/au/en/our-work/gunnedah-solar"},
    {"project_id": "port-augusta-renewable-energy-park-solar", "panel_oem": "LONGi", "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "Sterling & Wilson", "source_url": "https://www.power-technology.com/projects/port-augusta-renewable-energy-park-port-augusta-australia/"},
    {"project_id": "nevertire-solar-farm", "panel_oem": "Suntech", "panel_model": None, "inverter_oem": "SMA", "inverter_model": None, "epc": "Biosar", "source_url": "https://suntech-power.com.au/project/nevertire-solar-power-farm/"},
    {"project_id": "nyngan-solar-plant", "panel_oem": "First Solar", "panel_model": "CdTe thin film", "inverter_oem": None, "inverter_model": None, "epc": "First Solar", "source_url": "https://en.wikipedia.org/wiki/Nyngan_Solar_Plant"},
    {"project_id": "yarranlea-solar-farm", "panel_oem": "Risen Energy", "panel_model": None, "inverter_oem": "SMA", "inverter_model": None, "epc": None, "source_url": "https://risenenergy.com.au/portfolio/yarranlea-queensland/"},
    {"project_id": "glenrowan-solar-farm", "panel_oem": None, "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "UGL", "source_url": "https://www.ugllimited.com/our-projects/energy-and-utilities/glenrowan-solar-farm"},
    {"project_id": "bannerton-solar-park", "panel_oem": "Hanwha Q Cells", "panel_model": "345W", "inverter_oem": "SMA", "inverter_model": None, "epc": None, "source_url": "https://en.wikipedia.org/wiki/Bannerton_Solar_Park"},
    {"project_id": "bomen-solar-farm", "panel_oem": "Jinko Solar", "panel_model": None, "inverter_oem": "SMA", "inverter_model": None, "epc": "Beon Energy Solutions", "source_url": "https://sparkrenewables.com/bomen-solar-farm/"},
    {"project_id": "clare-solar-farm", "panel_oem": "Trina Solar", "panel_model": None, "inverter_oem": "Ingeteam", "inverter_model": "INGECON SUN PowerMax B Series 1600kW", "epc": None, "source_url": "https://www.pv-tech.org/ingeteam-supplying-inverters-to-frvs-125mw-australian-pv-power-plant/"},
    {"project_id": "haughton-solar-farm-stage-1", "panel_oem": None, "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "RCR Tomlinson", "source_url": "https://www.nsenergybusiness.com/projects/haughton-solar-farm-queensland/"},
    {"project_id": "lilyvale-solar-farm", "panel_oem": "Canadian Solar", "panel_model": None, "inverter_oem": "Ingeteam", "inverter_model": "1600TL B615", "epc": None, "source_url": "https://www.power-technology.com/data-insights/power-plant-profile-lilyvale-solar-pv-park-australia/"},
    {"project_id": "tailem-bend-solar", "panel_oem": "Jinko Solar", "panel_model": None, "inverter_oem": "Schneider Electric", "inverter_model": None, "epc": "UGL", "source_url": "https://en.wikipedia.org/wiki/Tailem_Bend_Solar_Power_Farm"},
    {"project_id": "karadoc-solar-farm", "panel_oem": "GCL", "panel_model": None, "inverter_oem": "SMA", "inverter_model": "Sunny Central 2750-EV", "epc": None, "source_url": "https://www.sma-australia.com.au/success-stories/karadoc-solar-farm-112-mw"},
    {"project_id": "sebastopol-solar-farm", "panel_oem": None, "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "Beon Energy Solutions", "source_url": "https://sebastopolsolarfarm.com/about-us/"},
    {"project_id": "west-wyalong-solar-farm", "panel_oem": None, "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "PCL Construction", "source_url": "https://www.pcl.com/au/en/our-work/west-wyalong-solar-project"},
    {"project_id": "wemen-solar-farm", "panel_oem": "Jinko Solar", "panel_model": None, "inverter_oem": "SMA", "inverter_model": "SMA 2500 SC-EV", "epc": "RCR / Laing O'Rourke", "source_url": "https://en.wikipedia.org/wiki/Wemen_Solar_Farm"},
    {"project_id": "beryl-solar-farm", "panel_oem": "LONGi", "panel_model": None, "inverter_oem": "Ingeteam", "inverter_model": None, "epc": None, "source_url": "https://www.gem.wiki/Beryl_solar_farm"},
    {"project_id": "hillston-sun-farm", "panel_oem": None, "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "Tranex Solar", "source_url": "https://hillstonsunfarm.com/"},
    {"project_id": "winton-solar-farm", "panel_oem": None, "panel_model": None, "inverter_oem": "Huawei", "inverter_model": "100kW string inverter", "epc": None, "source_url": "https://www.power-technology.com/data-insights/power-plant-profile-winton-solar-farm-australia/"},
    {"project_id": "moura-solar-farm", "panel_oem": None, "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "METKA EGN (Mytilineos)", "source_url": "https://www.ox2.com/australia/projects/moura-solar-farm"},
    {"project_id": "yatpool-solar-farm", "panel_oem": None, "panel_model": None, "inverter_oem": "SMA", "inverter_model": "MVPS 5500-S-AU", "epc": None, "source_url": "https://www.power-technology.com/data-insights/power-plant-profile-yatpool-solar-pv-park-australia/"},
    {"project_id": "girgarre-solar-farm", "panel_oem": "LONGi", "panel_model": None, "inverter_oem": "Ingeteam", "inverter_model": None, "epc": "Beon Energy Solutions", "source_url": "https://www.pv-tech.org/ingeteam-to-supply-inverters-for-93mw-victoria-australia-solar-pv-project/"},
    {"project_id": "clermont-solar-farm", "panel_oem": "Risen Energy", "panel_model": None, "inverter_oem": "SMA", "inverter_model": None, "epc": None, "source_url": "https://www.power-technology.com/data-insights/power-plant-profile-clermont-solar-farm-australia/"},

    # Batch 3: Small (<75 MW)
    {"project_id": "susan-river-solar-farm", "panel_oem": "BYD", "panel_model": None, "inverter_oem": "Ingeteam", "inverter_model": None, "epc": "Biosar", "source_url": "https://www.pv-magazine-australia.com/2019/02/07/egp-highlights-local-value-creation-as-95-mw-susan-river-project-completion/"},
    {"project_id": "emerald-solar-park", "panel_oem": "Canadian Solar", "panel_model": None, "inverter_oem": "SMA", "inverter_model": None, "epc": "RCR Tomlinson", "source_url": "https://en.wikipedia.org/wiki/Emerald_Solar_Park"},
    {"project_id": "goonumbla-solar-farm", "panel_oem": "Chint Solar", "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "Gransolar (GRS)", "source_url": "https://www.power-technology.com/marketdata/frv-goonumbla-solar-pv-park-australia/"},
    {"project_id": "rugby-run-solar-farm", "panel_oem": "Adani Solar", "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": None, "source_url": "https://www.bravus.com.au/our-businesses/rugby-run/"},
    {"project_id": "warwick-solar-farm", "panel_oem": None, "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "Lendlease", "source_url": "https://sustainability.uq.edu.au/warwicksolarfarm"},
    {"project_id": "childers-solar-farm", "panel_oem": "BYD", "panel_model": None, "inverter_oem": "Ingeteam", "inverter_model": None, "epc": "Biosar", "source_url": "https://www.pv-magazine-australia.com/2018/03/30/byd-signs-75mw-supply-deal-in-australia/"},
    {"project_id": "hamilton-solar-farm", "panel_oem": "Trina Solar", "panel_model": None, "inverter_oem": "SMA", "inverter_model": "Sunny Central 2500", "epc": "Bouygues", "source_url": "https://www.power-technology.com/marketdata/hamilton-solar-pv-park-australia/"},
    {"project_id": "moree-solar-farm", "panel_oem": "JA Solar", "panel_model": None, "inverter_oem": "Ingeteam", "inverter_model": "INGECON SUN PowerMax 1000TL M400", "epc": "Elecnor", "source_url": "https://www.power-technology.com/marketdata/moree-solar-farm-australia/"},
    {"project_id": "whitsunday-solar-farm", "panel_oem": "Trina Solar", "panel_model": None, "inverter_oem": "SMA", "inverter_model": "Sunny Central 2500", "epc": "Bouygues", "source_url": "https://www.power-technology.com/marketdata/whitsunday-solar-pv-park-australia/"},
    {"project_id": "oakey-2-solar-farm", "panel_oem": "Canadian Solar", "panel_model": "KuMax CS3U-340P", "inverter_oem": "SMA", "inverter_model": None, "epc": "Biosar", "source_url": "https://www.pv-magazine-australia.com/2019/12/07/long-read-what-broke-at-oakey/"},
    {"project_id": "broken-hill-solar-plant", "panel_oem": "First Solar", "panel_model": "CdTe thin film", "inverter_oem": "SMA", "inverter_model": None, "epc": "First Solar", "source_url": "https://www.agl.com.au/about-agl/how-we-source-energy/broken-hill-solar-plant"},
    {"project_id": "wyalong-solar-farm", "panel_oem": None, "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "METKA EGN (Metlen)", "source_url": "https://wyalongsolarfarm.com.au/"},
    {"project_id": "gannawarra-solar-farm", "panel_oem": "JA Solar", "panel_model": None, "inverter_oem": "SMA", "inverter_model": "Sunny Central 2500-EV", "epc": "RCR Tomlinson", "source_url": "https://www.sma-australia.com.au/references/gannawarra-solar-farm-victoria.html"},
    {"project_id": "hayman-solar-farm", "panel_oem": "First Solar", "panel_model": "CdTe thin film", "inverter_oem": None, "inverter_model": None, "epc": "RCR Tomlinson", "source_url": "https://reneweconomy.com.au/rcr-awarded-315m-daydream-hayman-solar-farm-projects-91887/"},
    {"project_id": "jemalong-solar", "panel_oem": "JinkoSolar", "panel_model": None, "inverter_oem": "SMA", "inverter_model": None, "epc": "Beon Energy Solutions", "source_url": "https://genexpower.com.au/50mw-jemalong-solar-project/"},
    {"project_id": "kidston-solar-project-phase-one", "panel_oem": "First Solar", "panel_model": "Series 4", "inverter_oem": "SMA", "inverter_model": None, "epc": "UGL", "source_url": "https://arena.gov.au/projects/kidston-solar-project-phase-1/"},
    {"project_id": "parkes-solar-farm", "panel_oem": "JA Solar", "panel_model": None, "inverter_oem": "SMA", "inverter_model": None, "epc": "Bouygues", "source_url": "https://www.power-technology.com/marketdata/parkes-solar-farm-australia/"},
    {"project_id": "manildra-solar-farm", "panel_oem": "First Solar", "panel_model": None, "inverter_oem": "SMA", "inverter_model": "Sunny Central 2500SC-EV", "epc": "RCR Tomlinson", "source_url": "https://www.rcrtom.com.au/latest-projects/manildra-solar-farm/"},
    {"project_id": "mokoan-solar-farm", "panel_oem": None, "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "European Energy", "source_url": "https://au.europeanenergy.com/solar/mokoan-solar-farm/"},
    {"project_id": "limondale-solar-farm-2", "panel_oem": "SunPower", "panel_model": "P-Series", "inverter_oem": "SMA", "inverter_model": "Sunny Central 2750-EV", "epc": None, "source_url": "https://www.pv-magazine-australia.com/2018/11/14/sma-to-supply-349-mw-limondale/"},
    {"project_id": "collinsville-pv", "panel_oem": "Trina Solar", "panel_model": "TSM-DE14A (355W)", "inverter_oem": "SMA", "inverter_model": "Sunny Central 2500-EV", "epc": "UGL", "source_url": "https://reneweconomy.com.au/ratch-appoints-epc-contractor-collinsville-solar-project-65055/"},
    {"project_id": "kingaroy-solar-farm", "panel_oem": None, "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "METKA EGN (Metlen)", "source_url": "https://kingaroysolarfarm.com.au/"},
    {"project_id": "corowa-solar-farm", "panel_oem": None, "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "METKA EGN (Metlen)", "source_url": "https://terrainsolar.com/our-projects/corowa-solar-farm/"},
    {"project_id": "junee-solar-farm", "panel_oem": None, "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "METKA EGN (Metlen)", "source_url": "https://terrainsolar.com/our-projects/junee-solar-farm/"},
    {"project_id": "kerang-solar-plant", "panel_oem": None, "panel_model": None, "inverter_oem": None, "inverter_model": None, "epc": "British Solar Renewables", "source_url": "https://kerangsolarplant.com/"},
    {"project_id": "molong-solar-farm", "panel_oem": None, "panel_model": None, "inverter_oem": "Ingeteam", "inverter_model": None, "epc": "Gransolar (GRS)", "source_url": "https://www.pv-magazine-australia.com/2020/05/27/gransolar-group-to-build-molong-solar-farm-in-nsw/"},
]

# ── HYDRO SUPPLIERS (34 projects) ──────────────────────────────────────────

HYDRO_SUPPLIERS = [
    {"project_id": "tumut-3", "turbine_oem": "Toshiba", "turbine_type": "Francis (reversible pump-turbine)", "turbine_count": 6, "generator_oem": "Melco (Mitsubishi Electric)", "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Tumut_Hydroelectric_Power_Station"},
    {"project_id": "murray-1", "turbine_oem": "Boving", "turbine_type": "Francis", "turbine_count": 10, "generator_oem": "ASEA", "refurbishment_oem": "Voith", "source_url": "https://en.wikipedia.org/wiki/Murray_Hydroelectric_Power_Station"},
    {"project_id": "upper-tumut", "turbine_oem": None, "turbine_type": "Francis", "turbine_count": 8, "generator_oem": None, "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Tumut_Hydroelectric_Power_Station"},
    {"project_id": "murray-2", "turbine_oem": "Hitachi", "turbine_type": "Francis", "turbine_count": 4, "generator_oem": "ASEA", "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Murray_Hydroelectric_Power_Station"},
    {"project_id": "blowering", "turbine_oem": None, "turbine_type": "Francis", "turbine_count": 1, "generator_oem": None, "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Blowering_Dam"},
    {"project_id": "guthega", "turbine_oem": None, "turbine_type": "Francis", "turbine_count": 2, "generator_oem": "English Electric", "refurbishment_oem": "Andritz", "source_url": "https://en.wikipedia.org/wiki/Guthega_Power_Station"},
    {"project_id": "bogong-mackay", "turbine_oem": "Toshiba", "turbine_type": "Francis (Bogong); Pelton (McKay Creek)", "turbine_count": 8, "generator_oem": "Toshiba", "refurbishment_oem": None, "source_url": "https://www.power-technology.com/projects/bogong-station/"},
    {"project_id": "dartmouth", "turbine_oem": None, "turbine_type": "Francis", "turbine_count": 1, "generator_oem": None, "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Dartmouth_Dam"},
    {"project_id": "eildon", "turbine_oem": None, "turbine_type": "Francis", "turbine_count": 4, "generator_oem": None, "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Eildon_Hydroelectric_Power_Station"},
    {"project_id": "west-kiewa", "turbine_oem": "GE", "turbine_type": "Francis", "turbine_count": 4, "generator_oem": None, "refurbishment_oem": "Alstom", "source_url": "https://en.wikipedia.org/wiki/Kiewa_Hydroelectric_Scheme"},
    {"project_id": "gordon", "turbine_oem": "Fuji Electric", "turbine_type": "Francis", "turbine_count": 3, "generator_oem": None, "refurbishment_oem": "GE", "source_url": "https://en.wikipedia.org/wiki/Gordon_Power_Station"},
    {"project_id": "poatina", "turbine_oem": "Boving", "turbine_type": "Pelton", "turbine_count": 6, "generator_oem": None, "refurbishment_oem": "Andritz", "source_url": "https://www.andritz.com/hydro-en/hydronews/hn34/poatina-australia"},
    {"project_id": "reece", "turbine_oem": "Fuji Electric", "turbine_type": "Francis", "turbine_count": 2, "generator_oem": None, "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Reece_Power_Station"},
    {"project_id": "catagunya-liapootah-wayatinah", "turbine_oem": "English Electric / Boving", "turbine_type": "Francis", "turbine_count": 8, "generator_oem": None, "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Wayatinah_Power_Station"},
    {"project_id": "john-butters", "turbine_oem": "Fuji Electric", "turbine_type": "Francis", "turbine_count": 1, "generator_oem": None, "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/John_Butters_Power_Station"},
    {"project_id": "tungatinah", "turbine_oem": "Boving", "turbine_type": "Francis", "turbine_count": 5, "generator_oem": None, "refurbishment_oem": "Alstom", "source_url": "https://en.wikipedia.org/wiki/Tungatinah_Power_Station"},
    {"project_id": "trevallyn", "turbine_oem": "English Electric", "turbine_type": "Francis", "turbine_count": 4, "generator_oem": None, "refurbishment_oem": "Alstom", "source_url": "https://en.wikipedia.org/wiki/Trevallyn_Power_Station"},
    {"project_id": "cethana", "turbine_oem": "Fuji Electric", "turbine_type": "Francis", "turbine_count": 1, "generator_oem": None, "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Cethana_Power_Station"},
    {"project_id": "tarraleah", "turbine_oem": "English Electric / Boving", "turbine_type": "Pelton", "turbine_count": 6, "generator_oem": None, "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Tarraleah_Power_Station"},
    {"project_id": "tribute", "turbine_oem": "Fuji Electric", "turbine_type": "Francis", "turbine_count": 1, "generator_oem": None, "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Tribute_Power_Station"},
    {"project_id": "mackintosh", "turbine_oem": "Fuji Electric", "turbine_type": "Francis", "turbine_count": 1, "generator_oem": None, "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Mackintosh_Power_Station"},
    {"project_id": "bastyan", "turbine_oem": "Fuji Electric", "turbine_type": "Francis", "turbine_count": 1, "generator_oem": None, "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Bastyan_Power_Station"},
    {"project_id": "lemonthyme-wilmot", "turbine_oem": "Fuji Electric", "turbine_type": "Francis", "turbine_count": 2, "generator_oem": None, "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Lemonthyme_Power_Station"},
    {"project_id": "devils-gate", "turbine_oem": "Boving", "turbine_type": "Francis", "turbine_count": 1, "generator_oem": "Siemens", "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Devils_Gate_Power_Station"},
    {"project_id": "fisher", "turbine_oem": "Fuji Electric", "turbine_type": "Pelton", "turbine_count": 1, "generator_oem": None, "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Fisher_Power_Station"},
    {"project_id": "meadowbank", "turbine_oem": "Andritz", "turbine_type": "Kaplan", "turbine_count": 1, "generator_oem": None, "refurbishment_oem": "Andritz", "source_url": "https://www.andritz.com/hydro-en/hydronews/27/hy-news-27-07-repulse-hydro"},
    {"project_id": "lake-echo", "turbine_oem": "English Electric", "turbine_type": "Francis", "turbine_count": 1, "generator_oem": None, "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Lake_Echo_Power_Station"},
    {"project_id": "repulse", "turbine_oem": "Boving", "turbine_type": "Kaplan", "turbine_count": 1, "generator_oem": None, "refurbishment_oem": "Andritz", "source_url": "https://www.andritz.com/hydro-en/hydronews/27/hy-news-27-07-repulse-hydro"},
    {"project_id": "paloona", "turbine_oem": "Fuji Electric", "turbine_type": "Kaplan", "turbine_count": 1, "generator_oem": None, "refurbishment_oem": "Andritz", "source_url": "https://en.wikipedia.org/wiki/Paloona_Power_Station"},
    {"project_id": "wivenhoe", "turbine_oem": "Toshiba", "turbine_type": "Francis (reversible pump-turbine)", "turbine_count": 2, "generator_oem": None, "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Wivenhoe_Power_Station"},
    {"project_id": "kareeya", "turbine_oem": None, "turbine_type": "Pelton", "turbine_count": 4, "generator_oem": None, "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Kareeya_Hydro_Power_Station"},
    {"project_id": "barron-gorge", "turbine_oem": None, "turbine_type": "Francis", "turbine_count": 2, "generator_oem": None, "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Barron_Gorge_Hydroelectric_Power_Station"},
    {"project_id": "shoalhaven", "turbine_oem": "Boving Fouress", "turbine_type": "Francis (reversible pump-turbine)", "turbine_count": 4, "generator_oem": None, "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Shoalhaven_Scheme"},
    {"project_id": "burrinjuck", "turbine_oem": None, "turbine_type": "Francis", "turbine_count": 3, "generator_oem": None, "refurbishment_oem": None, "source_url": "https://en.wikipedia.org/wiki/Burrinjuck_Power_Station"},
]


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    inserted = 0
    skipped = 0
    not_found = 0

    # ── Insert solar suppliers ──
    print("=== Solar Suppliers ===")
    for s in SOLAR_SUPPLIERS:
        pid = s['project_id']

        # Check project exists
        row = conn.execute("SELECT id FROM projects WHERE id = ?", (pid,)).fetchone()
        if not row:
            print(f"  NOT FOUND: {pid}")
            not_found += 1
            continue

        # Insert panel OEM (solar_oem)
        if s.get('panel_oem'):
            model = s.get('panel_model')
            existing = conn.execute(
                "SELECT id FROM suppliers WHERE project_id = ? AND role = 'solar_oem' AND supplier = ?",
                (pid, s['panel_oem'])
            ).fetchone()
            if not existing:
                conn.execute(
                    "INSERT INTO suppliers (project_id, role, supplier, model, source_url) VALUES (?, 'solar_oem', ?, ?, ?)",
                    (pid, s['panel_oem'], model, s.get('source_url'))
                )
                inserted += 1
            else:
                skipped += 1

        # Insert inverter OEM
        if s.get('inverter_oem'):
            model = s.get('inverter_model')
            existing = conn.execute(
                "SELECT id FROM suppliers WHERE project_id = ? AND role = 'inverter' AND supplier = ?",
                (pid, s['inverter_oem'])
            ).fetchone()
            if not existing:
                conn.execute(
                    "INSERT INTO suppliers (project_id, role, supplier, model, source_url) VALUES (?, 'inverter', ?, ?, ?)",
                    (pid, s['inverter_oem'], model, s.get('source_url'))
                )
                inserted += 1
            else:
                skipped += 1

        # Insert EPC
        if s.get('epc'):
            existing = conn.execute(
                "SELECT id FROM suppliers WHERE project_id = ? AND role = 'epc' AND supplier = ?",
                (pid, s['epc'])
            ).fetchone()
            if not existing:
                conn.execute(
                    "INSERT INTO suppliers (project_id, role, supplier, source_url) VALUES (?, 'epc', ?, ?)",
                    (pid, s['epc'], s.get('source_url'))
                )
                inserted += 1
            else:
                skipped += 1

    # ── Insert hydro suppliers ──
    print("\n=== Hydro Suppliers ===")
    for h in HYDRO_SUPPLIERS:
        pid = h['project_id']

        row = conn.execute("SELECT id FROM projects WHERE id = ?", (pid,)).fetchone()
        if not row:
            print(f"  NOT FOUND: {pid}")
            not_found += 1
            continue

        # Insert turbine OEM (hydro_oem)
        if h.get('turbine_oem'):
            model = h.get('turbine_type')
            existing = conn.execute(
                "SELECT id FROM suppliers WHERE project_id = ? AND role = 'hydro_oem' AND supplier = ?",
                (pid, h['turbine_oem'])
            ).fetchone()
            if not existing:
                conn.execute(
                    "INSERT INTO suppliers (project_id, role, supplier, model, quantity, source_url) VALUES (?, 'hydro_oem', ?, ?, ?, ?)",
                    (pid, h['turbine_oem'], model, h.get('turbine_count'), h.get('source_url'))
                )
                inserted += 1
            else:
                skipped += 1

        # Insert generator OEM if different
        if h.get('generator_oem'):
            existing = conn.execute(
                "SELECT id FROM suppliers WHERE project_id = ? AND role = 'hydro_oem' AND supplier = ?",
                (pid, h['generator_oem'])
            ).fetchone()
            if not existing:
                conn.execute(
                    "INSERT INTO suppliers (project_id, role, supplier, model, source_url) VALUES (?, 'hydro_oem', ?, ?, ?)",
                    (pid, h['generator_oem'], 'Generator', h.get('source_url'))
                )
                inserted += 1
            else:
                skipped += 1

        # Insert refurbishment OEM if present
        if h.get('refurbishment_oem'):
            existing = conn.execute(
                "SELECT id FROM suppliers WHERE project_id = ? AND role = 'hydro_oem' AND supplier = ?",
                (pid, h['refurbishment_oem'])
            ).fetchone()
            if not existing:
                conn.execute(
                    "INSERT INTO suppliers (project_id, role, supplier, model, source_url) VALUES (?, 'hydro_oem', ?, ?, ?)",
                    (pid, h['refurbishment_oem'], 'Refurbishment', h.get('source_url'))
                )
                inserted += 1
            else:
                skipped += 1

    conn.commit()
    conn.close()

    print(f"\n=== Results ===")
    print(f"  Inserted: {inserted}")
    print(f"  Skipped (duplicate): {skipped}")
    print(f"  Not found: {not_found}")
    print(f"  Total operations: {inserted + skipped + not_found}")


if __name__ == '__main__':
    main()
