export interface OnThisDayEvent {
  date: string        // "Month Day" display string, e.g. "26 January"
  year: number        // year it occurred
  title: string
  description: string
  source: string
  sourceUrl: string
}

/**
 * Keyed by "MM-DD". Each entry describes a significant date in First Nations
 * Australian history. The key covers the month and day only — year is stored
 * separately for display as a tag.
 */
export const ON_THIS_DAY: Record<string, OnThisDayEvent> = {
  // ── January ───────────────────────────────────────────────────────────────
  '01-26': {
    date: '26 January',
    year: 1788,
    title: 'Invasion / Survival Day',
    description:
      'The First Fleet raised the British flag at Sydney Cove, marking the beginning of colonisation and the dispossession of Aboriginal and Torres Strait Islander peoples from their sovereign lands.',
    source: 'National Museum of Australia',
    sourceUrl: 'https://www.nma.gov.au/defining-moments/resources/invasion-of-sydney-cove',
  },

  // ── February ──────────────────────────────────────────────────────────────
  '02-13': {
    date: '13 February',
    year: 2008,
    title: 'National Apology to the Stolen Generations',
    description:
      'Prime Minister Kevin Rudd delivered a formal apology to Aboriginal and Torres Strait Islander peoples, acknowledging the laws and policies that caused the forcible removal of children from their families.',
    source: 'Reconciliation Australia',
    sourceUrl:
      'https://www.reconciliation.org.au/reconciliation/the-apology/',
  },

  // ── March ─────────────────────────────────────────────────────────────────
  '03-20': {
    date: '20 March',
    year: 2004,
    title: 'Gough Whitlam delivers Gurindji land deeds',
    description:
      'On this date in 1972, Gough Whitlam (then Opposition Leader) visited the Wave Hill Walk-Off strikers — and in 1975 as Prime Minister poured soil into Vincent Lingiari\'s hands, symbolically returning Gurindji land.',
    source: 'National Museum of Australia',
    sourceUrl: 'https://www.nma.gov.au/defining-moments/resources/wave-hill-walk-off',
  },

  // ── April ─────────────────────────────────────────────────────────────────
  '04-09': {
    date: '9 April',
    year: 1966,
    title: 'Wave Hill Walk-Off begins',
    description:
      'Gurindji workers led by Vincent Lingiari walked off Wave Hill Station to protest exploitative wages and conditions, sparking a seven-year strike that became a pivotal moment in the land rights movement.',
    source: 'AIATSIS',
    sourceUrl: 'https://aiatsis.gov.au/explore/wave-hill-walk-off',
  },

  // ── May ───────────────────────────────────────────────────────────────────
  '05-26': {
    date: '26 May',
    year: 1998,
    title: 'National Sorry Day',
    description:
      'National Sorry Day is observed annually to acknowledge the mistreatment of Aboriginal and Torres Strait Islander peoples who were forcibly removed from their families — the Stolen Generations.',
    source: 'Reconciliation Australia',
    sourceUrl: 'https://www.reconciliation.org.au/reconciliation/national-sorry-day/',
  },
  '05-27': {
    date: '27 May',
    year: 1967,
    title: '1967 Referendum',
    description:
      'Australians voted overwhelmingly (90.77%) to amend the Constitution to count Aboriginal and Torres Strait Islander peoples in the national census and allow the Commonwealth to make laws for them.',
    source: 'Australian Electoral Commission',
    sourceUrl: 'https://www.aec.gov.au/Elections/referendums/1967_Referendum.htm',
  },
  '05-28': {
    date: '28 May',
    year: 2001,
    title: 'Reconciliation Week ends — Bridge Walks',
    description:
      'National Reconciliation Week (27 May – 3 June) closes. The week bookends the 1967 Referendum (27 May) and the Mabo Decision (3 June), and in 2000 saw more than 300,000 people walk across Sydney Harbour Bridge for reconciliation.',
    source: 'Reconciliation Australia',
    sourceUrl: 'https://www.reconciliation.org.au/our-work/national-reconciliation-week/',
  },

  // ── June ──────────────────────────────────────────────────────────────────
  '06-03': {
    date: '3 June',
    year: 1992,
    title: 'Mabo Decision',
    description:
      'The High Court of Australia overturned the legal fiction of terra nullius in Mabo v Queensland (No 2), recognising that Aboriginal and Torres Strait Islander peoples had a pre-existing system of law and connection to land — giving rise to native title.',
    source: 'High Court of Australia',
    sourceUrl: 'https://www.austlii.edu.au/cgi-bin/viewcase.pl?query=mabo&court=HCA&year=1992',
  },
  '06-21': {
    date: '21 June',
    year: 1938,
    title: 'NAIDOC Week begins',
    description:
      'NAIDOC Week (held in early July each year) celebrates the histories, cultures, and achievements of Aboriginal and Torres Strait Islander peoples. Its origins trace back to the 1938 Day of Mourning, which called for full citizenship rights.',
    source: 'NAIDOC',
    sourceUrl: 'https://www.naidoc.org.au/about/history',
  },

  // ── July ──────────────────────────────────────────────────────────────────
  '07-12': {
    date: '12 July',
    year: 1971,
    title: 'Aboriginal Flag first flown',
    description:
      'Designed by Luritja artist Harold Thomas, the Aboriginal Flag was first flown publicly at Victoria Square in Adelaide on this day, and has since become a nationally recognised symbol of Aboriginal Australia.',
    source: 'AIATSIS',
    sourceUrl: 'https://aiatsis.gov.au/explore/aboriginal-flag',
  },
  '07-23': {
    date: '23 July',
    year: 1976,
    title: 'Aboriginal Land Rights Act (NT) assented',
    description:
      'The Aboriginal Land Rights (Northern Territory) Act 1976 was the first successful piece of Federal legislation allowing Aboriginal people to claim land rights based on traditional ownership.',
    source: 'National Museum of Australia',
    sourceUrl: 'https://www.nma.gov.au/defining-moments/resources/aboriginal-land-rights-act',
  },

  // ── August ────────────────────────────────────────────────────────────────
  '08-03': {
    date: '3 August',
    year: 1975,
    title: 'Gurindji land returned — Daguragu',
    description:
      'Prime Minister Gough Whitlam poured soil into the hands of Vincent Lingiari at Daguragu (Wattie Creek), symbolically returning a portion of Gurindji Country to the traditional owners after their nine-year walk-off.',
    source: 'National Museum of Australia',
    sourceUrl: 'https://www.nma.gov.au/defining-moments/resources/wave-hill-walk-off',
  },
  '08-09': {
    date: '9 August',
    year: 1994,
    title: 'International Day of the World\'s Indigenous Peoples',
    description:
      'The United Nations marks this day annually to promote and protect the rights of the world\'s Indigenous peoples, including Aboriginal and Torres Strait Islander Australians.',
    source: 'United Nations',
    sourceUrl: 'https://www.un.org/en/observances/indigenous-day',
  },

  // ── September ─────────────────────────────────────────────────────────────
  '09-04': {
    date: '4 September',
    year: 2007,
    title: 'UN Declaration on the Rights of Indigenous Peoples adopted',
    description:
      'The United Nations General Assembly adopted the Declaration on the Rights of Indigenous Peoples (UNDRIP). Australia initially voted against it but endorsed it in 2009.',
    source: 'United Nations',
    sourceUrl: 'https://www.un.org/development/desa/indigenouspeoples/declaration-on-the-rights-of-indigenous-peoples.html',
  },
  '09-12': {
    date: '12 September',
    year: 1938,
    title: 'Day of Mourning',
    description:
      'A landmark civil rights conference held in Sydney by Aboriginal activists including William Cooper and Jack Patten, demanding full citizenship rights for Aboriginal people on the 150th anniversary of colonisation.',
    source: 'AIATSIS',
    sourceUrl: 'https://aiatsis.gov.au/explore/day-of-mourning',
  },

  // ── October ───────────────────────────────────────────────────────────────
  '10-26': {
    date: '26 October',
    year: 2019,
    title: 'Uluru climb permanently closed',
    description:
      'The Anangu people\'s request to close the climb of Uluru — Kata Tjuta National Park was finally honoured, with the iconic site permanently closed to climbing out of respect for its deep spiritual and cultural significance.',
    source: 'Parks Australia',
    sourceUrl: 'https://parksaustralia.gov.au/uluru/discover/culture/climbing/',
  },

  // ── November ──────────────────────────────────────────────────────────────
  '11-16': {
    date: '16 November',
    year: 1994,
    title: 'Native Title Act comes into force',
    description:
      'The Native Title Act 1993 came into force, establishing a legal framework for Aboriginal and Torres Strait Islander peoples to pursue native title claims over land following the Mabo decision.',
    source: 'AIATSIS',
    sourceUrl: 'https://aiatsis.gov.au/explore/native-title',
  },

  // ── December ──────────────────────────────────────────────────────────────
  '12-10': {
    date: '10 December',
    year: 1948,
    title: 'International Human Rights Day',
    description:
      'The UN commemorates the adoption of the Universal Declaration of Human Rights — a date particularly significant for Aboriginal and Torres Strait Islander peoples, who for much of Australia\'s history were excluded from basic rights the Declaration affirms.',
    source: 'United Nations',
    sourceUrl: 'https://www.un.org/en/observances/human-rights-day',
  },
}

/** Returns today's "MM-DD" key based on the local date. */
export function getTodayKey(): string {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${mm}-${dd}`
}
