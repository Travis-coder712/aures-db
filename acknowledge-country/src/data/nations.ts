import type { Nation } from './types'

export const NATIONS: Nation[] = [
  // ── 1. GADIGAL ─────────────────────────────────────────────────────────────
  {
    id: 'gadigal',
    name: 'Gadigal',
    alternateNames: ['Cadigal', 'Gadigal (Eora Nation)'],
    nativeLandSlug: 'gadigal',
    region: 'Sydney CBD, Inner Sydney, Harbour foreshores',
    stateTerritory: 'NSW',
    traditionalCountry:
      'The Gadigal people are the Traditional Custodians of the land now known as Sydney\'s CBD and inner suburbs, along the southern shores of Port Jackson (Sydney Harbour) — from the Heads to Petersham, and the coastline from South Head around to the Cooks River.',
    nativePlaceName: { name: 'Warrane', englishName: 'Sydney Cove / the CBD area' },
    coordinates: { lat: -33.8688, lng: 151.2093 },
    websiteUrl: 'https://www.cityofsydney.nsw.gov.au/history/aboriginal-histories',
    language: {
      name: 'Biyal-biyal (Dharug)',
      family: 'Pama-Nyungan',
      status: 'revitalizing',
      revitalizationNotes:
        'The Gadigal language is a dialect of Dharug. Community groups including the Dharug Ngurra Aboriginal Corporation are working to revitalize the language through language classes and oral transmission.',
      revitalizationUrl: 'https://www.dharugnation.com.au/',
    },
    facts: [
      {
        text: 'The Gadigal are one of approximately 29 clans that make up the Eora Nation around Sydney Harbour. The word "Eora" means "here" or "from this place" in the language, and was used by Aboriginal people around Sydney to describe themselves to the early colonists.',
        category: 'culture',
        source: 'City of Sydney — Aboriginal Histories',
        sourceUrl: 'https://www.cityofsydney.nsw.gov.au/history/aboriginal-histories',
      },
      {
        text: 'Sydney Cove — where Arthur Phillip landed the First Fleet on 26 January 1788 — was called Warrane by the Gadigal people. Port Jackson (Sydney Harbour) was known as Cadi, and the Gadigal people are "the people of the place called Cadi."',
        category: 'land',
        source: 'Royal Botanic Garden Sydney — You are on Cadi',
        sourceUrl: 'https://www.botanicgardens.org.au/discover-and-learn/horticulture-and-history/you-are-cadi-traditional-lands-gadigal',
      },
      {
        text: 'Within a year of the First Fleet\'s arrival, a devastating smallpox epidemic swept through the Eora Nation. It is estimated that approximately 50% of the Gadigal and surrounding clans died. Only three Gadigal people were documented as surviving. The epidemic\'s origin remains historically contested, but the timing points strongly to contact with the First Fleet.',
        category: 'history',
        source: 'AIATSIS — Smallpox',
        sourceUrl: 'https://aiatsis.gov.au/explore/smallpox',
      },
      {
        text: 'Bennelong Point — now the site of the Sydney Opera House — is named after Woollarawarre Bennelong (c.1764–1813), a Wangal man (a neighbouring Eora clan). Bennelong became a key intermediary between Eora peoples and the British colony. In 1792 he travelled to England with Governor Phillip, becoming the first known Aboriginal Australian to visit Europe.',
        category: 'people',
        source: 'AIATSIS — Woollarawarre Bennelong',
        sourceUrl: 'https://aiatsis.gov.au/explore/woollarawarre-bennelong',
      },
      {
        text: 'The suburb of Redfern in inner Sydney — part of Gadigal country — became the heartland of urban Aboriginal identity and rights activism in the 1970s. The Redfern All Blacks football team and the Aboriginal Legal Service were among the community institutions that emerged from Redfern. In 1971, Aboriginal activists set up a self-managed medical service in Redfern, the first Aboriginal Medical Service in Australia.',
        category: 'contemporary',
        source: 'Aboriginal Medical Service Redfern',
        sourceUrl: 'https://www.amsredfern.org.au/about-us',
      },
      {
        text: 'The traditional diet of the Gadigal centred on the rich resources of Port Jackson. Archaeological evidence from Aboriginal shell middens (midden = a mound of shells, bones and tools left over generations) across the Sydney region shows continuous habitation and sophisticated use of harbour resources for tens of thousands of years.',
        category: 'culture',
        source: 'Australian Museum — First Nations Sydney',
        sourceUrl: 'https://australian.museum/learn/first-nations/',
      },
      {
        text: 'Elder Allen Madden, Gadigal man and descendant, has publicly estimated that several hundred Dharug people — including at least 100 Gadigal in his own family — live in Sydney today, maintaining their connection to Country despite centuries of colonisation.',
        category: 'people',
        source: 'City of Sydney — Aboriginal Histories',
        sourceUrl: 'https://www.cityofsydney.nsw.gov.au/history/aboriginal-histories',
      },
    ],
    acknowledgementTemplates: {
      brief: 'I acknowledge the Gadigal people of the Eora Nation as the Traditional Custodians of this land. I pay my respects to Elders past, present and emerging.',
      standard:
        'I would like to begin by acknowledging the Gadigal people of the Eora Nation as the Traditional Custodians of the land on which we gather today. The Gadigal have cared for this harbour country — which they call Cadi — for at least 65,000 years, and their connection to the land, waters and skies of Sydney remains deep and enduring. I extend my respects to all Aboriginal and Torres Strait Islander peoples here today, and to Elders past, present and emerging.',
      comprehensive:
        'I would like to begin by acknowledging the Gadigal people of the Eora Nation as the Traditional Custodians of the land we now call Sydney. The Gadigal are one of approximately 29 clans of the Eora Nation, whose deep connection to this harbour country — which they call Cadi — stretches back at least 65,000 years. We are gathered on the same land where the British First Fleet established the colony of New South Wales in 1788, at the place the Gadigal called Warrane — now known as Sydney Cove. Despite the devastating impact of colonisation — including the smallpox epidemic of 1789 that catastrophically reduced the Gadigal population — Gadigal descendants and the wider Eora community continue to maintain their culture, language, and connection to this country today. I acknowledge the immense and ongoing contribution of Aboriginal and Torres Strait Islander peoples to Australian life, and I extend my deepest respects to Elders past, present and emerging.',
    },
    commonWords: [
      { word: 'Eora', pronunciation: 'ee-OR-ah', meaning: 'Here / from this place — what Gadigal people called themselves to colonists' },
      { word: 'Cadi', pronunciation: 'KAH-dee', meaning: 'Port Jackson — Sydney Harbour, the heart of Gadigal country' },
      { word: 'Warrane', pronunciation: 'WAR-ran', meaning: 'Sydney Cove — where the First Fleet landed in 1788' },
      { word: 'Yura', pronunciation: 'YOO-rah', meaning: 'Person / people' },
      { word: 'Badu', pronunciation: 'BAH-doo', meaning: 'Water' },
      { word: 'Ngaya', pronunciation: 'NGAH-ya', meaning: 'I / me' },
    ],
    nativeTitle: {
      status: 'extinguished',
      notes: 'Native title over the Sydney CBD and inner suburbs is almost entirely extinguished due to the extensive granting of freehold titles since 1788 — one of the earliest such extinguishments in Australia. The Aboriginal Land Rights Act (NSW) 1983 returned some land to Local Aboriginal Land Councils. The Gadigal people continue to assert sovereignty and cultural connection to their country despite the absence of a formal native title determination. The City of Sydney funds ongoing Gadigal history and cultural programs.',
      source: 'National Native Title Tribunal',
      sourceUrl: 'https://www.nntt.gov.au/',
    },
  },

  // ── 2. WURUNDJERI ──────────────────────────────────────────────────────────
  {
    id: 'wurundjeri',
    name: 'Wurundjeri Woi Wurrung',
    alternateNames: ['Wurundjeri', 'Woiwurrung'],
    nativeLandSlug: 'wurundjeri',
    region: 'Melbourne, Yarra Valley, Dandenong Ranges, Mount Macedon ranges',
    stateTerritory: 'VIC',
    traditionalCountry:
      'The Wurundjeri are the Traditional Custodians of an area encompassing Melbourne and the Yarra Valley — from Port Phillip Bay in the south, north to Mount Disappointment, northwest to the Macedon Ranges, and east to Mount Baw Baw.',
    nativePlaceName: { name: 'Naarm', englishName: 'Melbourne / Port Phillip area' },
    coordinates: { lat: -37.8136, lng: 144.9631 },
    websiteUrl: 'https://www.wurundjeri.com.au',
    language: {
      name: 'Woiwurrung',
      family: 'Pama-Nyungan (Kulinic)',
      status: 'revitalizing',
      revitalizationNotes:
        'The Wurundjeri Woi Wurrung Cultural Heritage Aboriginal Corporation runs active language classes, naming services and cultural programs. The Victorian Aboriginal Corporation for Languages (VACL) supports revitalization.',
      revitalizationUrl: 'https://www.wurundjeri.com.au/services/language-naming/',
    },
    facts: [
      {
        text: 'The Wurundjeri are part of the Kulin Nation — an alliance of five Aboriginal nations with shared spiritual beliefs and reciprocal relationships: the Wurundjeri, Boonwurrung, Wathaurong (Wadawurrung), Dja Dja Wurrung, and Taungurong. The Mount William stone axe quarry on Wurundjeri country was a major trade hub, with greenstone (diorite) axe heads traded as far as NSW and South Australia.',
        category: 'culture',
        source: 'Wurundjeri Woi Wurrung Cultural Heritage Aboriginal Corporation',
        sourceUrl: 'https://www.wurundjeri.com.au',
      },
      {
        text: 'The name "Wurundjeri" derives from "wurun" — the name of a manna gum or witchetty tree — and "jeri," the grub found in that tree. They are literally "the witchetty grub people." Their country spans the Yarra River (Birrarung), which holds deep cultural and spiritual significance.',
        category: 'culture',
        source: 'Wikipedia — Wurundjeri (sourced from Yarra Healing)',
        sourceUrl: 'https://en.wikipedia.org/wiki/Wurundjeri',
      },
      {
        text: 'In 1835, John Batman signed a so-called "treaty" with eight Wurundjeri and Boonwurrung elders, claiming to purchase 600,000 acres for a basket of trade goods. Governor Richard Bourke declared the treaty null and void under the doctrine of terra nullius. This remains the most significant attempted treaty between colonists and Aboriginal people in Australia\'s pre-federation history.',
        category: 'history',
        source: 'Public Record Office Victoria',
        sourceUrl: 'https://prov.vic.gov.au',
      },
      {
        text: 'Elder William Barak (c.1824–1903) was one of the last traditionally initiated Wurundjeri men, a celebrated leader, advocate and artist. His bark paintings and drawings are held in national collections. His portrait appears on the facade of a building on Swanston Street in Melbourne (the "William Barak" building at Federation Square).',
        category: 'people',
        source: 'State Library Victoria',
        sourceUrl: 'https://www.slv.vic.gov.au',
      },
      {
        text: 'The Birrarung (Yarra River) is central to Wurundjeri cultural identity. "Birrarung" means "river of mists" or "place of mists and shadows." The river is an ancestral being in Wurundjeri tradition, not merely a geographical feature. Campaigns for the legal recognition of the Birrarung as a living entity have been led by Wurundjeri Elders.',
        category: 'spirituality',
        source: 'Wurundjeri Woi Wurrung Cultural Heritage Aboriginal Corporation',
        sourceUrl: 'https://www.wurundjeri.com.au',
      },
      {
        text: 'In 2000, the Reconciliation Walk across Princes Bridge in Melbourne drew an estimated 300,000 participants — the largest public demonstration in Australian history. The Walk for Reconciliation was a powerful expression of Australians\' desire for genuine reconciliation with Aboriginal and Torres Strait Islander peoples.',
        category: 'history',
        source: 'Reconciliation Australia',
        sourceUrl: 'https://www.reconciliation.org.au',
      },
    ],
    acknowledgementTemplates: {
      brief: 'I acknowledge the Wurundjeri Woi Wurrung people of the Kulin Nation as the Traditional Custodians of this land. I pay my respects to Elders past, present and emerging.',
      standard:
        'I would like to acknowledge the Wurundjeri Woi Wurrung people of the Kulin Nation as the Traditional Custodians of the land we gather on — the country they call Naarm. The Birrarung (Yarra River) has sustained Wurundjeri life and ceremony for tens of thousands of years. Their connection to Country remains unbroken. I pay my respects to Elders past, present and emerging, and extend that respect to all Aboriginal and Torres Strait Islander peoples joining us today.',
      comprehensive:
        'I begin by acknowledging the Wurundjeri Woi Wurrung people of the Kulin Nation as the Traditional Custodians of the land we now call Melbourne — the land they call Naarm. The Wurundjeri are one of five nations of the Kulin alliance, whose peoples have lived in this landscape for at least 40,000 years. The Birrarung — the Yarra River — is not merely a waterway but a living ancestor, central to Wurundjeri ceremony, culture and law. European settlement from 1835 brought rapid and devastating dispossession, yet the Wurundjeri have maintained their culture, language and connection to Country across generations. The Wurundjeri Woi Wurrung Cultural Heritage Aboriginal Corporation continues to speak for Country today. I extend my deepest respects to Elders past, present and emerging, and acknowledge the ongoing sovereignty of the Wurundjeri people over this land.',
    },
    commonWords: [
      { word: 'Wominjeka', pronunciation: 'woh-MIN-jeh-kah', meaning: 'Welcome / come in', notes: 'The traditional Wurundjeri greeting, now widely used at events across Victoria' },
      { word: 'Narrm', pronunciation: 'NARM', meaning: 'Melbourne — the Woi Wurrung name for the Port Phillip Bay area' },
      { word: 'Bunjil', pronunciation: 'BUN-jil', meaning: 'The wedge-tailed eagle — creator spirit of the Kulin Nation' },
      { word: 'Waa', pronunciation: 'WAH', meaning: 'Crow — the second moiety totem of the Kulin Nation; all people are either Bunjil or Waa' },
      { word: 'Moondani', pronunciation: 'MOON-dah-nee', meaning: 'To embrace / to hold — used in the name of Moondani Balluk Indigenous Academic Unit' },
      { word: 'Yaluk', pronunciation: 'YAH-luk', meaning: 'River' },
    ],
    nativeTitle: {
      status: 'partial',
      body: 'Wurundjeri Woi Wurrung Cultural Heritage Aboriginal Corporation',
      bodyUrl: 'https://www.wurundjeri.com.au',
      areaDescription: 'Traditional Wurundjeri country including parts of metropolitan Melbourne and the Yarra/Birrarung River corridor',
      wasContested: false,
      notes: 'Native title over Melbourne CBD is largely extinguished due to prior freehold grants. However, the Wurundjeri Woi Wurrung Cultural Heritage Aboriginal Corporation has negotiated recognition and co-management arrangements under Victoria\'s Traditional Owner Settlement Act 2010. The Wurundjeri are recognised as the Traditional Owners of the land for heritage and cultural purposes across a wide area. The Birrarung (Yarra River) was given formal recognition as a living entity with rights in 2017, partly reflecting Wurundjeri advocacy.',
      source: 'Wurundjeri Woi Wurrung Cultural Heritage Aboriginal Corporation',
      sourceUrl: 'https://www.wurundjeri.com.au',
    },
  },

  // ── 3. TURRBAL ────────────────────────────────────────────────────────────
  {
    id: 'turrbal',
    name: 'Turrbal',
    alternateNames: ['Turrbul', 'Yuggera/Turrbal'],
    nativeLandSlug: 'turrbal',
    region: 'Brisbane CBD, North Brisbane, Moreton Bay region',
    stateTerritory: 'QLD',
    traditionalCountry:
      'The Turrbal people are the Traditional Custodians of the land now known as Brisbane\'s CBD and northern suburbs, from the Pine River in the north to the Brisbane River in the south, and inland to the ranges. Together with the Jagera people (south bank), they are the custodians of the greater Brisbane region.',
    nativePlaceName: { name: 'Meanjin', englishName: 'Brisbane / the land at the tip of the peninsula' },
    coordinates: { lat: -27.4698, lng: 153.0251 },
    websiteUrl: 'https://www.turrbal.com.au',
    language: {
      name: 'Turrbal (Yuggera language group)',
      family: 'Pama-Nyungan (Durubalic branch)',
      status: 'endangered',
      revitalizationNotes:
        'The Turrbal language is critically endangered. Community efforts are underway to document and revitalize the language from historical records.',
    },
    facts: [
      {
        text: 'Brisbane (Meanjin) sits on the lands of both the Turrbal people (north bank) and the Jagera people (south bank and western areas). "Meanjin" is a Turrbal word referring to the land at the tip of a peninsula formed by the Brisbane River — a highly accurate geographic description of the CBD\'s location.',
        category: 'land',
        source: 'State Library of Queensland',
        sourceUrl: 'https://www.slq.qld.gov.au',
      },
      {
        text: 'The name "Turrbal" derives from "turr" (their word for a bora ring — a sacred ceremonial ground) and the suffix "-bal" meaning "those who say turr for a bora ring." The bora ring was central to Turrbal ceremonial life, used for initiation and gatherings.',
        category: 'culture',
        source: 'AIATSIS — Austlang E86 Turrbal',
        sourceUrl: 'https://aiatsis.gov.au/austlang/language/e86',
      },
      {
        text: 'Pre-contact, the Turrbal population has been estimated at over 3,000 people. Following the establishment of a penal settlement at Moreton Bay in 1825, frontier violence, disease, and dispossession dramatically reduced the population. Today, the Turrbal Aboriginal Corporation represents the ongoing Turrbal community.',
        category: 'history',
        source: 'Turrbal Aboriginal Tribe',
        sourceUrl: 'https://www.turrbal.com.au/our-story',
      },
      {
        text: 'Musgrave Park in South Brisbane is a gathering place of deep significance for Aboriginal communities in South East Queensland. It has been the site of major political gatherings, including protests during the 1982 Brisbane Commonwealth Games when Aboriginal activists brought international attention to land rights and deaths in custody.',
        category: 'contemporary',
        source: 'Brisbane City Council',
        sourceUrl: 'https://www.brisbane.qld.gov.au',
      },
      {
        text: 'The Jagera people, who share custodianship of the greater Brisbane region with the Turrbal, are the Traditional Owners of the south bank, West End, and areas extending to the Lockyer Valley and the Scenic Rim. Major events in Brisbane are typically acknowledged with respect to both the Turrbal and Jagera peoples.',
        category: 'culture',
        source: 'AIATSIS',
        sourceUrl: 'https://aiatsis.gov.au',
      },
    ],
    acknowledgementTemplates: {
      brief: 'I acknowledge the Turrbal and Jagera peoples as the Traditional Custodians of this land — Meanjin. I pay my respects to Elders past, present and emerging.',
      standard:
        'I would like to acknowledge the Turrbal people — the Traditional Custodians of the land we call Brisbane, known to them as Meanjin — and the Jagera people, whose country surrounds the southern parts of this great city. Their peoples have cared for this country for tens of thousands of years. I pay my deepest respects to Elders past, present and emerging, and to all Aboriginal and Torres Strait Islander peoples joining us today.',
      comprehensive:
        'I begin by acknowledging the Turrbal people as the Traditional Custodians of Meanjin — the land known today as Brisbane\'s CBD and northern suburbs. I also acknowledge the Jagera people, who hold custodianship of the south bank and western areas of the greater Brisbane region. Together, the Turrbal and Jagera have been the stewards of this river country for tens of thousands of years. The Brisbane River — and the rich ecosystems of Moreton Bay — sustained complex and vibrant cultures long before European settlement in 1825. Despite frontier violence, dispossession, and decades of assimilation policies, the Turrbal and Jagera peoples and their descendants continue to maintain their cultures and connections to Country today. I extend my deepest respects to Elders past, present and emerging.',
    },
    commonWords: [
      { word: 'Meaanjin', pronunciation: 'mee-AN-jin', meaning: 'Brisbane — "place of the spike rush" — now the official Aboriginal name used by Brisbane City Council' },
      { word: 'Yagara', pronunciation: 'yah-GAH-rah', meaning: 'The language spoken by Turrbal and Jagera peoples around Brisbane' },
      { word: 'Guwinmal', pronunciation: 'goo-WIN-mal', meaning: 'The Brisbane River — life-giving waterway at the heart of Turrbal country' },
      { word: 'Tulgi', pronunciation: 'TUL-ghee', meaning: 'Kangaroo' },
      { word: 'Bunya', pronunciation: 'BUN-yah', meaning: 'Bunya pine — a sacred tree and major food source; bunya festivals brought many nations together' },
    ],
    nativeTitle: {
      status: 'extinguished',
      notes: 'Native title over the Brisbane CBD and inner suburbs is largely extinguished by prior freehold and leasehold grants. Both the Turrbal Association and Jagera people maintain their cultural authority and are recognised as Traditional Owners for cultural heritage consultation purposes. Brisbane City Council formally adopted "Meaanjin" as the Aboriginal name for Brisbane. The Turrbal Association engages with government on planning and heritage matters.',
      source: 'National Native Title Tribunal',
      sourceUrl: 'https://www.nntt.gov.au/',
    },
  },

  // ── 4. KAURNA ─────────────────────────────────────────────────────────────
  {
    id: 'kaurna',
    name: 'Kaurna',
    alternateNames: ['Kaurna Yerta'],
    nativeLandSlug: 'kaurna',
    region: 'Adelaide Plains, Fleurieu Peninsula, Mount Lofty Ranges',
    stateTerritory: 'SA',
    traditionalCountry:
      'The Kaurna people are the Traditional Custodians of the Adelaide Plains (Kaurna Yerta). Their country extends from Crystal Brook in the north to Cape Jervis in the south, and inland to the Mount Lofty Ranges — encompassing the entirety of metropolitan Adelaide.',
    nativePlaceName: { name: 'Tarndanya', englishName: 'Adelaide — "Red Kangaroo Place"' },
    coordinates: { lat: -34.9285, lng: 138.6007 },
    websiteUrl: 'https://www.kaurnawarra.org.au',
    language: {
      name: 'Kaurna',
      family: 'Pama-Nyungan',
      status: 'revitalizing',
      speakerCount: 'No first-language speakers; over 1,000 entities now bear Kaurna names as of 2012',
      revitalizationNotes:
        'One of Australia\'s most successful language revitalization programs. Led by the Kaurna Warra Pintyanthi (KWP) project at the University of Adelaide with Elder Dr Lewis O\'Brien and Dr Alitya Rigney since the early 1990s.',
      revitalizationUrl: 'https://www.kaurnawarra.org.au',
    },
    facts: [
      {
        text: 'Adelaide (Tarndanya — "Red Kangaroo Place") is built on the Adelaide Plains, the traditional country of the Kaurna people. The Torrens River, which flows through Adelaide, is known in Kaurna as Karrawirra Pari — "Red Gum Forest River." The Mount Lofty Ranges to the east are called Yurrebilla.',
        category: 'land',
        source: 'South Australian Museum',
        sourceUrl: 'https://www.samuseum.sa.gov.au',
      },
      {
        text: 'The Kaurna language was one of the first Aboriginal languages to be extensively documented by European settlers. German Lutheran missionaries Clamor Schürmann and Christian Teichelmann recorded a vocabulary of over 2,000 Kaurna words and phrases in the 1830s and 1840s — an unusually rich early record that became the foundation for language revival.',
        category: 'language',
        source: 'Kaurna Warra Pintyanthi — History',
        sourceUrl: 'https://www.kaurnawarra.org.au/kaurna-people',
      },
      {
        text: 'From the 1990s, the Kaurna community — in partnership with linguist Dr Rob Amery at the University of Adelaide — has been revitalizing the Kaurna language through the Kaurna Warra Pintyanthi (KWP) project. By 2012, over 1,000 entities — from tram names ("Kari Munaintya") to university buildings, public artworks, streets, and community organisations — bore Kaurna names. This is a profound reclamation of linguistic identity.',
        category: 'language',
        source: 'Kaurna Warra Pintyanthi — University of Adelaide',
        sourceUrl: 'https://www.adelaide.edu.au/kwp',
      },
      {
        text: 'The Kaurna people maintain a rich ceremonial life connected to the Tjukurpa (Dreaming law). Tjilbruke, a significant Kaurna ancestral being, is associated with a Dreaming track along the Fleurieu Peninsula coast south of Adelaide. Sites along the track are protected as heritage places.',
        category: 'spirituality',
        source: 'South Australian Museum',
        sourceUrl: 'https://www.samuseum.sa.gov.au',
      },
      {
        text: 'The Kaurna community suffered extreme population loss through disease and violence following British settlement from 1836. The last known fluent first-language speaker, Ivaritji (c.1849–1929), was known to colonists as "Princess Amelia." Despite near-extinction of the language, Kaurna descendants maintained cultural continuity that has enabled today\'s revitalization.',
        category: 'history',
        source: 'SA History Hub — Kaurna People',
        sourceUrl: 'https://sahistoryhub.history.sa.gov.au/subjects/kaurna-people/',
      },
      {
        text: 'The annual NAIDOC celebrations in Adelaide are held at the Warriappendi School oval on Kaurna Yerta, and the City of Adelaide issues Kaurna language Welcome to Country at all major civic events. The Victoria Square roundabout — known in Kaurna as Tarntanyangga ("place of the red kangaroo") — is the site where the Aboriginal flag was first flown in 1971.',
        category: 'contemporary',
        source: 'City of Adelaide',
        sourceUrl: 'https://www.cityofadelaide.com.au',
      },
    ],
    acknowledgementTemplates: {
      brief: 'I acknowledge the Kaurna people as the Traditional Custodians of this land — Kaurna Yerta. I pay my respects to Elders past, present and emerging.',
      standard:
        'I would like to acknowledge the Kaurna people as the Traditional Custodians of the Adelaide Plains — Kaurna Yerta — the land they have called home for tens of thousands of years. We gather today in Tarndanya, the "place of the red kangaroo," beside the Karrawirra Pari — the Torrens River. I pay my respects to Kaurna Elders past, present and emerging, and to all Aboriginal and Torres Strait Islander peoples present today.',
      comprehensive:
        'I begin by acknowledging the Kaurna people as the Traditional Custodians of the Adelaide Plains — Kaurna Yerta — where we gather today in Tarndanya, the "place of the red kangaroo." The Kaurna have cared for this country for tens of thousands of years: hunting in the grasslands and wetlands of the plains, fishing the Karrawirra Pari (Torrens River), and performing ceremony in the foothills of Yurrebilla (the Mount Lofty Ranges). The Kaurna language, documented in the 1830s by Lutheran missionaries and nearly lost through colonisation, is today undergoing a remarkable revival through the dedicated work of the Kaurna community and the Kaurna Warra Pintyanthi project at the University of Adelaide. Over 1,000 places, institutions and objects now bear Kaurna names — a living testament to the enduring strength of Kaurna culture. I extend my deepest respects to Kaurna Elders past, present and emerging.',
    },
    commonWords: [
      { word: 'Yaitya', pronunciation: 'YI-chah', meaning: 'Hello / welcome' },
      { word: 'Tarntanya', pronunciation: 'TARN-tahn-yah', meaning: 'Adelaide — "place of the red kangaroo" — the official Kaurna name for the city' },
      { word: 'Parnta', pronunciation: 'PARN-tah', meaning: 'Kangaroo' },
      { word: 'Wirra', pronunciation: 'WIR-rah', meaning: 'Bush / forest' },
      { word: 'Tindo', pronunciation: 'TIN-doh', meaning: 'Sun' },
      { word: 'Kumangka', pronunciation: 'koo-MANG-kah', meaning: 'Tree' },
    ],
    nativeTitle: {
      status: 'extinguished',
      body: 'Kaurna Yerta Aboriginal Corporation',
      bodyUrl: 'https://www.kaurna.org.au',
      notes: 'Native title over metropolitan Adelaide is extinguished by prior Crown grants. However, the Kaurna people have achieved significant recognition through other means. The Kaurna language — once thought nearly lost — has been substantially revitalized since the 1990s through the work of linguist Rob Amery and the Kaurna community, using records made by German missionaries in the 1840s. The Kaurna Yerta Aboriginal Corporation represents Kaurna interests across the Adelaide Plains (Kaurna Yerta).',
      source: 'Kaurna Yerta Aboriginal Corporation',
      sourceUrl: 'https://www.kaurna.org.au',
    },
  },

  // ── 5. WHADJUK NOONGAR ────────────────────────────────────────────────────
  {
    id: 'whadjuk-noongar',
    name: 'Whadjuk Noongar',
    alternateNames: ['Whadjuk', 'Nyoongar', 'Noongar (Perth region)'],
    nativeLandSlug: 'noongar',
    region: 'Perth metropolitan area, Swan Coastal Plain',
    stateTerritory: 'WA',
    traditionalCountry:
      'The Whadjuk Noongar are one of 14 groups of the broader Noongar people. Their traditional country covers approximately 6,700 km² around the Swan River, from the coast to the Darling Scarp, east to York, south to Pinjarra, and north to Victoria Plains.',
    nativePlaceName: { name: 'Boorloo', englishName: 'Perth area' },
    coordinates: { lat: -31.9505, lng: 115.8605 },
    websiteUrl: 'https://www.noongarculture.org.au',
    language: {
      name: 'Noongar',
      family: 'Pama-Nyungan',
      status: 'revitalizing',
      speakerCount: 'Approximately 300 fluent and semi-fluent speakers',
      revitalizationNotes:
        'Revitalization through the Wirlomin Noongar Language and Stories Project, South West Aboriginal Land and Sea Council programs, and the Noongar Boodjar Language Cultural Resource Centre.',
      revitalizationUrl: 'https://www.noongar.org.au',
    },
    facts: [
      {
        text: 'Perth (Boorloo) and Fremantle (Walyalup) are built on Whadjuk Noongar country. The Swan River — Derbarl Yerrigan ("long river of the Swan") — is a culturally significant waterway at the heart of Whadjuk Noongar life. The Wagyl, a serpentine ancestral being, is said to have created the river system and is of central spiritual importance.',
        category: 'spirituality',
        source: 'Kaartdijin Noongar — Noongar Culture',
        sourceUrl: 'https://www.noongarculture.org.au',
      },
      {
        text: 'The Noongar people of south-west Western Australia have occupied their country for at least 45,000–50,000 years, supported by the region\'s Mediterranean-like climate and rich biodiversity. The Noongar people observe a unique six-season calendar — Birak, Bunuru, Djeran, Makuru, Djilba, and Kambarang — that marks ecological changes rather than the European four-season system.',
        category: 'culture',
        source: 'Kaartdijin Noongar — Seasons',
        sourceUrl: 'https://www.noongarculture.org.au/seasons/',
      },
      {
        text: 'Whadjuk warrior Yagan (c.1795–1833) fiercely resisted the colonial occupation of Noongar country. Declared an outlaw, he was killed and his head sent to England. After a 160-year campaign by Aboriginal communities, Yagan\'s head was repatriated from Liverpool Museum in 1997 and given a proper burial on Noongar country.',
        category: 'history',
        source: 'AIATSIS — Yagan',
        sourceUrl: 'https://aiatsis.gov.au',
      },
      {
        text: 'In 2015, the Federal Court of Australia confirmed the landmark South West Native Title Settlement — recognising Noongar native title rights and interests over the Perth metropolitan area and much of south-west WA. Valued at A$1.3 billion, it was one of Australia\'s largest native title agreements, covering approximately 200,000 km² of Noongar country.',
        category: 'sovereignty',
        source: 'South West Aboriginal Land and Sea Council',
        sourceUrl: 'https://www.noongar.org.au',
      },
      {
        text: 'Research at the University of Western Australia has found that Noongar oral traditions contain scientifically corroborated accounts of the flooding of the continental shelf as sea levels rose after the last Ice Age — events that occurred approximately 7,000 to 10,000 years ago. These stories are among the oldest verifiable oral histories ever documented.',
        category: 'culture',
        source: 'University of Western Australia Research',
        sourceUrl: 'https://research-repository.uwa.edu.au',
      },
      {
        text: 'Noongar people have two moieties (intermarrying halves): Wardungmat and Manitjmat, each with two "skins." This kinship system governs social relationships, marriage, and connection to Country — a complex governance structure that maintained social harmony for thousands of years.',
        category: 'culture',
        source: 'Kaartdijin Noongar — Noongar Culture',
        sourceUrl: 'https://www.noongarculture.org.au',
      },
    ],
    acknowledgementTemplates: {
      brief: 'I acknowledge the Whadjuk Noongar people as the Traditional Custodians of this land — Boorloo. I pay my respects to Elders past, present and emerging.',
      standard:
        'I would like to acknowledge the Whadjuk Noongar people as the Traditional Custodians of the land we gather on today — Boorloo. The Noongar people have cared for the country around the Derbarl Yerrigan (Swan River) for at least 45,000 years. Their culture and connection to Country remain strong and enduring. I pay my respects to Elders past, present and emerging, and acknowledge all Aboriginal and Torres Strait Islander peoples present today.',
      comprehensive:
        'I begin by acknowledging the Whadjuk Noongar people as the Traditional Custodians of the land we call Perth — Boorloo in the Noongar language. The Whadjuk are one of 14 groups of the broader Noongar Nation, whose peoples have occupied the south-west of Western Australia for at least 45,000 to 50,000 years. The Derbarl Yerrigan (Swan River) and its tributaries are not merely waterways but living parts of Noongar law and spirituality, shaped by the Wagyl — the ancestral serpent being. The Noongar people observe a unique six-season calendar that reflects deep ecological knowledge of this landscape. Despite the profound impacts of colonisation — including the dispossession of Whadjuk warrior Yagan whose head was taken to England — the Noongar people have maintained their culture and recently won recognition of their native title rights through the landmark South West Native Title Settlement of 2015. I extend my deepest respects to Whadjuk Noongar Elders past, present and emerging.',
    },
  },

  // ── 6. ARRERNTE ───────────────────────────────────────────────────────────
  {
    id: 'arrernte',
    name: 'Arrernte',
    alternateNames: ['Arrente', 'Aranda', 'Arunta', 'Eastern Arrernte'],
    nativeLandSlug: 'arrernte',
    region: 'Alice Springs, MacDonnell Ranges, Central Australian Desert',
    stateTerritory: 'NT',
    traditionalCountry:
      'The Arrernte people are the Traditional Custodians of a vast area of the Central Australian desert, centred on Alice Springs (Mparntwe) and the MacDonnell Ranges. Their country spans hundreds of kilometres of desert landscape.',
    nativePlaceName: { name: 'Mparntwe', englishName: 'Alice Springs — "the watering place"' },
    coordinates: { lat: -23.6980, lng: 133.8807 },
    language: {
      name: 'Arrernte',
      family: 'Arandic languages',
      status: 'active',
      speakerCount: 'Approximately 2,000–3,000 speakers across dialects',
      revitalizationNotes:
        'Arrernte is one of Australia\'s more widely spoken Aboriginal languages, still transmitted to children in some communities. Five main dialects: Eastern, Central, Northern, Western, and Lower Arrernte.',
    },
    facts: [
      {
        text: 'Alice Springs is known as Mparntwe in Eastern Arrernte — referencing the Atherreyurre waterhole in the Todd River. The Arrernte have occupied the Central Australian desert for at least 30,000 years, developing intimate ecological knowledge of one of Earth\'s most arid environments.',
        category: 'land',
        source: 'AIATSIS — Arrernte People',
        sourceUrl: 'https://aiatsis.gov.au',
      },
      {
        text: 'The Arrernte have one of the world\'s most complex social kinship systems, with eight intermarrying sections called "skin groups" (subsections). These skin groups govern marriage, determine ceremony responsibilities, dictate relationships between individuals, and connect people to specific sections of Country. The system remains in active use today.',
        category: 'culture',
        source: 'Australian Museum — First Nations Cultures',
        sourceUrl: 'https://australian.museum/learn/first-nations/',
      },
      {
        text: 'Albert Namatjira (1902–1959) was a Western Arrernte man who became one of Australia\'s most celebrated artists. His watercolour landscapes of the Central Australian desert achieved national and international acclaim. In 1957 he became the first Aboriginal person to be granted Australian citizenship — while the vast majority of Aboriginal Australians were still denied basic civil rights. He died just two years later.',
        category: 'people',
        source: 'National Gallery of Australia',
        sourceUrl: 'https://nga.gov.au',
      },
      {
        text: 'Emily Gap (Yeperenye) and Jessie Gap (Anthelke Atherre) are sacred Arrernte sites near Alice Springs, central to the Caterpillar Dreaming of the Eastern Arrernte. These sites are protected under the NT Heritage Conservation Act and the Aboriginal Land Rights Act 1976.',
        category: 'spirituality',
        source: 'Northern Territory Government Heritage',
        sourceUrl: 'https://nt.gov.au/environment/environment-data-maps/heritage-register',
      },
      {
        text: 'The Arrernte Dreaming (Altyerre) features creation ancestors including the Yeperenye, Ntyarlke and Utnerrengatye caterpillars and Akngwelye (wild dogs), whose movements across the landscape shaped the MacDonnell Ranges and the Todd River valley. Dreaming tracks from Mparntwe extend across vast distances, connecting to other nations\' country.',
        category: 'spirituality',
        source: 'Alice Springs Desert Park',
        sourceUrl: 'https://alicespringsdesertpark.com.au/connect-with-nature/people',
      },
      {
        text: 'The Aboriginal Land Rights (Northern Territory) Act 1976 — the first legislation in Australia recognising Aboriginal land rights — has resulted in approximately 50% of the NT land area being communally owned by Aboriginal peoples. Arrernte Traditional Owners exercise rights over significant areas of their ancestral country through this Act.',
        category: 'sovereignty',
        source: 'Central Land Council',
        sourceUrl: 'https://www.clc.org.au/the-alra/',
      },
    ],
    acknowledgementTemplates: {
      brief: 'I acknowledge the Arrernte people as the Traditional Custodians of this land — Mparntwe. I pay my respects to Elders past, present and emerging.',
      standard:
        'I would like to acknowledge the Arrernte people as the Traditional Custodians of Mparntwe — Alice Springs — and the surrounding MacDonnell Ranges country. The Arrernte have lived in and cared for this desert landscape for at least 30,000 years. Their profound knowledge of this seemingly harsh environment sustains culture, language and community to this day. I pay my respects to Arrernte Elders past, present and emerging.',
      comprehensive:
        'I begin by acknowledging the Arrernte people as the Traditional Custodians of Mparntwe — the place of the watering holes that we call Alice Springs. The Arrernte have occupied this Central Australian desert for at least 30,000 years, developing unparalleled ecological knowledge of an arid landscape that sustains extraordinary cultural life. Their Altyerre (Dreaming) ancestors — caterpillars, wild dogs, and many others — shaped the MacDonnell Ranges and the rivers that flow through them. The Arrernte speak one of Australia\'s more resilient Aboriginal languages, with thousands of speakers across multiple dialects. Among their most celebrated members is artist Albert Namatjira (1902–1959), whose watercolour landscapes revealed the beauty of Central Australia to the world. I extend my deepest respects to Arrernte Elders past, present and emerging, and acknowledge the ongoing custodianship of this remarkable country.',
    },
  },

  // ── 7. LARRAKIA ───────────────────────────────────────────────────────────
  {
    id: 'larrakia',
    name: 'Larrakia',
    alternateNames: ['Larakia', 'Saltwater People'],
    nativeLandSlug: 'larrakia',
    region: 'Darwin, Cox Peninsula, Belyuen',
    stateTerritory: 'NT',
    traditionalCountry:
      'The Larrakia people are the Traditional Custodians of the Darwin region, which they call Garramilla. Their country extends along the northern coastal areas of the Top End, including the Darwin Harbour and adjacent land and sea country.',
    nativePlaceName: { name: 'Garramilla', englishName: 'Darwin Harbour area' },
    coordinates: { lat: -12.4634, lng: 130.8456 },
    websiteUrl: 'https://www.larrakia.com',
    language: {
      name: 'Larrakia',
      family: 'Non-Pama-Nyungan',
      status: 'endangered',
      revitalizationNotes:
        'Larrakia language is being revitalized through programs supported by the Larrakia Nation Aboriginal Corporation and the Northern Land Council.',
      revitalizationUrl: 'https://www.larrakia.com',
    },
    facts: [
      {
        text: 'The Larrakia people have been custodians of the Darwin Harbour region — Garramilla — for at least 40,000 years. They are known as the "Saltwater People," with deep cultural connections to the coastal marine environment, including the tidal zones, mangrove systems, and offshore waters of the Arafura Sea.',
        category: 'culture',
        source: 'Larrakia Nation Aboriginal Corporation',
        sourceUrl: 'https://www.larrakia.com',
      },
      {
        text: 'The Larrakia Nation Aboriginal Corporation, established in 1997, is the representative body for Larrakia Traditional Custodians. It provides rangers, cultural heritage services, and supports the assertion of Larrakia rights and interests over sea and land country around Darwin.',
        category: 'contemporary',
        source: 'Larrakia Nation Aboriginal Corporation',
        sourceUrl: 'https://www.larrakia.com',
      },
      {
        text: 'Darwin (Garramilla) was the most bombed Australian city during World War II: Japanese forces conducted over 188 air raids between February 1942 and November 1943. During this period, Aboriginal people, including Larrakia, were forcibly evacuated from Darwin, their land commandeered for military purposes, and many were conscripted into wartime service without proper recognition or compensation.',
        category: 'history',
        source: 'Australian War Memorial',
        sourceUrl: 'https://www.awm.gov.au',
      },
      {
        text: 'Mindil Beach in Darwin — a beloved community gathering place and site of the famous Mindil Beach Sunset Market — sits on Larrakia country and has cultural and spiritual significance as a meeting place between the land and the sea. Larrakia Elders have led efforts to ensure this significance is respected in Darwin\'s development.',
        category: 'land',
        source: 'Northern Territory Government',
        sourceUrl: 'https://nt.gov.au',
      },
      {
        text: 'The Northern Territory Emergency Response ("the Intervention") of 2007 was particularly impactful on Darwin\'s Aboriginal communities. The intervention suspended the Racial Discrimination Act in the NT — an action the Australian Human Rights Commission subsequently found to be unjustified — and imposed sweeping measures on Aboriginal communities without their consent.',
        category: 'contemporary',
        source: 'Australian Human Rights Commission',
        sourceUrl: 'https://humanrights.gov.au/our-work/race-discrimination/projects/northern-territory-national-emergency-response-intervention',
      },
    ],
    acknowledgementTemplates: {
      brief: 'I acknowledge the Larrakia people as the Traditional Custodians of this land — Garramilla. I pay my respects to Elders past, present and emerging.',
      standard:
        'I would like to acknowledge the Larrakia people as the Traditional Custodians of the land and sea country we call Darwin — Garramilla in the Larrakia language. The Larrakia are the Saltwater People, whose profound connection to the coastal and marine environment of the Darwin Harbour region extends back at least 40,000 years. I pay my deepest respects to Larrakia Elders past, present and emerging.',
      comprehensive:
        'I begin by acknowledging the Larrakia people as the Traditional Custodians of Garramilla — Darwin and its harbour country. The Larrakia are the Saltwater People, whose spiritual, cultural and practical connection to the sea, tidal zones and coastal land of the Top End has endured for at least 40,000 years. Their Dreaming stories trace creation across the land and sea, connecting them to this place with a depth of intimacy that no colonial settlement can sever. Despite the disruptions of colonisation, the impact of the WWII bombing of Darwin, and the more recent Northern Territory Intervention, the Larrakia have maintained their culture and continue to speak for Country through the Larrakia Nation Aboriginal Corporation. I extend my deepest respects to Larrakia Elders past, present and emerging, and to all Aboriginal and Torres Strait Islander peoples present today.',
    },
  },

  // ── 8. PALAWA ─────────────────────────────────────────────────────────────
  {
    id: 'palawa',
    name: 'palawa',
    alternateNames: ['Tasmanian Aboriginal peoples', 'Pundjina'],
    nativeLandSlug: 'palawa',
    region: 'Tasmania (whole island)',
    stateTerritory: 'TAS',
    traditionalCountry:
      'The palawa are the Aboriginal peoples of Tasmania (lutruwita). They have inhabited the entire island, from the northern plains to the rugged southwest wilderness, for at least 35,000–40,000 years.',
    nativePlaceName: { name: 'Nipaluna', englishName: 'Hobart' },
    coordinates: { lat: -42.8821, lng: 147.3272 },
    websiteUrl: 'https://tacinc.com.au',
    language: {
      name: 'palawa kani',
      family: 'Unknown (isolated — cut off from mainland 10,000+ years ago)',
      status: 'reconstructed',
      speakerCount: 'Reconstructed; growing learner community',
      revitalizationNotes:
        'The Tasmanian Aboriginal Centre has led revitalization of palawa kani since the early 1990s, reconstructing a composite language from multiple historical documentary sources. The language is being actively taught to community members.',
      revitalizationUrl: 'https://tacinc.com.au/programs/palawa-kani/',
    },
    facts: [
      {
        text: 'The palawa (Tasmanian Aboriginal peoples) arrived in Tasmania at least 35,000–40,000 years ago, when it was connected to mainland Australia by a land bridge. When rising sea levels submerged the land bridge approximately 10,000 years ago, the palawa became one of the most geographically isolated human populations on Earth — a unique cultural and biological group who adapted to both the tropical-like north and the subarctic southwest.',
        category: 'history',
        source: 'AIATSIS',
        sourceUrl: 'https://aiatsis.gov.au',
      },
      {
        text: 'The Black War (c.1824–1831) was a period of intense frontier conflict between British settlers and palawa people. Combined with earlier dispossession and introduced disease, the palawa population collapsed from an estimated 3,000–15,000 to fewer than 300 within three decades of settlement.',
        category: 'history',
        source: 'National Museum of Australia',
        sourceUrl: 'https://www.nma.gov.au',
      },
      {
        text: 'In 1830, Governor Arthur implemented the "Black Line" — a military operation in which 2,200 soldiers, settlers, and convicts formed a human chain across much of Tasmania in an attempt to drive Aboriginal people onto a peninsula. The operation failed to capture a single Aboriginal person but is considered a deliberate attempt at ethnic cleansing.',
        category: 'history',
        source: 'National Museum of Australia',
        sourceUrl: 'https://www.nma.gov.au',
      },
      {
        text: 'Colonial claims that the palawa became "extinct" with the death of Truganini in 1876 were false. Palawa people — particularly the descendants of Aboriginal women and sealers who lived on the Bass Strait islands — have maintained continuous survival, culture and identity. The 2021 Census recorded approximately 29,000 people identifying as Aboriginal in Tasmania.',
        category: 'people',
        source: 'Australian Bureau of Statistics — 2021 Census',
        sourceUrl: 'https://www.abs.gov.au',
      },
      {
        text: 'The palawa kani language revitalization program — led by the Tasmanian Aboriginal Centre (TAC) since the early 1990s — has reconstructed a composite language from the records of multiple historical Tasmanian Aboriginal languages. The language is actively taught to community members and is featured in public signage, place names and Welcome to Country ceremonies.',
        category: 'language',
        source: 'Tasmanian Aboriginal Centre — palawa kani',
        sourceUrl: 'https://tacinc.com.au/programs/palawa-kani/',
      },
      {
        text: 'Hobart is known as Nipaluna in palawa kani. Cape Barren Island, in the Bass Strait, is Truwana — the island to which surviving Tasmanian Aboriginal people were transported in the 1830s. Paradoxically, life on Truwana and Wybalenna (Flinders Island) preserved some cultural continuity even as colonial authorities sought to manage the community\'s extinction.',
        category: 'land',
        source: 'Tasmanian Aboriginal Centre',
        sourceUrl: 'https://tacinc.com.au',
      },
    ],
    acknowledgementTemplates: {
      brief: 'I acknowledge the palawa people as the Traditional Custodians of this land — lutruwita (Tasmania). I pay my respects to Elders past, present and emerging.',
      standard:
        'I would like to acknowledge the palawa — the Aboriginal peoples of lutruwita (Tasmania) — as the Traditional Custodians of this land. Their ancestors have lived on this island for at least 35,000 years, developing a unique and remarkable culture during 10,000 years of geographic isolation. Despite profound colonial violence and false claims of extinction, the palawa people and their culture survive and thrive. I pay my deepest respects to Elders past, present and emerging.',
      comprehensive:
        'I begin by acknowledging the palawa — the Aboriginal peoples of lutruwita — as the Traditional Custodians of this island. The palawa arrived in Tasmania at least 35,000 years ago, and when the land bridge to the mainland was submerged 10,000 years ago, they became one of the most isolated human populations on Earth — developing a remarkable and distinct culture adapted to environments ranging from the northern grasslands to the subarctic southwest. The Black War of the 1820s and the colonial removal of survivors to Bass Strait islands nearly destroyed the palawa community. Yet palawa culture, identity and sovereignty have endured. The palawa kani language is being actively revitalized through the Tasmanian Aboriginal Centre. I extend my deepest respects to palawa Elders past, present and emerging, and acknowledge that we stand on Aboriginal land, always was and always will be.',
    },
  },

  // ── 9. YOLŊU ─────────────────────────────────────────────────────────────
  {
    id: 'yolngu',
    name: 'Yolŋu',
    alternateNames: ['Yolngu', 'Arnhem Land peoples'],
    nativeLandSlug: 'yolngu',
    region: 'Northeast Arnhem Land, NT',
    stateTerritory: 'NT',
    traditionalCountry:
      'The Yolŋu are the Aboriginal peoples of northeast Arnhem Land in the Northern Territory. Their country covers approximately 100,000 km² of land and sea, held under inalienable Aboriginal freehold title.',
    coordinates: { lat: -12.1785, lng: 136.7733 },
    language: {
      name: 'Yolŋu Matha',
      family: 'Non-Pama-Nyungan (Pama-Nyungan boundary)',
      status: 'active',
      speakerCount: 'Thousands of speakers across approximately 40 dialects',
      revitalizationNotes:
        'Yolŋu Matha is a group of closely related languages/dialects still widely spoken as everyday first languages in Yolŋu communities. English is often a third or fourth language for Yolŋu people.',
    },
    facts: [
      {
        text: 'The Yolŋu people have maintained one of Australia\'s most intact and living Aboriginal cultures. Yolŋu Matha languages — a group of approximately 40 related dialects — are still widely spoken in everyday life in Arnhem Land communities, where English is often a third or fourth language.',
        category: 'culture',
        source: 'AIATSIS',
        sourceUrl: 'https://aiatsis.gov.au',
      },
      {
        text: 'The Yirrkala Bark Petitions of 1963 are landmark documents in Australian constitutional and legal history. When the Menzies Government excised 140 square miles of the Arnhem Land Reserve for a bauxite mine without consulting Yolŋu people, Yolŋu leaders sent two petitions to Parliament — framed by traditional sacred bark paintings — asserting their land rights. Parliament formally acknowledged the petitions — the first time an Indigenous document had been recognised by the Australian Parliament.',
        category: 'sovereignty',
        source: 'Parliament of Australia — Yirrkala Bark Petitions',
        sourceUrl: 'https://www.aph.gov.au/Visit_Parliament/Art/Highlights/yirrkala_bark_petitions',
      },
      {
        text: 'The Yolŋu concept of Makarrata — a process of coming together after conflict, of a dispute being settled and two groups living well together — was adopted as a key element of the Uluru Statement from the Heart (2017), which called for a "Makarrata Commission" to supervise treaty-making and truth-telling.',
        category: 'sovereignty',
        source: 'Uluru Statement from the Heart',
        sourceUrl: 'https://ulurustatement.org',
      },
      {
        text: 'Yothu Yindi, the internationally acclaimed band fronted by the late Dr Yunupiŋu (Mandawuy Yunupingu) of the Gumatj clan, brought Yolŋu music, language and political advocacy to global audiences from the late 1980s. Their 1991 song "Treaty" became an anthem for Aboriginal rights, blending traditional Yolŋu instruments (yidaki/didgeridoo) with rock music.',
        category: 'culture',
        source: 'AIATSIS — Yothu Yindi',
        sourceUrl: 'https://aiatsis.gov.au',
      },
      {
        text: 'The Yolŋu have a complex cosmological system based on two moieties — Dhuwa and Yirritja — which govern all aspects of life from kinship and marriage to ceremony, sacred knowledge, art styles, and relationships to Country. Every person, clan, place, animal and spiritual being belongs to one of these two moieties.',
        category: 'spirituality',
        source: 'National Museum of Australia — Yalangbara/Yolngu',
        sourceUrl: 'https://www.nma.gov.au/exhibitions/yalangbara/yolngu',
      },
      {
        text: 'Before European contact, Yolŋu people maintained regular contact and trading relationships with Makassar (Indonesian) fishermen who came to harvest trepang (sea cucumbers) from Arnhem Land waters from at least the 18th century until colonial authorities banned the trade in 1907. This international trade is embedded in Yolŋu oral history, ceremony and art.',
        category: 'history',
        source: 'AIATSIS',
        sourceUrl: 'https://aiatsis.gov.au',
      },
    ],
    acknowledgementTemplates: {
      brief: 'I acknowledge the Yolŋu people as the Traditional Custodians of this land and sea country. I pay my respects to Elders past, present and emerging.',
      standard:
        'I would like to acknowledge the Yolŋu people as the Traditional Custodians of the land and sea country we gather on in northeast Arnhem Land. The Yolŋu have maintained one of the world\'s most intact living cultures for over 60,000 years. Their Yolŋu Matha languages remain vital first languages in everyday life. I pay my deepest respects to Yolŋu Elders past, present and emerging.',
      comprehensive:
        'I begin by acknowledging the Yolŋu people as the Traditional Custodians of this land and sea country in northeast Arnhem Land. The Yolŋu have lived on and cared for this country for over 60,000 years, maintaining one of the most intact living Aboriginal cultures in Australia. Their Yolŋu Matha languages — spoken as first languages in daily life — are extraordinary repositories of ecological, spiritual and legal knowledge. In 1963, Yolŋu leaders sent the landmark Bark Petitions to Parliament, asserting their sovereign rights to Country in one of the most significant acts of Aboriginal resistance in Australian history. The Yolŋu concept of Makarrata — coming together and making things right — now forms the basis of the call for an Australian treaty. I extend my deepest respects to Yolŋu Elders past, present and emerging.',
    },
  },

  // ── 10. NGUNNAWAL ─────────────────────────────────────────────────────────
  {
    id: 'ngunnawal',
    name: 'Ngunnawal',
    alternateNames: ['Ngunawal', 'Ngambri'],
    nativeLandSlug: 'ngunnawal',
    region: 'Canberra, ACT, Southern Tablelands NSW',
    stateTerritory: 'ACT',
    traditionalCountry:
      'The Ngunnawal people are the Traditional Custodians of the land on which Canberra, Australia\'s national capital, is built. Their country encompasses the ACT and surrounding areas of the Southern Tablelands of NSW.',
    nativePlaceName: { name: 'Ngambri / Kambera', englishName: 'Canberra — "meeting place"' },
    coordinates: { lat: -35.2809, lng: 149.1300 },
    language: {
      name: 'Ngunnawal',
      family: 'Pama-Nyungan',
      status: 'revitalizing',
      revitalizationNotes:
        'The Ngaiyuriija Ngunawal Language Group is leading revitalization from historical records, journals, and Elder knowledge.',
    },
    facts: [
      {
        text: 'Canberra\'s name comes from the Ngunnawal word "Kambera" (or "Ngambri"), meaning "meeting place" — an apt name for Australia\'s national capital. Ngunnawal people have occupied this country for at least 25,000 years, as evidenced by the Birrigai rock shelter near Tidbinbilla, dated to approximately 25,000 BP.',
        category: 'land',
        source: 'National Capital Authority',
        sourceUrl: 'https://www.nationalcapital.gov.au',
      },
      {
        text: 'The Aboriginal Tent Embassy was established on the lawns of Old Parliament House in Canberra on 26 January 1972 — on Ngunnawal country. Four Aboriginal activists erected a beach umbrella to protest the McMahon Government\'s rejection of Aboriginal land rights. The Embassy has been maintained, despite multiple forced demolitions, for over 50 years.',
        category: 'sovereignty',
        source: 'AIATSIS — Aboriginal Tent Embassy',
        sourceUrl: 'https://aiatsis.gov.au/explore/aboriginal-tent-embassy',
      },
      {
        text: 'Parliament House in Canberra — the seat of Australian democracy, built on Ngunnawal country — opened in 1988. It incorporates a significant mosaic forecourt based on a painting by Warlpiri/Luritja artist Michael Nelson Jagamara, representing meeting places and Indigenous governance principles.',
        category: 'culture',
        source: 'Parliament of Australia',
        sourceUrl: 'https://www.aph.gov.au',
      },
      {
        text: 'The Ngunnawal people practice a rich tradition of cultural burning — using low-intensity fire to manage the grasslands and woodland of the ACT region. This knowledge, developed over thousands of years, is now being integrated into the ACT Government\'s land management practices to reduce wildfire risk and restore ecological health.',
        category: 'culture',
        source: 'ACT Government — Ngunnawal Country',
        sourceUrl: 'https://www.act.gov.au/ngunnawal-country',
      },
      {
        text: 'The Molonglo River (Ngunawal-Bund in Ngunnawal) flows through Canberra and was dammed in 1964 to create Lake Burley Griffin. The flooding of the river valley for the lake submerged significant cultural and archaeological sites. Despite this, Ngunnawal people maintain cultural connection to the waterways of their country.',
        category: 'history',
        source: 'National Capital Authority',
        sourceUrl: 'https://www.nationalcapital.gov.au',
      },
    ],
    acknowledgementTemplates: {
      brief: 'I acknowledge the Ngunnawal people as the Traditional Custodians of this land — the meeting place. I pay my respects to Elders past, present and emerging.',
      standard:
        'I would like to acknowledge the Ngunnawal people as the Traditional Custodians of the land on which we gather — Canberra, known in Ngunnawal as Kambera, the "meeting place." Ngunnawal people have cared for this country for at least 25,000 years. It is fitting that Australia\'s national capital is built on land that Aboriginal people have used as a gathering place since time immemorial. I pay my respects to Ngunnawal Elders past, present and emerging.',
      comprehensive:
        'I begin by acknowledging the Ngunnawal people as the Traditional Custodians of this land — the place we call Canberra, known in Ngunnawal as Kambera, "the meeting place." It is deeply fitting that Australia\'s national capital occupies land that Aboriginal people have gathered on for at least 25,000 years, as evidenced by the Birrigai rock shelter nearby. The Ngunnawal people are master fire managers and ecological stewards of the grassy woodlands and wetlands of the ACT. On Ngunnawal country, on 26 January 1972, Aboriginal activists established the Aboriginal Tent Embassy outside Old Parliament House — one of the world\'s longest-running political protests for Indigenous land rights and recognition. I extend my deepest respects to Ngunnawal Elders past, present and emerging.',
    },
  },

  // ── 11. WIRADJURI ─────────────────────────────────────────────────────────
  {
    id: 'wiradjuri',
    name: 'Wiradjuri',
    nativeLandSlug: 'wiradjuri',
    region: 'Central-Western NSW (Bathurst, Orange, Dubbo, Wagga Wagga, Albury)',
    stateTerritory: 'NSW',
    traditionalCountry:
      'The Wiradjuri people are the Traditional Custodians of the largest Aboriginal nation in NSW and one of the largest in Australia. Their country covers approximately 97,000 km² of central-western NSW.',
    coordinates: { lat: -33.4194, lng: 149.5778 },
    language: {
      name: 'Wiradjuri',
      family: 'Pama-Nyungan (Wiradhuric branch)',
      status: 'revitalizing',
      revitalizationNotes:
        'Wiradjuri language is being revitalized through the Charles Sturt University project and community efforts. It is now taught in some NSW schools.',
      revitalizationUrl: 'https://about.csu.edu.au/community/initiatives/wiradjuri-language-and-cultural-heritage-recovery-project',
    },
    facts: [
      {
        text: 'The Wiradjuri are the Traditional Custodians of approximately 97,000 km² — roughly one-third of New South Wales. The name "Wiradjuri" means "people of the three rivers" — the Wambool (Macquarie), Kalari (Lachlan), and Murrumbidgee — the rivers that define and sustain their country.',
        category: 'land',
        source: 'AIATSIS — Austlang D10 Wiradjuri',
        sourceUrl: 'https://aiatsis.gov.au/austlang/language/d10',
      },
      {
        text: 'The Bathurst Wars (1822–1824) were a major frontier conflict between British colonists and Wiradjuri people, as the colonists sought the fertile grasslands and goldfields of central NSW. Governor Brisbane declared martial law in 1824. Under Wiradjuri resistance leaders including Windradyne ("Saturday"), Aboriginal fighters conducted a sustained guerrilla campaign against the occupation of their country.',
        category: 'history',
        source: 'AIATSIS — Frontier Wars',
        sourceUrl: 'https://aiatsis.gov.au',
      },
      {
        text: 'Olympic gold medallist Cathy Freeman (b. 1973) is a proud Wiradjuri and Kuku Yalanji woman. Her gold medal in the 400m at the 2000 Sydney Olympics — when she carried both the Australian and Aboriginal flags on her victory lap — was a defining cultural moment for Aboriginal Australia and for the nation.',
        category: 'people',
        source: 'Australian Olympic Committee',
        sourceUrl: 'https://olympics.com.au',
      },
      {
        text: 'Journalist, author and broadcaster Stan Grant is a prominent Wiradjuri man whose 2016 National Press Club speech on racism and the Australian Dream went viral globally, sparking a national conversation about Indigenous identity and belonging. His books on Australian history and identity have been widely read.',
        category: 'people',
        source: 'National Press Club of Australia',
        sourceUrl: 'https://www.npc.org.au',
      },
      {
        text: 'The Wiradjuri language revitalization program, anchored at Charles Sturt University in Bathurst, has been one of Australia\'s more successful language recovery efforts. Wiradjuri is now taught in some NSW primary and secondary schools, and a growing number of Wiradjuri people are learning to speak their ancestral language.',
        category: 'language',
        source: 'Charles Sturt University — Wiradjuri Language Project',
        sourceUrl: 'https://about.csu.edu.au/community/initiatives/wiradjuri-language-and-cultural-heritage-recovery-project',
      },
    ],
    acknowledgementTemplates: {
      brief: 'I acknowledge the Wiradjuri people as the Traditional Custodians of this land — the country of the three rivers. I pay my respects to Elders past, present and emerging.',
      standard:
        'I would like to acknowledge the Wiradjuri people as the Traditional Custodians of this land — the country they call home across the three great rivers: the Wambool, Kalari, and Murrumbidgee. The Wiradjuri are the Traditional Custodians of approximately 97,000 km² of central-western NSW, one of Australia\'s largest Aboriginal nations. I pay my respects to Wiradjuri Elders past, present and emerging.',
      comprehensive:
        'I begin by acknowledging the Wiradjuri people as the Traditional Custodians of this vast country of the three rivers — the Wambool (Macquarie), Kalari (Lachlan), and Murrumbidgee — that give the Wiradjuri their name and their life. The Wiradjuri are one of Australia\'s largest Aboriginal nations, with traditional country covering approximately 97,000 km² of central-western NSW. Wiradjuri people fiercely resisted colonial expansion during the Bathurst Wars of the 1820s, when frontier violence and martial law were imposed on their country. Among the most celebrated Wiradjuri people today are Olympic champion Cathy Freeman, whose gold-medal victory at the 2000 Sydney Olympics carrying the Aboriginal flag was a defining moment for the nation, and author Stan Grant, whose powerful writings on identity and race have contributed to the national conversation. I extend my deepest respects to Wiradjuri Elders past, present and emerging.',
    },
  },

  // ── 12. GAMILAROI ─────────────────────────────────────────────────────────
  {
    id: 'gamilaroi',
    name: 'Gamilaroi',
    alternateNames: ['Kamilaroi', 'Gomeroi', 'Gamilaraay'],
    nativeLandSlug: 'gamilaraay',
    region: 'Northern NSW tablelands and plains (Moree, Narrabri, Tamworth, Gunnedah, Lightning Ridge)',
    stateTerritory: 'NSW',
    traditionalCountry:
      'The Gamilaroi/Kamilaroi are one of Australia\'s largest Aboriginal nations. Their country covers approximately 75,000 km² of the fertile northern plains of NSW, from the Liverpool Plains in the south to the Queensland border.',
    coordinates: { lat: -30.0810, lng: 150.4505 },
    language: {
      name: 'Gamilaraay / Yuwaalaraay',
      family: 'Pama-Nyungan',
      status: 'revitalizing',
      revitalizationNotes:
        'Last fluent speakers passed in the 1950s, but the language is being revitalized through the ANU Gamilaraay Voices project and community programs. Now taught in some NSW schools.',
      revitalizationUrl: 'https://slll.cass.anu.edu.au/research/projects/gamilaraay-voices',
    },
    facts: [
      {
        text: 'The Brewarrina Fish Traps (Baiame\'s Ngunnhu) on the Barwon River in western NSW are one of the oldest human-constructed structures on Earth, estimated to be between 3,000 and 40,000 years old. Engineered by Gamilaroi and Ngemba peoples, the interconnected series of stone weirs, channels, and holding ponds were used to harvest, store, and share fish — a complex aquaculture system well before such technologies appeared elsewhere.',
        category: 'culture',
        source: 'AIATSIS',
        sourceUrl: 'https://aiatsis.gov.au',
      },
      {
        text: 'In February 1965, a group of 30 University of Sydney students — led by Wiradjuri man Charles Perkins — stopped in Moree (Gamilaroi country) during the Freedom Rides and challenged segregation at the Moree swimming pool, which banned Aboriginal people. Their action was broadcast nationally and shocked many Australians into awareness of racial discrimination.',
        category: 'history',
        source: 'Charles Perkins Centre, University of Sydney',
        sourceUrl: 'https://sydney.edu.au/charles-perkins-centre/',
      },
      {
        text: 'The Gamilaraay language is being revitalized through the ANU Gamilaraay Voices project. By 2016, there were 105 people who reported Gamilaraay as a language spoken at home in the Census. The language is now taught at primary and secondary schools in several northern NSW towns, including through community language programs.',
        category: 'language',
        source: 'ANU — Gamilaraay Voices Project',
        sourceUrl: 'https://slll.cass.anu.edu.au/research/projects/gamilaraay-voices',
      },
      {
        text: 'The Myall Creek Massacre of 1838 — in which 28 Gamilaroi people (mostly women, children, and elderly men) were murdered by colonists — was followed by the unprecedented conviction and execution of seven perpetrators. This was the first time perpetrators of an Aboriginal massacre were successfully prosecuted in Australian legal history.',
        category: 'history',
        source: 'National Museum of Australia — Myall Creek Massacre',
        sourceUrl: 'https://www.nma.gov.au/defining-moments/resources/myall-creek-massacre',
      },
    ],
    acknowledgementTemplates: {
      brief: 'I acknowledge the Gamilaroi people as the Traditional Custodians of this land. I pay my respects to Elders past, present and emerging.',
      standard:
        'I would like to acknowledge the Gamilaroi people as the Traditional Custodians of this country — one of Australia\'s great nations, whose territory spans the fertile plains and tablelands of northern NSW. The Gamilaroi have cared for this land for tens of thousands of years, leaving enduring marks of their ingenuity including the extraordinary Brewarrina Fish Traps. I pay my respects to Gamilaroi Elders past, present and emerging.',
      comprehensive:
        'I begin by acknowledging the Gamilaroi (also Kamilaroi or Gomeroi) people as the Traditional Custodians of this country — one of Australia\'s largest Aboriginal nations, whose territory covers the rich plains and tablelands of northern NSW. Among the most remarkable achievements of the Gamilaroi and their neighbours are the Brewarrina Fish Traps (Baiame\'s Ngunnhu) — a vast stone aquaculture system on the Barwon River, considered among the oldest human constructions on Earth. The Myall Creek Massacre of 1838, in which 28 Gamilaroi people were killed, and the subsequent prosecution of seven perpetrators, is a significant and painful moment in the history of Aboriginal and colonial relations. Today, the Gamilaraay language is being revitalized through community programs and university research. I extend my deepest respects to Gamilaroi Elders past, present and emerging.',
    },
  },

  // ── 13. GUNDITJMARA ───────────────────────────────────────────────────────
  {
    id: 'gunditjmara',
    name: 'Gunditjmara',
    alternateNames: ['Gunditmara'],
    nativeLandSlug: 'gunditjmara',
    region: 'South-West Victoria (Warrnambool, Portland, Hamilton area)',
    stateTerritory: 'VIC',
    traditionalCountry:
      'The Gunditjmara are the Traditional Custodians of approximately 7,000 km² of south-west Victoria, from the volcanic plains around Lake Condah to the coast near Portland and the ranges around Hamilton.',
    coordinates: { lat: -38.1590, lng: 141.9000 },
    websiteUrl: 'https://gunditjmara.org.au',
    language: {
      name: 'Gunditjmara',
      family: 'Pama-Nyungan (Kulinic)',
      status: 'endangered',
    },
    facts: [
      {
        text: 'The Budj Bim Cultural Landscape — centred on the volcanic Mount Budj Bim (Mount Eccles) in south-west Victoria — is a UNESCO World Heritage Site, listed in 2019. It features an extensive system of channels, weirs, and holding ponds built by Gunditjmara people to trap, store and harvest short-finned eels (kooyang). The system is at least 6,600 years old, predating the Egyptian pyramids.',
        category: 'culture',
        source: 'UNESCO World Heritage',
        sourceUrl: 'https://whc.unesco.org/en/list/1577',
      },
      {
        text: 'Gunditjmara oral traditions record the volcanic eruption of Budj Bim (Mount Eccles) in language that scientists believe describes an eruption approximately 34,000 years ago — potentially making this the world\'s oldest continuous oral account of a volcanic eruption. The research, published by the Royal Society of Victoria in 2020, supports the extraordinary antiquity of Aboriginal oral history.',
        category: 'culture',
        source: 'Royal Society of Victoria research (2020)',
        sourceUrl: 'https://www.rsv.org.au',
      },
      {
        text: 'Gunditjmara people built permanent, semi-circular stone houses — documented by early European observers in the early 19th century. These are among the few examples of permanent Aboriginal architecture observed by colonists and challenge the colonial narrative of all Aboriginal peoples as nomadic hunter-gatherers.',
        category: 'culture',
        source: 'AIATSIS',
        sourceUrl: 'https://aiatsis.gov.au',
      },
      {
        text: 'The Eumeralla Wars (c.1839–1860s) were a sustained conflict between Gunditjmara people and European settlers in south-west Victoria. The Gunditjmara fiercely defended their country, conducting raids and guerrilla warfare. Their resistance, in the context of the Budj Bim aquaculture system, represents the defence of a sophisticated economy and way of life.',
        category: 'history',
        source: 'AIATSIS — Eumeralla Wars',
        sourceUrl: 'https://aiatsis.gov.au',
      },
    ],
    acknowledgementTemplates: {
      brief: 'I acknowledge the Gunditjmara people as the Traditional Custodians of this land. I pay my respects to Elders past, present and emerging.',
      standard:
        'I would like to acknowledge the Gunditjmara people as the Traditional Custodians of this land in south-west Victoria. The Gunditjmara are the engineers of Budj Bim — a UNESCO World Heritage aquaculture system over 6,600 years old. Their connection to this volcanic country is profound and ancient. I pay my respects to Gunditjmara Elders past, present and emerging.',
      comprehensive:
        'I begin by acknowledging the Gunditjmara people as the Traditional Custodians of this volcanic country in south-west Victoria. The Gunditjmara built and maintained the Budj Bim Cultural Landscape — a sophisticated aquaculture system of channels, weirs, and holding ponds for harvesting kooyang (short-finned eels) that is at least 6,600 years old, listed as a UNESCO World Heritage Site in 2019. Their oral traditions carry memories of the volcanic eruption of Mount Budj Bim dating back an estimated 34,000 years — potentially the world\'s oldest oral account of a geological event. The Gunditjmara built permanent stone houses and fiercely resisted colonial invasion in the Eumeralla Wars. I extend my deepest respects to Gunditjmara Elders past, present and emerging.',
    },
  },

  // ── 14. ANANGU ────────────────────────────────────────────────────────────
  {
    id: 'anangu',
    name: 'Anangu',
    alternateNames: ['Pitjantjatjara', 'Yankunytjatjara', 'APY Lands peoples'],
    nativeLandSlug: 'anangu-pitjantjatjara-yankunytjatjara',
    region: 'Uluru-Kata Tjuta, APY Lands (SA/NT/WA border region)',
    stateTerritory: 'NT/SA',
    traditionalCountry:
      'The Anangu are the Traditional Custodians of the Uluru-Kata Tjuta region and the vast Western Desert country of the APY (Anangu Pitjantjatjara Yankunytjatjara) Lands — approximately 102,650 km² of inalienable freehold title.',
    nativePlaceName: { name: 'Uluru', englishName: 'Uluru (Ayers Rock)' },
    coordinates: { lat: -25.3444, lng: 131.0369 },
    websiteUrl: 'https://parksaustralia.gov.au/uluru/',
    language: {
      name: 'Pitjantjatjara / Yankunytjatjara',
      family: 'Pama-Nyungan (Western Desert)',
      status: 'active',
      speakerCount: 'Several thousand speakers; one of Australia\'s stronger Aboriginal languages',
      revitalizationNotes:
        'Pitjantjatjara and Yankunytjatjara are among Australia\'s healthiest Aboriginal languages, spoken as first languages in daily life by thousands of people across the APY Lands and in some urban communities.',
    },
    facts: [
      {
        text: 'Uluru (Ayers Rock) is a deeply sacred site within the Tjukurpa — the Anangu\'s spiritual law, creation and custodianship system. Uluru is not merely a landmark; it is a living document of Anangu law and history, inscribed with stories of ancestral beings who shaped the landscape during creation.',
        category: 'spirituality',
        source: 'Parks Australia — Uluru-Kata Tjuta National Park',
        sourceUrl: 'https://parksaustralia.gov.au/uluru/',
      },
      {
        text: 'On 26 October 2019, the climb of Uluru was permanently closed, fulfilling a decades-long request by the Anangu Traditional Custodians. The park board had recorded Anangu requests not to climb since 1985. Anangu greeted the closure with joy and profound relief. "The climb is now closed," they said, "forever."',
        category: 'contemporary',
        source: 'Parks Australia — Climbing',
        sourceUrl: 'https://parksaustralia.gov.au/uluru/do/climbing/',
      },
      {
        text: 'Uluru-Kata Tjuta National Park is jointly managed by the Anangu Traditional Custodians and Parks Australia under the Aboriginal Land Rights Act 1976. The park was handed back to the Anangu on 26 October 1985 and immediately leased back to the federal government as a national park — a model of land rights recognition.',
        category: 'sovereignty',
        source: 'Parks Australia',
        sourceUrl: 'https://parksaustralia.gov.au/uluru/',
      },
      {
        text: 'The Anangu Pitjantjatjara Yankunytjatjara (APY) Land Rights Act 1981 (SA) gave the Anangu inalienable freehold title over approximately 102,650 km² of land in South Australia — one of the most significant land rights grants in Australian history at that time.',
        category: 'sovereignty',
        source: 'AIATSIS',
        sourceUrl: 'https://en.wikipedia.org/wiki/Anangu_Pitjantjatjara_Yankunytjatjara',
      },
      {
        text: 'Pitjantjatjara and Yankunytjatjara are among Australia\'s most resilient Aboriginal languages. With several thousand speakers across the APY Lands and in some urban communities, they are spoken as everyday first languages — an extraordinary survival given the pressures of colonisation on Aboriginal languages nationally.',
        category: 'language',
        source: 'AIATSIS — Languages',
        sourceUrl: 'https://aiatsis.gov.au',
      },
    ],
    acknowledgementTemplates: {
      brief: 'I acknowledge the Anangu people as the Traditional Custodians of this country — the land of Uluru. I pay my respects to Elders past, present and emerging.',
      standard:
        'I would like to acknowledge the Anangu people as the Traditional Custodians of this country — the vast Western Desert and Uluru-Kata Tjuta region that they have cared for under Tjukurpa law for tens of thousands of years. Uluru is not a tourist attraction; it is a living sacred site that Anangu have permanently closed to climbing. I pay my deepest respects to Anangu Elders past, present and emerging.',
      comprehensive:
        'I begin by acknowledging the Anangu people as the Traditional Custodians of this country — the Western Desert lands and the Uluru-Kata Tjuta region, governed for thousands of years by their Tjukurpa: the law, spirituality, and wisdom of their creation ancestors. Uluru — the great sandstone monolith — is not merely iconic; it is a living sacred landscape inscribed with ancestral stories that the Anangu have kept alive for at least 30,000 years. The Anangu fought for and won inalienable freehold title over 102,650 km² of APY Lands in 1981 and received the handback of Uluru-Kata Tjuta National Park in 1985. In 2019, after decades of respectful request, the Anangu celebrated the permanent closure of the Uluru climb. Pitjantjatjara and Yankunytjatjara remain thriving first languages. I extend my deepest respects to Anangu Elders past, present and emerging.',
    },
  },

  // ── 15. BUNDJALUNG ────────────────────────────────────────────────────────
  {
    id: 'bundjalung',
    name: 'Bundjalung',
    alternateNames: ['Banjalang', 'Bandjalung'],
    nativeLandSlug: 'bundjalung',
    region: 'Northern NSW coast, Gold Coast hinterland (Lismore, Ballina, Byron Bay area)',
    stateTerritory: 'NSW/QLD',
    traditionalCountry:
      'The Bundjalung Nation comprises numerous related clans across the border regions of northern NSW and south-east QLD. Their country stretches from the Clarence River in the south to the Gold Coast hinterland in the north, taking in the rich coastal, river and rainforest country.',
    nativePlaceName: { name: 'Cavanbah', englishName: 'Byron Bay — "meeting place" or "bay of the bay"' },
    coordinates: { lat: -28.6473, lng: 153.6154 },
    language: {
      name: 'Bundjalung',
      family: 'Pama-Nyungan',
      status: 'revitalizing',
    },
    facts: [
      {
        text: 'The Bundjalung Nation is a confederation of approximately 20 or more related clans, occupying the border region of northern NSW and south-east QLD. Sites throughout this country contain evidence of Aboriginal occupation dating back at least 12,000 years, with some estimates suggesting far longer continuous habitation.',
        category: 'history',
        source: 'AIATSIS',
        sourceUrl: 'https://aiatsis.gov.au',
      },
      {
        text: 'Byron Bay — known as Cavanbah to the Arakwal people (a Bundjalung clan) — was a significant meeting place for clans across the wider Bundjalung Nation. The Arakwal National Park, co-managed by the Arakwal people and NSW National Parks and Wildlife Service, was established in 2001 through the first Indigenous land use agreement of its kind in NSW.',
        category: 'sovereignty',
        source: 'NSW National Parks and Wildlife Service',
        sourceUrl: 'https://www.nationalparks.nsw.gov.au',
      },
      {
        text: 'The Bundjalung Dreaming includes a unique creation narrative in which the Bundjalung ancestors arrived in Australia by canoe from a distant homeland across the sea — one of the few Australian creation stories involving overseas migration. The story is specific to the Bundjalung and has been carefully maintained across generations.',
        category: 'spirituality',
        source: 'AIATSIS',
        sourceUrl: 'https://aiatsis.gov.au',
      },
      {
        text: 'Australian boxing legend Anthony Mundine (b.1975) is a proud Bundjalung man who has been one of Australia\'s most prominent voices for Aboriginal rights throughout his athletic career, using international sporting platforms to advocate for First Nations recognition.',
        category: 'people',
        source: 'AIATSIS',
        sourceUrl: 'https://aiatsis.gov.au',
      },
    ],
    acknowledgementTemplates: {
      brief: 'I acknowledge the Bundjalung people as the Traditional Custodians of this land. I pay my respects to Elders past, present and emerging.',
      standard:
        'I would like to acknowledge the Bundjalung people as the Traditional Custodians of this rich coastal and river country. The Bundjalung Nation encompasses numerous related clans across northern NSW and south-east Queensland, whose deep connection to this subtropical landscape stretches back tens of thousands of years. I pay my respects to Bundjalung Elders past, present and emerging.',
      comprehensive:
        'I begin by acknowledging the Bundjalung people — a confederation of clans — as the Traditional Custodians of the country we gather on, encompassing the subtropical coastal, river and rainforest landscapes of northern NSW and south-east QLD. The Bundjalung have occupied this rich country for at least 12,000 years, sustaining diverse and vibrant cultures along the rivers, coast and hinterland. Byron Bay (Cavanbah) is a place of gathering for Bundjalung clans, now managed cooperatively through Arakwal National Park. I extend my deepest respects to Bundjalung Elders past, present and emerging.',
    },
  },

  // ── 16. DHARAWAL ─────────────────────────────────────────────────────────
  {
    id: 'dharawal',
    name: 'Dharawal',
    alternateNames: ['Tharawal'],
    nativeLandSlug: 'dharawal',
    region: 'Wollongong, South Sydney, Sutherland Shire, Shoalhaven',
    stateTerritory: 'NSW',
    traditionalCountry:
      'The Dharawal people are the Traditional Custodians of the coastal country from Botany Bay in the north to the Shoalhaven River in the south, including the Illawarra region around Wollongong.',
    coordinates: { lat: -34.4278, lng: 150.8931 },
    language: {
      name: 'Dharawal',
      family: 'Pama-Nyungan',
      status: 'revitalizing',
    },
    facts: [
      {
        text: 'Royal National Park — the world\'s second-oldest national park, established in 1879 on Dharawal country — contains over 100 known Aboriginal cultural heritage sites, including rock engravings depicting animals, humans, and spiritual beings, as well as axe-grinding grooves and ochre paintings.',
        category: 'culture',
        source: 'NSW National Parks and Wildlife Service',
        sourceUrl: 'https://www.nationalparks.nsw.gov.au',
      },
      {
        text: 'The Dharawal are known as the "Saltwater People," with deep cultural connections to the rich coastal environments between Botany Bay and the Shoalhaven. Dolphins and whales held special totemic and cultural significance for Dharawal people, who are known to have driven fish into nets with the assistance of dolphins — a remarkable documented example of human-animal cooperation.',
        category: 'culture',
        source: 'AIATSIS — Dharawal',
        sourceUrl: 'https://aiatsis.gov.au',
      },
      {
        text: 'Wollongong (Dharawal country) takes its name from the Dharawal word "Woolyungah," which is generally translated as "sound of the sea" or "hard ground near the water." The coal that powered Australia\'s industrial revolution was mined from Dharawal country with no recognition of or benefit to the Traditional Custodians.',
        category: 'history',
        source: 'AIATSIS — Dharawal',
        sourceUrl: 'https://aiatsis.gov.au',
      },
    ],
    acknowledgementTemplates: {
      brief: 'I acknowledge the Dharawal people as the Traditional Custodians of this land. I pay my respects to Elders past, present and emerging.',
      standard:
        'I would like to acknowledge the Dharawal people as the Traditional Custodians of this coastal and escarpment country. The Dharawal are the Saltwater People, whose deep connection to the coast between Botany Bay and the Shoalhaven stretches back tens of thousands of years. I pay my respects to Dharawal Elders past, present and emerging.',
      comprehensive:
        'I begin by acknowledging the Dharawal people — the Saltwater People — as the Traditional Custodians of this coast and escarpment country. The Dharawal have cared for the land between Botany Bay and the Shoalhaven for tens of thousands of years, developing deep knowledge of the coastal marine environment, including an extraordinary relationship with dolphins in traditional fishing practices. Royal National Park — one of the world\'s oldest national parks — sits on Dharawal country and contains significant rock art sites. I extend my deepest respects to Dharawal Elders past, present and emerging.',
    },
  },

  // ── 17. YORTA YORTA ───────────────────────────────────────────────────────
  {
    id: 'yorta-yorta',
    name: 'Yorta Yorta',
    nativeLandSlug: 'yorta-yorta',
    region: 'Murray-Darling junction, Echuca, Shepparton, Barmah',
    stateTerritory: 'VIC/NSW',
    traditionalCountry:
      'The Yorta Yorta people are the Traditional Custodians of the junction of the Murray and Goulburn rivers — a biodiversity hotspot encompassing wetlands, river red gum forests, and the Barmah-Millewa Forest.',
    coordinates: { lat: -36.1376, lng: 144.7503 },
    websiteUrl: 'https://yyac.com.au',
    language: {
      name: 'Yorta Yorta',
      family: 'Pama-Nyungan',
      status: 'revitalizing',
    },
    facts: [
      {
        text: 'The Barmah-Millewa Forest, on Yorta Yorta country at the junction of the Murray and Goulburn rivers, is the world\'s largest river red gum forest — a globally significant wetland and biodiversity hotspot that Yorta Yorta people have cared for and harvested sustainably for tens of thousands of years.',
        category: 'land',
        source: 'Murray-Darling Basin Authority',
        sourceUrl: 'https://www.mdba.gov.au',
      },
      {
        text: 'The Cummeragunja Walk-off of 1939 was the first Aboriginal strike in Australian history. Residents of the Cummeragunja mission on the Murray River walked off the station in protest against inhumane living conditions, lack of wages, and brutal management. Led by Jack Patten and William Cooper, the Walk-off became a symbol of Aboriginal resistance.',
        category: 'history',
        source: 'National Museum of Australia',
        sourceUrl: 'https://www.nma.gov.au',
      },
      {
        text: 'The Yorta Yorta native title case (1994–2002) became one of the most significant and controversial in Australian legal history. The High Court\'s ruling in Members of the Yorta Yorta Aboriginal Community v Victoria [2002] found that colonisation had extinguished their connection to country — a decision that devastated the community and was widely criticised by legal scholars and human rights advocates.',
        category: 'sovereignty',
        source: 'AustLII — High Court',
        sourceUrl: 'https://www.austlii.edu.au',
      },
    ],
    acknowledgementTemplates: {
      brief: 'I acknowledge the Yorta Yorta people as the Traditional Custodians of this land and water country. I pay my respects to Elders past, present and emerging.',
      standard:
        'I would like to acknowledge the Yorta Yorta people as the Traditional Custodians of this river country at the junction of the Murray and Goulburn. The Yorta Yorta have cared for the world\'s largest river red gum forest — the Barmah-Millewa Forest — and the Murray-Darling wetlands for thousands of years. I pay my respects to Yorta Yorta Elders past, present and emerging.',
      comprehensive:
        'I begin by acknowledging the Yorta Yorta people as the Traditional Custodians of the river country at the junction of the Murray and Goulburn rivers. The Barmah-Millewa Forest — the world\'s largest river red gum forest — is the ecological and cultural heart of Yorta Yorta country. In 1939, Yorta Yorta people led Australia\'s first Aboriginal strike when residents walked off the Cummeragunja mission in protest at exploitation and abuse. I extend my deepest respects to Yorta Yorta Elders past, present and emerging.',
    },
  },

  // ── 18. YUGAMBEH ──────────────────────────────────────────────────────────
  {
    id: 'yugambeh',
    name: 'Yugambeh',
    alternateNames: ['Kombumerri', 'Yugambeh-Bundjalung'],
    nativeLandSlug: 'yugambeh',
    region: 'Gold Coast, Tweed Heads, Northern Rivers',
    stateTerritory: 'QLD/NSW',
    traditionalCountry:
      'The Yugambeh people are the Traditional Custodians of the Gold Coast and surrounds, from the Tweed River in the south to the Logan River in the north, and inland to the McPherson Ranges.',
    nativePlaceName: { name: 'Kombumerri', englishName: 'Gold Coast region' },
    coordinates: { lat: -28.0167, lng: 153.4000 },
    websiteUrl: 'https://www.kombumerri.com.au',
    language: {
      name: 'Yugambeh',
      family: 'Pama-Nyungan',
      status: 'revitalizing',
    },
    facts: [
      {
        text: 'The Gold Coast (Kombumerri) is built on Yugambeh country. The spectacular beaches, estuaries, hinterland rainforests, and the Nerang River have been central to Yugambeh culture and economy for tens of thousands of years.',
        category: 'land',
        source: 'Kombumerri Aboriginal Corporation',
        sourceUrl: 'https://www.kombumerri.com.au',
      },
      {
        text: 'The Yugambeh language is related to Bundjalung and is part of the Pama-Nyungan family. The Yugambeh Museum in Beenleigh, run by the local Aboriginal community, preserves and promotes Yugambeh language and culture.',
        category: 'culture',
        source: 'Yugambeh Museum',
        sourceUrl: 'https://www.yugambeh.com',
      },
    ],
    acknowledgementTemplates: {
      brief: 'I acknowledge the Yugambeh people as the Traditional Custodians of this land — Kombumerri. I pay my respects to Elders past, present and emerging.',
      standard:
        'I would like to acknowledge the Yugambeh people as the Traditional Custodians of this country — the Gold Coast region, known as Kombumerri. The Yugambeh have cared for these spectacular coastal and hinterland landscapes for tens of thousands of years. I pay my respects to Yugambeh Elders past, present and emerging.',
      comprehensive:
        'I begin by acknowledging the Yugambeh people as the Traditional Custodians of Kombumerri — the Gold Coast. The Yugambeh have cared for these spectacular coastal landscapes, rainforest hinterlands, estuaries, and the Nerang River for tens of thousands of years. Before the development of the Gold Coast as a tourist destination, this country sustained rich and complex cultural life. I extend my deepest respects to Yugambeh Elders past, present and emerging.',
    },
  },

  // ── 19. GUBBI GUBBI ───────────────────────────────────────────────────────
  {
    id: 'gubbi-gubbi',
    name: 'Gubbi Gubbi',
    alternateNames: ['Kabi Kabi', 'Gabi Gabi'],
    nativeLandSlug: 'gubbi-gubbi',
    region: 'Sunshine Coast, Noosa, Gympie, Maleny',
    stateTerritory: 'QLD',
    traditionalCountry:
      'The Gubbi Gubbi (also Kabi Kabi) people are the Traditional Custodians of the Sunshine Coast and its hinterland, including what is now Noosa National Park.',
    coordinates: { lat: -26.3930, lng: 153.0839 },
    websiteUrl: 'https://kabikabi.org.au',
    language: {
      name: 'Gubbi Gubbi',
      family: 'Pama-Nyungan',
      status: 'revitalizing',
    },
    facts: [
      {
        text: 'Noosa National Park — one of Australia\'s most beautiful coastal national parks — sits on Gubbi Gubbi country. The Noosa River (Cooran), the Noosa headlands and the hinterland have been central to Gubbi Gubbi cultural life for millennia.',
        category: 'land',
        source: 'Kabi Kabi First Nations',
        sourceUrl: 'https://kabikabi.org.au',
      },
      {
        text: 'In 2020, the Queensland Government signed a recognition agreement with the Kabi Kabi people, acknowledging them as the Traditional Custodians of the Sunshine Coast region. This was an important step toward co-management of country.',
        category: 'sovereignty',
        source: 'Queensland Government',
        sourceUrl: 'https://www.qld.gov.au',
      },
    ],
    acknowledgementTemplates: {
      brief: 'I acknowledge the Gubbi Gubbi people as the Traditional Custodians of this land. I pay my respects to Elders past, present and emerging.',
      standard:
        'I would like to acknowledge the Gubbi Gubbi (Kabi Kabi) people as the Traditional Custodians of this beautiful coastal and hinterland country. The Gubbi Gubbi have cared for the Noosa River, the headlands, and the Sunshine Coast hinterland for thousands of years. I pay my respects to Gubbi Gubbi Elders past, present and emerging.',
      comprehensive:
        'I begin by acknowledging the Gubbi Gubbi (also Kabi Kabi) people as the Traditional Custodians of the Sunshine Coast country — the coastal and hinterland landscapes that include Noosa National Park, the Noosa River (Cooran), and the Blackall Range. The Gubbi Gubbi have cared for these rich subtropical landscapes for tens of thousands of years. I extend my deepest respects to Gubbi Gubbi Elders past, present and emerging.',
    },
  },

  // ── 20. BOONWURRUNG ───────────────────────────────────────────────────────
  {
    id: 'boonwurrung',
    name: 'Boonwurrung',
    alternateNames: ['Bunurong', 'Boon Wurrung'],
    nativeLandSlug: 'boon-wurrung',
    region: 'South Melbourne, Mornington Peninsula, Western Port Bay, Wilsons Promontory',
    stateTerritory: 'VIC',
    traditionalCountry:
      'The Boonwurrung are the Traditional Custodians of the southern coast of Port Phillip Bay, the Mornington Peninsula, and Western Port Bay, extending east to Wilsons Promontory.',
    coordinates: { lat: -38.2195, lng: 145.0375 },
    language: {
      name: 'Boonwurrung',
      family: 'Pama-Nyungan (Kulinic)',
      status: 'endangered',
      revitalizationNotes: 'Revitalization efforts are underway through community organizations.',
    },
    facts: [
      {
        text: 'The Boonwurrung are one of five nations of the Kulin Nation. Their country encompasses the entire southeastern shore of Port Phillip Bay, the Mornington Peninsula, and Western Port Bay, extending to the spectacular wilderness of Wilsons Promontory — called Wamoon in the Boonwurrung language.',
        category: 'land',
        source: 'Bunurong Land Council Aboriginal Corporation',
        sourceUrl: 'https://www.bunuronglc.org.au',
      },
      {
        text: 'Boonwurrung Elder Derrimut (c.1800–1864) is credited with warning the early Melbourne settlers in 1835 of a planned attack, potentially saving the colony. Despite this act of goodwill, Derrimut was later dispossessed of all his country. He reportedly said before his death: "What for me bring children? Country all gone."',
        category: 'history',
        source: 'State Library Victoria',
        sourceUrl: 'https://www.slv.vic.gov.au',
      },
    ],
    acknowledgementTemplates: {
      brief: 'I acknowledge the Boonwurrung people of the Kulin Nation as the Traditional Custodians of this land. I pay my respects to Elders past, present and emerging.',
      standard:
        'I would like to acknowledge the Boonwurrung people of the Kulin Nation as the Traditional Custodians of this coastal country on Port Phillip Bay\'s southern shores. The Boonwurrung have cared for the beaches, bay and hinterland of the Mornington Peninsula for tens of thousands of years. I pay my respects to Boonwurrung Elders past, present and emerging.',
      comprehensive:
        'I begin by acknowledging the Boonwurrung people of the Kulin Nation as the Traditional Custodians of this coastal and bay country. The Boonwurrung have cared for Port Phillip Bay\'s southern shores, Western Port Bay, the Mornington Peninsula, and the wilderness of Wilsons Promontory (Wamoon) for tens of thousands of years. The tragic story of Elder Derrimut — who helped the Melbourne settlers, only to be dispossessed of all his country — illuminates the profound injustice of colonisation. I extend my deepest respects to Boonwurrung Elders past, present and emerging.',
    },
  },
]

export function findNationById(id: string): Nation | undefined {
  return NATIONS.find((n) => n.id === id)
}

export function findNationByNativeLandSlug(slug: string): Nation | undefined {
  const s = slug.toLowerCase()
  return NATIONS.find((n) => n.nativeLandSlug?.toLowerCase() === s || n.id === s)
}

export function selectFacts(nation: Nation, count = 6): { nationFacts: typeof nation.facts } {
  const shuffled = [...nation.facts].sort(() => Math.random() - 0.5)
  return { nationFacts: shuffled.slice(0, Math.min(count, shuffled.length)) }
}
