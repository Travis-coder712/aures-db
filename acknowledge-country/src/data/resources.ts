import type { Resource } from './types'

export const RESOURCES: Resource[] = [
  // ── PODCASTS ──────────────────────────────────────────────────────────────
  {
    id: 'frontier-war-stories',
    type: 'podcast',
    title: 'Frontier War Stories',
    creator: 'Boe Spearim (Gamilaroi/Kooma)',
    description:
      'Covers the conflict and resistance between First Nations communities and colonial settlers from the late 18th century through the 1930s. Detailed, unflinching history told by a proud First Nations man. Essential listening for anyone wanting to understand Australia\'s frontier history.',
    url: 'https://www.abc.net.au/religion/frontier-war-stories/11598416',
    tags: ['history', 'resistance', 'colonisation'],
  },
  {
    id: 'word-up',
    type: 'podcast',
    title: 'Word Up',
    creator: 'Rudi Bremer (Gamilaraay)',
    description:
      'Dedicated to bringing Aboriginal languages back to life, one word at a time. Short, accessible episodes featuring words and phrases from Aboriginal languages across Australia, with context and cultural meaning.',
    url: 'https://www.abc.net.au/wordupapp',
    tags: ['language', 'culture', 'beginner-friendly'],
  },
  {
    id: 'blacademia',
    type: 'podcast',
    title: 'Blacademia',
    creator: 'Amy Thunig-McGregor (Gamilaroi)',
    description:
      'Conversations with First Nations academics, intellectuals and public thinkers. Explores how Aboriginal and Torres Strait Islander people are changing, leading and challenging Australian academia and public life.',
    url: 'https://anchor.fm/blacademia',
    tags: ['culture', 'education', 'contemporary'],
  },
  {
    id: 'custodial-care',
    type: 'podcast',
    title: 'Custodial Care',
    creator: 'Kirilly Dawn (Barkindji) & Ella Noah Bancroft (Bundjalung)',
    description:
      'Explores Indigenous ways of caring for country, community and self. Blends ecology, culture, healing and sovereign knowledge systems in a grounded, personal format.',
    url: 'https://open.spotify.com/show/custodial-care',
    tags: ['culture', 'environment', 'healing'],
  },
  {
    id: 'coming-out-blak',
    type: 'podcast',
    title: 'Coming Out, Blak',
    creator: 'Matika Little (Wiradjuri/Kamilaroi) & Courtney Hagen (Butchulla/Gubbi Gubbi)',
    description:
      'Celebrates the lived experiences of First Nations LGBTQIA+ community members. Honest, uplifting conversations about identity, culture, community, family and pride.',
    url: 'https://podcasts.apple.com/au/podcast/coming-out-blak',
    tags: ['culture', 'LGBTQIA', 'identity'],
  },
  {
    id: 'aiatsis-voices',
    type: 'podcast',
    title: 'AIATSIS — Voices of Power',
    creator: 'Australian Institute of Aboriginal and Torres Strait Islander Studies',
    description:
      'Conversations with First Nations leaders, thinkers, activists and artists recorded through AIATSIS. Features historical recordings alongside contemporary interviews, a unique archive of Aboriginal voices.',
    url: 'https://aiatsis.gov.au/whats-new/podcasts/voices-power',
    tags: ['history', 'culture', 'leadership'],
  },
  {
    id: 'yarning-up',
    type: 'podcast',
    title: 'Yarning Up',
    creator: 'Various First Nations creators',
    description:
      'Wide-ranging conversations with Aboriginal and Torres Strait Islander leaders, thinkers, business owners, activists and artists. A window into contemporary First Nations life across Australia.',
    url: 'https://podcasts.apple.com/au/podcast/yarning-up',
    tags: ['culture', 'contemporary', 'leadership'],
  },
  {
    id: 'snaicc-yarns',
    type: 'podcast',
    title: 'Kids, Culture, Community — SNAICC Yarns',
    creator: 'SNAICC — National Voice for our Children',
    description:
      'The official SNAICC podcast featuring voices of Aboriginal and Torres Strait Islander children, families and communities. Covers child welfare, culture, early childhood education and family support.',
    url: 'https://www.snaicc.org.au/snaicc-yarns-podcast/',
    tags: ['children', 'community', 'culture'],
  },
  // ── YOUTUBE ───────────────────────────────────────────────────────────────
  {
    id: 'nitv-youtube',
    type: 'youtube',
    title: 'NITV — National Indigenous Television',
    creator: 'SBS / NITV',
    description:
      'Australia\'s national Indigenous television channel. YouTube channel features news, documentaries, cultural content, interviews, and the award-winning "Living Black" current affairs program — all from First Nations perspectives.',
    url: 'https://www.youtube.com/channel/UCE9Ou-1a1nNn784pHPhKghQ',
    tags: ['news', 'documentary', 'culture'],
  },
  {
    id: 'abc-indigenous',
    type: 'youtube',
    title: 'ABC Indigenous',
    creator: 'ABC Australia',
    description:
      'ABC\'s dedicated First Nations YouTube channel with stories, documentaries, and features covering culture, language, history, politics and community across Australia.',
    url: 'https://www.youtube.com/channel/UCeL4bsWHfMBIoaPTlQDC64g',
    tags: ['news', 'culture', 'documentary'],
  },
  {
    id: 'australians-together-yt',
    type: 'youtube',
    title: 'Australians Together',
    creator: 'Australians Together',
    description:
      'Educational content covering colonisation, the Stolen Generations, intergenerational trauma, and reconciliation. Short, accessible explainer videos designed for classrooms and self-education.',
    url: 'https://www.youtube.com/@AustraliansTogether',
    tags: ['education', 'history', 'reconciliation'],
  },
  {
    id: 'aiatsis-yt',
    type: 'youtube',
    title: 'AIATSIS — Our Land, Our Stories',
    creator: 'Australian Institute of Aboriginal and Torres Strait Islander Studies',
    description:
      'Documentary and educational content from Australia\'s national Indigenous studies institute. The "Our Land, Our Stories" series explores different aspects of First Nations culture, history and sovereignty.',
    url: 'https://www.youtube.com/@AIATSISAboriginalStudies',
    tags: ['education', 'culture', 'history'],
  },
  {
    id: 'living-black',
    type: 'youtube',
    title: 'Living Black',
    creator: 'NITV',
    description:
      'Australia\'s premier Aboriginal and Torres Strait Islander current affairs program. Investigative journalism, community stories, and in-depth reporting on issues affecting First Nations communities. Running since 2008.',
    url: 'https://www.sbs.com.au/nitv/living-black',
    tags: ['current affairs', 'news', 'community'],
  },
  {
    id: 'stan-grant-youtube',
    type: 'youtube',
    title: 'Stan Grant — Speeches & Interviews',
    creator: 'Various',
    description:
      'Search YouTube for speeches and interviews by Wiradjuri journalist and author Stan Grant, particularly his powerful 2016 National Press Club address on racism and the Australian Dream, and his analysis of the Voice referendum.',
    url: 'https://www.youtube.com/results?search_query=stan+grant+aboriginal+speech',
    tags: ['speeches', 'contemporary', 'reconciliation'],
  },
  {
    id: 'first-australians',
    type: 'youtube',
    title: 'First Australians — Documentary Series',
    creator: 'Blackfella Films / SBS',
    description:
      'The landmark 7-part documentary series by Rachael Perkins covering the history of Australia from an Aboriginal perspective, from 1788 to the present. One of the most important Australian historical documentaries ever made.',
    url: 'https://www.sbs.com.au/ondemand/tv-series/first-australians',
    tags: ['history', 'documentary', 'essential'],
  },
  // ── WEBSITES ──────────────────────────────────────────────────────────────
  {
    id: 'aiatsis',
    type: 'website',
    title: 'AIATSIS — Australian Institute of Aboriginal and Torres Strait Islander Studies',
    creator: 'AIATSIS',
    description:
      'Australia\'s only national institution focused exclusively on the cultures and histories of Aboriginal and Torres Strait Islander peoples. Hosts the Austlang language database, AIATSIS Map of Indigenous Australia, extensive archives, and educational resources.',
    url: 'https://aiatsis.gov.au',
    tags: ['authoritative', 'research', 'languages', 'history'],
  },
  {
    id: 'reconciliation-australia',
    type: 'website',
    title: 'Reconciliation Australia',
    creator: 'Reconciliation Australia',
    description:
      'The national authority on reconciliation between Aboriginal and Torres Strait Islander peoples and other Australians. Provides guidance on Acknowledgement of Country protocols, runs Reconciliation Action Plans for organisations, and coordinates National Reconciliation Week.',
    url: 'https://www.reconciliation.org.au',
    tags: ['reconciliation', 'protocols', 'authoritative'],
  },
  {
    id: 'native-land',
    type: 'website',
    title: 'Native Land Digital — Interactive Territory Map',
    creator: 'Native Land Digital (Indigenous-led)',
    description:
      'Interactive map showing Indigenous territories, languages and treaty areas across Australia and worldwide. Enter any address to see whose country you are on. Community-curated and updated regularly.',
    url: 'https://native-land.ca',
    tags: ['map', 'territories', 'interactive'],
  },
  {
    id: 'uluru-statement',
    type: 'website',
    title: 'Uluru Statement from the Heart',
    creator: 'The Uluru Dialogue',
    description:
      'The official website for the Uluru Statement from the Heart — read the full statement, learn about the Makarrata Commission, treaty process, and truth-telling. Essential reading for understanding First Nations political aspirations.',
    url: 'https://ulurustatement.org',
    tags: ['sovereignty', 'treaty', 'contemporary'],
  },
  {
    id: 'creative-spirits',
    type: 'website',
    title: 'Creative Spirits',
    creator: 'Jens Korff',
    description:
      'One of Australia\'s most comprehensive websites about Aboriginal culture and history, with over 3,000 pages covering topics from the Stolen Generations to Dreaming stories, land rights, health, and contemporary life. Archived by the National Library of Australia.',
    url: 'https://www.creativespirits.info',
    tags: ['comprehensive', 'culture', 'history'],
  },
  {
    id: 'australians-together',
    type: 'website',
    title: 'Australians Together — Education Resources',
    creator: 'Australians Together',
    description:
      'Free curriculum-linked resources for Foundation to Year 10, developed with First Nations writers and academics. Covers colonisation, Stolen Generations, kinship systems, intergenerational trauma, and treaty. Ideal for educators and self-learners.',
    url: 'https://australianstogether.org.au',
    tags: ['education', 'curriculum', 'history'],
  },
  {
    id: 'nma-defining-moments',
    type: 'website',
    title: 'National Museum of Australia — Defining Moments',
    creator: 'National Museum of Australia',
    description:
      'The National Museum\'s authoritative resource covering key moments in Australian history including the Mabo Decision, Stolen Generations, Aboriginal Land Rights Act, Uluru Statement, and more — each with detailed, sourced historical context.',
    url: 'https://www.nma.gov.au/defining-moments',
    tags: ['history', 'authoritative', 'legislation'],
  },
  {
    id: 'first-languages',
    type: 'website',
    title: 'First Languages Australia',
    creator: 'First Languages Australia',
    description:
      'The national organisation supporting Aboriginal and Torres Strait Islander language revival and maintenance across Australia. Find information on specific language groups, revitalization programs, and how to support language communities.',
    url: 'https://www.firstlanguages.org.au',
    tags: ['language', 'revitalization', 'authoritative'],
  },
  {
    id: 'deadly-story',
    type: 'website',
    title: 'Deadly Story',
    creator: 'Deadly Story',
    description:
      'A community-oriented resource featuring an interactive map of Aboriginal Country, cultural explainers, community stories, media, podcasts, and art. The word "deadly" is Aboriginal English slang for "excellent" or "awesome."',
    url: 'https://deadlystory.com',
    tags: ['interactive', 'culture', 'community'],
  },
  {
    id: 'narragunnawali',
    type: 'website',
    title: 'Narragunnawali — Reconciliation in Schools',
    creator: 'Reconciliation Australia',
    description:
      'Education resources for early learning through secondary school, including lesson plans, professional development, and a platform for schools to develop Reconciliation Action Plans. Essential resource for educators.',
    url: 'https://www.narragunnawali.org.au',
    tags: ['education', 'schools', 'reconciliation'],
  },
  {
    id: 'aus-museum-firstnations',
    type: 'website',
    title: 'Australian Museum — First Nations',
    creator: 'Australian Museum',
    description:
      'The Australian Museum\'s First Nations collection and learning resources, including the "Unsettled" online exhibition about colonial encounters, the Stolen Generations, and contemporary Aboriginal culture.',
    url: 'https://australian.museum/learn/first-nations/',
    tags: ['culture', 'history', 'museum'],
  },
  {
    id: 'naidoc',
    type: 'website',
    title: 'NAIDOC Week',
    creator: 'NAIDOC',
    description:
      'The official NAIDOC website with information about National Aborigines and Islanders Day Observance Committee Week — held each July to celebrate the history, culture and achievements of Aboriginal and Torres Strait Islander peoples.',
    url: 'https://www.naidoc.org.au',
    tags: ['celebration', 'culture', 'annual'],
  },
  {
    id: 'human-rights-indigenous',
    type: 'website',
    title: 'Australian Human Rights Commission — First Nations Resources',
    creator: 'Australian Human Rights Commission',
    description:
      'Resources on First Nations rights, social justice reports, the Stolen Generations, native title, and the NT Emergency Response. The AHRC publishes an annual Social Justice and Native Title Report.',
    url: 'https://humanrights.gov.au/our-work/aboriginal-and-torres-strait-islander-social-justice/first-nations-resources',
    tags: ['rights', 'legislation', 'authoritative'],
  },
  {
    id: 'nitv-web',
    type: 'website',
    title: 'NITV — National Indigenous Television',
    creator: 'SBS / NITV',
    description:
      'Australia\'s dedicated national free-to-air Indigenous television channel (Freeview channel 34). Online access to news, documentaries, Living Black, and First Nations arts and culture content.',
    url: 'https://www.sbs.com.au/nitv',
    tags: ['news', 'culture', 'television'],
  },
]
