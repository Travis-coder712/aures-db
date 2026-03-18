# AURES Database — What Is This and Why Does It Exist?

## The Plain English Version

Australia is in the middle of the biggest transformation of its electricity system in a century. Coal plants are closing, and they're being replaced by wind farms, solar farms, batteries, and new transmission lines. There are hundreds of these projects — some already operating, some being built, some still on paper.

**The problem is:** there's no single place where you can see all of this clearly.

The information exists, but it's scattered across dozens of websites, government databases, news articles, company announcements, and paywalled reports. If you want to know basic things like "what battery projects are being built in NSW?" or "who makes the turbines for that wind farm?" or "has this project been delayed?", you have to piece it together yourself from half a dozen sources.

**AURES fixes this.** It brings together information from every major public source into one searchable, browsable database that works on your phone.

---

## What Can You Do With It?

### Look at projects from any angle

Want to see every wind farm in Queensland? Done.
Every project using Vestas turbines? Done.
Every battery that uses Tesla Megapacks? Done.
What did Origin Energy buy this year? Done.
Which projects won CIS funding in Tender 3? Done.
What's in the South West REZ? Done.

It's the same underlying data, but you can slice it a dozen different ways.

### Track how projects evolve over time

This is the killer feature. Every project has a timeline showing its full history:
- When it was first proposed
- Who developed it
- When it got planning approval
- If it was sold (and for how much)
- When it won CIS/LTESA funding
- What the original construction timeline was
- How that timeline has changed
- What the current expected completion date is

You can see at a glance: "This project was supposed to be finished in 2025, but it's slipped to 2028. Here's why."

### See which projects are actually performing well

For projects that are already operating, AURES tracks:
- How much power they actually generate (capacity factor)
- How much they get paid (volume-weighted price)
- How much power they lose to grid congestion (curtailment)
- How their location affects their revenue (loss factors)

You can see league tables — the best-performing wind farms, solar farms, and batteries — and also the worst. And critically, you can see *why* some perform better than others.

### Understand climate and weather risk

AURES includes a climate intelligence layer that tracks how large-scale climate patterns — El Niño/La Niña (ENSO), the Indian Ocean Dipole (IOD), and the Southern Annular Mode (SAM) — affect renewable energy output across Australia.

Using 8 years of historical capacity factor data (2018-2026), the system:
- **Identifies Dunkelflaute events** — periods when both wind and solar output are simultaneously low
- **Matches current conditions to historical patterns** — using correlation analysis to find which past years most resemble the current trajectory
- **Projects remaining months** — showing optimistic, median, and pessimistic capacity factor forecasts based on the most similar historical years
- **Lets you filter by wind, solar, or combined** and by state — so you can see exactly how your technology and region are tracking

### Understand whether new projects will succeed

For projects that have won government contracts (CIS or LTESA) but haven't been built yet, AURES tracks developer confidence scores, COD drift patterns, and pipeline progress. This helps assess which projects will actually reach construction.

### Explore intelligence analytics

An Intelligence Hub provides 8 specialised analytics pages:
- **Dunkelflaute Monitor** — Wind+solar vulnerability with climate intelligence and BESS adequacy
- **Transmission Infrastructure** — Major grid projects (HumeLink, VNI West, Marinus Link) with status and dependencies
- **EIS Technical** — Environmental impact data from development assessments
- **Revenue Intelligence** — Wholesale market performance and pricing analysis
- **Energy Mix** — Generation mix trends and technology breakdown
- **Developer Scores** — Portfolio analysis and delivery track records
- **Scheme Tracker** — CIS and LTESA milestone monitoring
- **Wind Resource** — Wind farm performance analysis

### Learn how the energy system works

An education section explains the fundamentals:
- How does Australia's electricity market work?
- What is a Renewable Energy Zone?
- What is the Capacity Investment Scheme?
- Why do batteries earn money from frequency control?
- What is a marginal loss factor and why does it matter?

---

## What Makes This Different?

### 1. It's honest about uncertainty
If we don't know something, it says "Not yet verified" rather than making something up. Every data point has a confidence rating, and every fact links back to its source.

### 2. It shows conflicting information
When the AFR says a project cost $300M and RenewEconomy says $350M, AURES shows both, with dates and context. In this industry, no single source is right about everything. The database helps you see the full picture.

### 3. It tracks change over time
Most databases show you a snapshot. AURES shows you the movie. How has this project's expected completion date shifted? Who used to own it? What was the original cost estimate?

### 4. It works on your phone
Designed mobile-first as a Progressive Web App. Install it on your iPhone and use it on-site, in meetings, or wherever you need quick access to project intelligence.

---

## Who Is This For?

- **Renewable energy professionals** who need project intelligence at their fingertips
- **Investors** evaluating project risks and developer track records
- **Policy analysts** tracking whether CIS/LTESA/REZ programs are delivering
- **Journalists** who need accurate, sourced project data
- **Students and educators** learning about Australia's energy transition
- **Anyone** who wants to understand what's happening with renewable energy in Australia

---

## How Is the Data Kept Accurate?

1. **AEMO backbone**: The core project list comes from AEMO's Generation Information publication, updated quarterly. This is the official source of truth for what exists and what's proposed.

2. **Sourced enrichment**: Every additional detail (OEM, cost, offtakes, etc.) must have a source URL. No data is entered without attribution.

3. **Multi-source triangulation**: Where possible, facts are confirmed across multiple sources. The more sources that agree, the higher the confidence rating.

4. **Change tracking**: Every data update is logged with date, source, and the old value. This creates an audit trail and prevents silent errors.

5. **Honest gaps**: Fields that haven't been researched say "Not yet verified" rather than being left blank or filled with guesses.

---

## Hierarchy of What AURES Achieves

```
Level 1: DATABASE
  "What projects exist?"
  → Comprehensive project records for every significant renewable
    energy project in Australia (NEM + WEM)
  → Filterable by technology, state, developer, OEM, status, REZ,
    CIS/LTESA round

Level 2: HISTORY
  "How has this project evolved?"
  → Full lifecycle timeline for each project
  → Ownership changes with transaction values
  → COD drift tracking
  → Milestone progression

Level 3: ANALYSIS
  "How are existing projects performing?"
  → Operational performance league tables
  → Capacity factors, revenue, curtailment, loss factors
  → Best and worst performers by technology and state
  → BESS revenue breakdown (arbitrage vs FCAS)

Level 4: INTELLIGENCE
  "Will planned projects succeed? What conditions should we expect?"
  → Climate intelligence (ENSO/IOD/SAM impact on renewables)
  → Pattern-matching forecast engine (current year vs historical)
  → Dunkelflaute monitoring and BESS adequacy assessment
  → Developer confidence scoring and delivery track records
  → Transmission infrastructure dependency tracking
  → Environmental impact analysis (EIS data mining)

Level 5: INSIGHT
  "What should we be watching?"
  → Seasonal risk outlook based on climate conditions
  → Curtailment risk assessment by region
  → Revenue and pricing trend analysis
  → Construction pipeline progress and milestone tracking
  → Critical transmission project timelines
```
