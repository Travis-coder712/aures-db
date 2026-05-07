import type { HistoricalEvent } from './types'

export const LEGISLATION: HistoricalEvent[] = [
  {
    year: 1788,
    title: 'British colonisation begins — terra nullius',
    description:
      'The British Crown declared the continent of Australia "terra nullius" (land belonging to no one), ignoring the sophisticated legal systems, culture and sovereignty of over 500 Aboriginal and Torres Strait Islander nations. Governor Arthur Phillip established the colony of New South Wales on Gadigal country on 26 January.',
    significance:
      'This doctrine of terra nullius denied Aboriginal and Torres Strait Islander peoples any rights to their land and provided the legal basis for colonisation. It was not overturned until the Mabo Decision of 1992.',
    source: 'National Museum of Australia — Defining Moments',
    sourceUrl: 'https://www.nma.gov.au/defining-moments/resources/colonisation',
    category: 'milestone',
  },
  {
    year: 1789,
    title: 'Smallpox epidemic devastates Sydney Aboriginal peoples',
    description:
      'A severe smallpox epidemic swept through the Aboriginal populations of the Sydney basin approximately one year after the First Fleet\'s arrival. An estimated 50% of the Eora Nation — including the Gadigal, Dharug, and neighbouring peoples — died within months. The epidemic spread rapidly to nations further inland.',
    significance:
      'The epidemic was among the most catastrophic immediate impacts of colonisation, depopulating entire clans and disrupting the social and cultural fabric of Aboriginal societies around Sydney.',
    source: 'AIATSIS — Health and Disease',
    sourceUrl: 'https://aiatsis.gov.au/explore/smallpox',
    category: 'milestone',
  },
  {
    year: 1838,
    title: 'Myall Creek Massacre and first convictions',
    description:
      'On 10 June 1838, a group of 12 Gamilaroi and neighbouring Aboriginal people — mostly women, children, and old men — were murdered by a group of European stockmen at Myall Creek Station on the Gwydir River, NSW. In an unprecedented move, seven of the perpetrators were hanged after two trials.',
    significance:
      'The Myall Creek trials were the first successful prosecution in Australia for the killing of Aboriginal people. The hangings provoked outrage among settlers but established a legal principle that Aboriginal deaths could be prosecuted.',
    source: 'National Museum of Australia — Myall Creek Massacre',
    sourceUrl: 'https://www.nma.gov.au/defining-moments/resources/myall-creek-massacre',
    category: 'resistance',
  },
  {
    year: 1869,
    yearEnd: 1911,
    title: 'Aborigines Protection Acts — control and segregation',
    description:
      'Victoria passed the first Aborigines Protection Act in 1869. Within decades, every Australian colony and state had enacted similar legislation. These Acts gave government-appointed boards sweeping powers over Aboriginal peoples\' lives — where they lived, who they married, whether they could speak their language, and whether they could keep their children. Missions and reserves became instruments of control.',
    significance:
      'The Protection Acts systematised dispossession and control, laying the groundwork for decades of forced removal of children (the Stolen Generations) and destruction of culture and language.',
    source: 'AIATSIS — Reserves and Missions',
    sourceUrl: 'https://aiatsis.gov.au/explore/reserves-and-missions',
    category: 'legislation',
  },
  {
    year: 1901,
    title: 'Australian Constitution excludes Aboriginal peoples',
    description:
      'The Commonwealth of Australia Constitution Act came into force on 1 January 1901. Section 127 explicitly excluded "Aboriginal natives" from being counted in the census. Section 51(xxvi) — the "race power" — denied the Commonwealth the ability to make laws for "the aboriginal race in any State." Aboriginal and Torres Strait Islander peoples were not considered citizens in their own country.',
    significance:
      'Constitutional exclusion denied Aboriginal peoples citizenship, voting rights, and recognition. This was not corrected until the landmark 1967 Referendum.',
    source: 'Parliament of Australia — The 1967 Referendum',
    sourceUrl: 'https://www.aph.gov.au/Visit_Parliament/Art/Highlights/yirrkala_bark_petitions',
    category: 'legislation',
  },
  {
    year: 1910,
    yearEnd: 1970,
    title: 'The Stolen Generations — forced removal of children',
    description:
      'Under government assimilation policies, Aboriginal and Torres Strait Islander children were forcibly removed from their families and placed in missions, homes, and with white families. Governments, churches, and welfare authorities carried out these removals. Children were often forbidden to speak their language, denied knowledge of their heritage, and subjected to abuse. Estimates suggest between 1 in 10 and 1 in 3 children were removed in some regions.',
    significance:
      'The Stolen Generations caused profound intergenerational trauma that continues to affect Aboriginal and Torres Strait Islander communities today. The Bringing Them Home report (1997) and National Apology (2008) were key steps toward recognition and healing.',
    source: 'AIATSIS — Stolen Generations',
    sourceUrl: 'https://aiatsis.gov.au/explore/stolen-generations',
    category: 'milestone',
  },
  {
    year: 1938,
    title: 'Day of Mourning — first national Aboriginal political conference',
    description:
      'On 26 January 1938, the 150th anniversary of British colonisation, Aboriginal leaders including William Cooper, Pearl Gibbs, and Jack Patten held Australia\'s first national Aboriginal political conference in Sydney. They declared the day a "Day of Mourning" and passed resolutions demanding citizenship rights, an end to discrimination, and control over their own affairs.',
    significance:
      'The Day of Mourning is considered the beginning of the modern Aboriginal rights movement. 26 January remains a day of protest and reflection for many Aboriginal and Torres Strait Islander peoples.',
    source: 'AIATSIS — Day of Mourning',
    sourceUrl: 'https://aiatsis.gov.au/explore/day-of-mourning',
    category: 'resistance',
  },
  {
    year: 1963,
    title: 'Yirrkala Bark Petitions — first Indigenous document recognised by Parliament',
    description:
      'When the Menzies Government excised 140 square miles of the Arnhem Land Reserve for bauxite mining without consulting the Yolŋu people, Yolŋu leaders responded by sending two petitions to the Australian Parliament — framed by traditional bark paintings. The Yirrkala Bark Petitions, written in both Yolŋu Matha and English, protested the excision and asserted Yolŋu rights to their land.',
    significance:
      'Parliament formally acknowledged the Bark Petitions — the first time an Indigenous document had been recognised by the Australian Parliament. They are now displayed in Parliament House and are a pivotal moment in the land rights movement.',
    source: 'Parliament of Australia — Yirrkala Bark Petitions',
    sourceUrl: 'https://www.aph.gov.au/Visit_Parliament/Art/Highlights/yirrkala_bark_petitions',
    category: 'resistance',
  },
  {
    year: 1965,
    title: 'Freedom Rides — exposing racial segregation',
    description:
      'In February 1965, a group of Sydney University students led by Charles Perkins (Arrernte man) boarded a bus and toured rural NSW towns including Moree, Walgett, and Kempsey. They challenged racial segregation at swimming pools, cinemas, and bowling clubs, and publicised the appalling living conditions and discrimination faced by Aboriginal people.',
    significance:
      'The Freedom Rides brought national media attention to racial discrimination in Australia and directly contributed to public support for the 1967 Referendum. Charles Perkins went on to become a leading figure in Aboriginal rights advocacy.',
    source: 'Charles Perkins Centre, University of Sydney',
    sourceUrl: 'https://sydney.edu.au/charles-perkins-centre/',
    category: 'resistance',
  },
  {
    year: 1967,
    title: '1967 Referendum — Aboriginal people counted as citizens',
    description:
      'On 27 May 1967, Australians voted in a referendum to amend the Constitution to allow the Commonwealth to make laws for Aboriginal people and to count them in the national census. The YES vote won with 90.77% — the most successful referendum in Australian constitutional history. The date now marks the beginning of National Reconciliation Week.',
    significance:
      'The 1967 Referendum was a watershed moment that, for the first time, gave the Commonwealth power to act on behalf of Aboriginal people and formally recognised them as part of the Australian nation.',
    source: 'Australian Electoral Commission',
    sourceUrl: 'https://www.aec.gov.au/Elections/referendums/1967_Referendum.htm',
    category: 'milestone',
  },
  {
    year: 1971,
    title: 'Aboriginal flag first flown — designed by Harold Thomas',
    description:
      'The Aboriginal flag was designed by Luritja artist Harold Thomas and first flown on National Aborigines Day on 12 July 1971 at Victoria Square (Tarntanyangga) in Adelaide, on Kaurna country. The flag\'s design: black (representing Aboriginal peoples), red (earth, red ochre, spiritual relation to the land), and yellow circle (the sun, life-giver).',
    significance:
      'The Aboriginal flag quickly became a powerful symbol of Aboriginal identity and resistance. It was proclaimed an official Australian flag in 1995. Harold Thomas retains copyright over the design.',
    source: 'AIATSIS — Aboriginal Flag',
    sourceUrl: 'https://aiatsis.gov.au/explore/aboriginal-flag',
    category: 'culture',
  },
  {
    year: 1972,
    title: 'Aboriginal Tent Embassy established',
    description:
      'On 26 January 1972, four Aboriginal activists — Michael Anderson, Billy Craigie, Bertie Williams, and Tony Coorey — erected a beach umbrella on the lawns of Parliament House in Canberra to protest the McMahon Government\'s rejection of Aboriginal land rights. The "embassy" grew into a permanent protest encampment. It was forcibly demolished multiple times but always re-established.',
    significance:
      'The Tent Embassy remains one of the world\'s longest-running political protests and a powerful symbol of Aboriginal sovereignty and the ongoing struggle for land rights and recognition.',
    source: 'AIATSIS — Aboriginal Tent Embassy',
    sourceUrl: 'https://aiatsis.gov.au/explore/aboriginal-tent-embassy',
    category: 'resistance',
  },
  {
    year: 1975,
    title: 'Racial Discrimination Act passed',
    description:
      'The Racial Discrimination Act 1975 made racial discrimination unlawful in Australia, implementing Australia\'s obligations under the International Convention on the Elimination of All Forms of Racial Discrimination. The Act protects all Australians, and has been particularly significant for Aboriginal and Torres Strait Islander peoples.',
    significance:
      'The Act was a key protection against racial vilification and discrimination. Notably, it was suspended in the Northern Territory by the 2007 NT Emergency Response ("the Intervention").',
    source: 'Australian Human Rights Commission',
    sourceUrl: 'https://humanrights.gov.au/our-work/race-discrimination/racial-discrimination-act',
    category: 'legislation',
  },
  {
    year: 1976,
    title: 'Aboriginal Land Rights Act (NT) — first land rights law',
    description:
      'The Aboriginal Land Rights (Northern Territory) Act 1976 was the first law in Australia to recognise Aboriginal land rights. Initiated as an election promise by Gough Whitlam and passed under Malcolm Fraser, the Act granted inalienable freehold title — land that cannot be bought, sold, or compulsorily acquired — to Aboriginal people over unoccupied Crown Land in the NT.',
    significance:
      'As a result of the Act, about 50% of NT land and 85% of its coastline is now communally owned by Aboriginal peoples. It established the four Land Councils: Northern, Central, Tiwi, and Anindilyakwa.',
    source: 'Central Land Council — The ALRA',
    sourceUrl: 'https://www.clc.org.au/the-alra/',
    category: 'legislation',
  },
  {
    year: 1992,
    title: 'Mabo Decision — terra nullius overturned',
    description:
      'On 3 June 1992, the High Court of Australia delivered judgment in Mabo v Queensland (No. 2). Led by Meriam man Eddie Koiki Mabo, the 10-year legal case resulted in the unanimous rejection of terra nullius, recognising that Aboriginal and Torres Strait Islander peoples had legal rights to their land by virtue of their traditional laws and customs. Eddie Mabo died of cancer five months before the decision.',
    significance:
      'The Mabo Decision is one of the most significant in Australian legal history. It fundamentally changed the legal relationship between the Australian government and Aboriginal and Torres Strait Islander peoples, and led directly to the Native Title Act 1993.',
    source: 'National Museum of Australia — Mabo Decision',
    sourceUrl: 'https://www.nma.gov.au/defining-moments/resources/mabo-decision',
    category: 'milestone',
  },
  {
    year: 1993,
    title: 'Native Title Act — framework for land rights claims',
    description:
      'The Keating Government\'s Native Title Act 1993 established the legal framework for Aboriginal and Torres Strait Islander peoples to claim native title following the Mabo Decision. It established the National Native Title Tribunal (NNTT) and created pathways for recognition, protection, and compensation for native title. By 2025, over 647 native title determinations had been made.',
    significance:
      'The Act gave legal recognition to the continuing connection of Aboriginal and Torres Strait Islander peoples to their country, though the process for claiming native title has been complex and often prolonged.',
    source: 'National Native Title Tribunal',
    sourceUrl: 'https://www.nntt.gov.au/',
    category: 'legislation',
  },
  {
    year: 1997,
    title: 'Bringing Them Home — Stolen Generations report',
    description:
      'The Bringing Them Home report, produced by the National Inquiry into the Separation of Aboriginal and Torres Strait Islander Children from Their Families (chaired by Sir Ronald Wilson), was tabled in Parliament on 26 May 1997. It documented the systematic removal of children from their families and recommended a formal apology from all Australian governments.',
    significance:
      'The report brought national attention to the Stolen Generations and established 26 May as National Sorry Day. It took 11 years before Prime Minister Kevin Rudd delivered the formal National Apology in 2008.',
    source: 'Australian Human Rights Commission — Bringing Them Home',
    sourceUrl: 'https://bth.humanrights.gov.au/significance/historical-context-the-stolen-generations',
    category: 'milestone',
  },
  {
    year: 2007,
    title: 'NT Emergency Response — "the Intervention"',
    description:
      'In June 2007, the Howard Government launched the Northern Territory National Emergency Response, sending 600 army personnel and 70 police officers into 73 Aboriginal communities. The NTER suspended the Racial Discrimination Act in the NT, quarantined welfare payments, compulsorily acquired five-year leases over Aboriginal land, and introduced alcohol bans. It was declared a response to child abuse in a leaked report ("Little Children are Sacred"), though the report\'s authors stated they were not consulted.',
    significance:
      'The Intervention was widely criticised by Aboriginal rights groups and human rights bodies as racially discriminatory and ineffective. The suspension of the Racial Discrimination Act was later found to be unjustified by multiple inquiries.',
    source: 'Australian Human Rights Commission — NTER',
    sourceUrl: 'https://humanrights.gov.au/our-work/race-discrimination/projects/northern-territory-national-emergency-response-intervention',
    category: 'legislation',
  },
  {
    year: 2008,
    title: 'National Apology to the Stolen Generations',
    description:
      'On 13 February 2008, Prime Minister Kevin Rudd delivered the National Apology to Aboriginal and Torres Strait Islander peoples in the House of Representatives, particularly acknowledging the Stolen Generations. Over 10,000 people gathered outside Parliament House in Canberra and at public screenings across Australia. The apology was broadcast live nationally.',
    significance:
      'The National Apology was a historic acknowledgment of the profound injustice caused by Australia\'s past policies. While welcomed, Aboriginal advocates emphasised that an apology without compensation and structural change was insufficient.',
    source: 'Parliament of Australia — National Apology',
    sourceUrl: 'https://www.aph.gov.au/Visit_Parliament/Art/Highlights/national_apology',
    category: 'reconciliation',
  },
  {
    year: 2017,
    title: 'Uluru Statement from the Heart',
    description:
      'On 26 May 2017, following 13 Regional Dialogues across Australia involving over 1,200 First Nations delegates, the First Nations Constitutional Convention at Uluru issued the Uluru Statement from the Heart. It called for three things: a First Nations Voice to Parliament enshrined in the Constitution; a Makarrata Commission to supervise treaty-making; and a process of truth-telling.',
    significance:
      'The Uluru Statement is the most significant statement of First Nations political aspirations in Australian history. The constitutional Voice to Parliament was put to a referendum in 2023, which was defeated.',
    source: 'Uluru Statement from the Heart',
    sourceUrl: 'https://ulurustatement.org/the-statement/view-the-statement/',
    category: 'milestone',
  },
  {
    year: 2019,
    title: 'Uluru climb permanently closed',
    description:
      'On 26 October 2019, the climb of Uluru (Ayers Rock) was permanently closed after years of requests by the Anangu Traditional Custodians. Anangu had long asked that tourists respect Uluru as a sacred site and not climb it. The decision was made by the Uluru-Kata Tjuta National Park Board. Anangu greeted the closure with joy and relief.',
    significance:
      'The closure of the Uluru climb was a significant recognition of Anangu cultural authority over their sacred sites and a milestone in Australian cultural respect.',
    source: 'Parks Australia — Uluru-Kata Tjuta National Park',
    sourceUrl: 'https://parksaustralia.gov.au/uluru/do/climbing/',
    category: 'reconciliation',
  },
  {
    year: 2023,
    title: 'Voice to Parliament Referendum defeated',
    description:
      'On 14 October 2023, Australia voted on whether to amend the Constitution to recognise Aboriginal and Torres Strait Islander peoples as the First Peoples of Australia and establish an Aboriginal and Torres Strait Islander Voice advisory body. The referendum was defeated, with 60.06% voting No and a No majority in all six states. The result was a significant setback for the Uluru Statement from the Heart.',
    significance:
      'The defeat of the Voice referendum was widely described as a painful moment for many Aboriginal and Torres Strait Islander people. Advocates have continued to pursue truth-telling and treaty as pathways forward.',
    source: 'Australian Electoral Commission',
    sourceUrl: 'https://www.aec.gov.au/elections/referendums/',
    category: 'milestone',
  },
]
