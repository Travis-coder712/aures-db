#!/usr/bin/env python3
"""Generate AURES Development Roadmap PDF."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable
)

# Colors
DARK_BG = HexColor('#1a1a2e')
ACCENT_BLUE = HexColor('#3b82f6')
ACCENT_GREEN = HexColor('#22c55e')
ACCENT_AMBER = HexColor('#f59e0b')
ACCENT_RED = HexColor('#ef4444')
ACCENT_PURPLE = HexColor('#8b5cf6')
LIGHT_GRAY = HexColor('#f3f4f6')
MED_GRAY = HexColor('#6b7280')
DARK_GRAY = HexColor('#374151')
BORDER_GRAY = HexColor('#d1d5db')
HEADER_BG = HexColor('#1e3a5f')
ROW_ALT = HexColor('#f9fafb')

def build_pdf():
    output_path = '/Users/travishughes/aures-db/frontend/public/AURES_Development_Roadmap.pdf'
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=20*mm,
        rightMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    styles.add(ParagraphStyle(
        'DocTitle', parent=styles['Title'],
        fontSize=26, leading=32, spaceAfter=6,
        textColor=HEADER_BG, fontName='Helvetica-Bold',
    ))
    styles.add(ParagraphStyle(
        'DocSubtitle', parent=styles['Normal'],
        fontSize=12, leading=16, spaceAfter=20,
        textColor=MED_GRAY, fontName='Helvetica',
    ))
    styles.add(ParagraphStyle(
        'SectionTitle', parent=styles['Heading1'],
        fontSize=18, leading=22, spaceBefore=16, spaceAfter=8,
        textColor=HEADER_BG, fontName='Helvetica-Bold',
        borderWidth=0,
    ))
    styles.add(ParagraphStyle(
        'SubSection', parent=styles['Heading2'],
        fontSize=13, leading=17, spaceBefore=12, spaceAfter=4,
        textColor=ACCENT_BLUE, fontName='Helvetica-Bold',
    ))
    styles.add(ParagraphStyle(
        'PhaseTitle', parent=styles['Heading3'],
        fontSize=11, leading=14, spaceBefore=8, spaceAfter=3,
        textColor=DARK_GRAY, fontName='Helvetica-Bold',
    ))
    styles.add(ParagraphStyle(
        'Body', parent=styles['Normal'],
        fontSize=10, leading=14, spaceAfter=6,
        textColor=DARK_GRAY, fontName='Helvetica',
        alignment=TA_JUSTIFY,
    ))
    # Override the built-in Bullet style
    bullet_style = ParagraphStyle(
        'AuresBullet', parent=styles['Normal'],
        fontSize=10, leading=14, spaceAfter=3,
        textColor=DARK_GRAY, fontName='Helvetica',
        leftIndent=16, bulletIndent=6,
    )
    styles.add(bullet_style)
    styles.add(ParagraphStyle(
        'SubBullet', parent=styles['Normal'],
        fontSize=9, leading=13, spaceAfter=2,
        textColor=MED_GRAY, fontName='Helvetica',
        leftIndent=32, bulletIndent=22,
    ))
    styles.add(ParagraphStyle(
        'FileRef', parent=styles['Normal'],
        fontSize=8, leading=11, spaceAfter=2,
        textColor=MED_GRAY, fontName='Courier',
        leftIndent=16,
    ))
    styles.add(ParagraphStyle(
        'EffortTag', parent=styles['Normal'],
        fontSize=9, leading=12, spaceAfter=8,
        textColor=white, fontName='Helvetica-Bold',
    ))
    styles.add(ParagraphStyle(
        'FooterText', parent=styles['Normal'],
        fontSize=8, leading=10,
        textColor=MED_GRAY, fontName='Helvetica',
        alignment=TA_CENTER,
    ))

    story = []

    # ====== COVER / HEADER ======
    story.append(Spacer(1, 30*mm))
    story.append(Paragraph('AURES Development Roadmap', styles['DocTitle']))
    story.append(Paragraph('Six Implementation Plans for the Next Phase of AURES Intelligence', styles['DocSubtitle']))
    story.append(HRFlowable(width='100%', thickness=2, color=ACCENT_BLUE, spaceAfter=12))

    # Version info
    story.append(Paragraph('<b>Version:</b> v2.7.0  |  <b>Date:</b> 29 March 2026  |  <b>Prepared by:</b> AURES Development Team', styles['Body']))
    story.append(Spacer(1, 10*mm))

    # ====== EXECUTIVE SUMMARY ======
    story.append(Paragraph('Executive Summary', styles['SectionTitle']))
    story.append(Paragraph(
        'AURES has grown from a renewable energy project database into an analytical platform with 10 intelligence features, '
        '1,067 projects, and real-time performance data from the OpenElectricity API. The following six tasks represent the '
        'next phase of development, moving from data collection to deeper analytical insight. Each plan has been scoped '
        'against the existing codebase, identifying what data already exists, what gaps need filling, and a phased '
        'implementation approach.',
        styles['Body']
    ))
    story.append(Spacer(1, 4*mm))

    # Priority table
    priority_data = [
        ['#', 'Task', 'Effort', 'Priority'],
        ['1', 'Navigation Review', 'Medium (1-2 sessions)', 'Foundational'],
        ['2', 'Solar Performance Deep Dive', 'Large (2-3 sessions)', 'High-value insight'],
        ['3', 'Data Quality Next Steps', 'Medium (1-2 sessions)', 'Clean data first'],
        ['4', 'All-Tech Performance Review', 'Large (2-3 sessions)', 'Broader analysis'],
        ['5', 'REZ Deep Dive', 'Large (2-3 sessions)', 'Research-heavy'],
        ['6', 'CIS/LTESA Outcomes Deep Dive', 'Large (2-3 sessions)', 'Well-advanced'],
    ]
    t = Table(priority_data, colWidths=[25, 180, 120, 120])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, ROW_ALT]),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        '<b>Cross-cutting dependency:</b> Curtailment data sourcing (tasks 2 and 4) should be tackled early as it feeds multiple analyses. '
        'Current curtailment data is sample-only (random estimates) and needs replacing with real NEMWEB or OpenElectricity data.',
        styles['Body']
    ))

    story.append(PageBreak())

    # ====== TASK 1: NAVIGATION ======
    story.append(Paragraph('1. Navigation Review', styles['SectionTitle']))
    story.append(HRFlowable(width='100%', thickness=1, color=ACCENT_BLUE, spaceAfter=8))

    story.append(Paragraph('Problem Statement', styles['SubSection']))
    bullets = [
        'Mobile bottom nav has 5 items (Home, Projects, Perf, REZ, Search) but desktop sidebar has 16 - significant parity gap',
        'Intelligence features (9 modules) are buried behind the /intelligence hub page - no direct sidebar access',
        'Analytics pages (BESS Capex, Timeline) sit as standalone sidebar items, not logically grouped',
        'Once inside an intelligence page, no way to jump to another intelligence module without returning to the hub',
        'BatteryWatch and CoalWatch exist as components but have no direct navigation routes',
    ]
    for b in bullets:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Paragraph('Implementation Plan', styles['SubSection']))

    story.append(Paragraph('Phase 1 - Restructure sidebar groups', styles['PhaseTitle']))
    groups = [
        'Group 1: Home, Dashboard, Search',
        'Group 2 - Data: Projects, Developers, OEMs, Contractors, Offtakers',
        'Group 3 - Analysis: Performance, Map, REZ, News',
        'Group 4 - Intelligence: Expandable section listing all 9 modules inline, plus Analytics sub-items',
        'Group 5 - Reference: Guides, Data Sources',
    ]
    for g in groups:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {g}', styles['Bullet']))

    story.append(Paragraph('Phase 2 - Improve mobile bottom nav', styles['PhaseTitle']))
    opts = [
        'Option A: Keep 5 items but replace REZ with Intelligence (REZ accessible from sidebar)',
        'Option B: Add a "More" overflow item showing remaining nav options',
        'Test on iPhone - Travis\'s primary test device',
    ]
    for o in opts:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {o}', styles['Bullet']))

    story.append(Paragraph('Phase 3 - Intelligence sub-navigation', styles['PhaseTitle']))
    story.append(Paragraph('<bullet>&bull;</bullet> Add horizontal pill/chip nav inside intelligence pages to jump between modules', styles['Bullet']))
    story.append(Paragraph('<bullet>&bull;</bullet> Breadcrumb pattern: Intelligence > Scheme Tracker > CIS Briefing', styles['Bullet']))

    story.append(Paragraph('Key Files', styles['SubSection']))
    files = [
        'frontend/src/components/layout/Layout.tsx (NAV_ITEMS, MOBILE_NAV_ITEMS)',
        'frontend/src/pages/IntelligenceHub.tsx (grid layout)',
        'frontend/src/App.tsx (routes)',
    ]
    for f in files:
        story.append(Paragraph(f, styles['FileRef']))

    # Effort badge
    story.append(Spacer(1, 4*mm))
    effort_data = [['Medium effort: 1-2 sessions']]
    et = Table(effort_data, colWidths=[160])
    et.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), ACCENT_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, -1), white),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
    ]))
    story.append(et)

    story.append(PageBreak())

    # ====== TASK 2: SOLAR ======
    story.append(Paragraph('2. Solar Performance Deep Dive', styles['SectionTitle']))
    story.append(HRFlowable(width='100%', thickness=1, color=ACCENT_AMBER, spaceAfter=8))

    story.append(Paragraph('Current State', styles['SubSection']))
    state_bullets = [
        '229 solar projects in database, 79 operating with 2025 league table rankings',
        'Quartile ranking exists: Q1-Q4 by composite score (40% CF + 40% Revenue/MW + 20% Curtailment)',
        'Fleet average CF: 19.15% (2025), top performer Port Augusta Solar at 21.86%',
        'EIS technical data for 27 solar projects (panel type, tracking system, tilt angle, inverter, assumed CF)',
        '<b>Curtailment data is SAMPLE ONLY</b> - random estimates (0.5-8%), not real NEMWEB data',
        'No EIS-vs-actual comparison for solar (exists for 21 wind projects but not solar)',
        'No SolarWatch component (BatteryWatch and CoalWatch exist as precedents)',
    ]
    for b in state_bullets:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Paragraph('Implementation Plan', styles['SubSection']))

    story.append(Paragraph('Phase 1 - Solar EIS vs Actual Analysis', styles['PhaseTitle']))
    p1 = [
        'Build solar version of eis-comparison.json (match 27 EIS solar projects to operating performance)',
        'Calculate design miss: EIS assumed capacity factor vs actual CF',
        'Categorise by panel type (mono-PERC, bifacial, HJT), tracking (single-axis, fixed), and state',
        'Hypothesis: bifacial + single-axis outperform fixed-tilt; QLD underperforms due to curtailment',
    ]
    for b in p1:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Paragraph('Phase 2 - Curtailment Data Sourcing', styles['PhaseTitle']))
    p2 = [
        'Option A: AEMO NEMWEB constraint data (free, complex - needs constraint equation parsing)',
        'Option B: AEMO Pre-Dispatch PASA reports (constraint forecasts, weekly summary)',
        'Option C: OpenElectricity "curtailment" metric if API exposes it',
        'Option D: Use negative price periods as curtailment proxy (from OpenElectricity market_value)',
        '<b>Recommendation:</b> Start with Option D (negative price proxy) - achievable with existing API access',
    ]
    for b in p2:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Paragraph('Phase 3 - SolarWatch Intelligence Module', styles['PhaseTitle']))
    p3 = [
        'New page: /intelligence/solar-performance',
        'Charts: State-by-state CF comparison, panel technology comparison, tracking type impact on CF',
        'Table: All 79 operating solar farms ranked with CF, revenue, curtailment, panel type, tracking',
        'Degradation tracker: Year-over-year CF decline analysis (2018-2025 data available)',
        'Regional analysis: QLD solar vs NSW solar vs VIC solar vs SA solar',
    ]
    for b in p3:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Paragraph('Phase 4 - Quartile Deep Dive', styles['PhaseTitle']))
    story.append(Paragraph('What differentiates Q1 performers from Q4? Correlate composite score with:', styles['Body']))
    p4 = [
        'Panel type (mono-PERC vs bifacial vs HJT)',
        'Tracking type (single-axis vs fixed-tilt)',
        'State / latitude',
        'Commissioning year (newer panels = better?)',
        'Inverter brand and type',
        'REZ membership (inside vs outside declared REZ)',
    ]
    for b in p4:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['SubBullet']))

    story.append(Spacer(1, 4*mm))
    effort_data2 = [['Large effort: 2-3 sessions']]
    et2 = Table(effort_data2, colWidths=[160])
    et2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), ACCENT_AMBER),
        ('TEXTCOLOR', (0, 0), (-1, -1), white),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(et2)

    story.append(PageBreak())

    # ====== TASK 3: DATA QUALITY ======
    story.append(Paragraph('3. Data Quality Review - Next Steps', styles['SectionTitle']))
    story.append(HRFlowable(width='100%', thickness=1, color=ACCENT_GREEN, spaceAfter=8))

    story.append(Paragraph('Current State', styles['SubSection']))
    story.append(Paragraph(
        '243 issues found across 6 categories (62 high, 94 warning, 87 info). Three issues already fixed '
        '(Willogoleche 2, West Mokoan, Liddell BESS). Smart filtering reduces noise from known patterns.',
        styles['Body']
    ))

    # Issue breakdown table
    issue_data = [
        ['Category', 'Count', 'High', 'Warning', 'Info'],
        ['Similar Names', '105', '29', '76', '0'],
        ['Multi-Scheme Duplicate', '79', '3', '2', '74'],
        ['Capacity Mismatch', '36', '18', '14', '4'],
        ['Name Mismatch', '12', '12', '0', '0'],
        ['Missing Coordinates', '9', '0', '0', '9'],
        ['Technology Mismatch', '2', '0', '2', '0'],
        ['Total', '243', '62', '94', '87'],
    ]
    it = Table(issue_data, colWidths=[130, 50, 50, 55, 50])
    it.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, -1), (-1, -1), LIGHT_GRAY),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [white, ROW_ALT]),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(it)
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph('Implementation Plan', styles['SubSection']))

    story.append(Paragraph('Phase 1 - Triage high-severity items (62 issues)', styles['PhaseTitle']))
    triage = [
        '<b>12 name mismatches</b> - all high severity. Quick wins: Kentbruck name evolution (leave as-is). Fixes needed: Mt Piper, Derby Solar, Teebar BESS project_id corrections',
        '<b>18 capacity mismatches</b> - investigate each. Smithfield 235 MW vs 65 MW (combined-round issue like Liddell). Goyder North 300 MW vs 600 MW (Stage 1 contracting). Bundey 240 MW vs 1200 MW (partial contracting)',
        '<b>29 similar names</b> - review each pair. Bluegrass Solar / Blue Grass BESS (legitimate co-located). Goal: reduce false positives by adding to is_known_variant()',
    ]
    for b in triage:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Paragraph('Phase 2 - Fix confirmed issues (~20 fixes)', styles['PhaseTitle']))
    fixes = [
        'Add missing coordinates for 9 projects (research lat/lng for each)',
        'Verify 2 technology mismatches (Dinawan and Hexham: wind vs hybrid classification)',
        'Consolidate combined-round entries (Smithfield, Orana - same pattern as Liddell fix)',
    ]
    for b in fixes:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Paragraph('Phase 3 - Improve audit script', styles['PhaseTitle']))
    script = [
        'Expand is_known_variant() with confirmed false positives from Phase 1 review',
        'Add "staged capacity" detection (if scheme name contains "Stage" or project has multiple stages)',
        'Track resolved issues in exclusion list to prevent re-flagging',
        'Target: reduce actionable issues from 243 to under 100',
    ]
    for b in script:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Spacer(1, 4*mm))
    effort_data3 = [['Medium effort: 1-2 sessions']]
    et3 = Table(effort_data3, colWidths=[160])
    et3.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), ACCENT_GREEN),
        ('TEXTCOLOR', (0, 0), (-1, -1), white),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(et3)

    story.append(PageBreak())

    # ====== TASK 4: ALL-TECH PERFORMANCE ======
    story.append(Paragraph('4. Performance Data Review (All Technologies)', styles['SectionTitle']))
    story.append(HRFlowable(width='100%', thickness=1, color=ACCENT_PURPLE, spaceAfter=8))

    story.append(Paragraph('Current State', styles['SubSection']))
    tech_state = [
        '<b>Wind:</b> 80 operating projects, EIS comparison for 21, hub height/rotor/turbine data for 74',
        '<b>Solar:</b> 79 operating projects, EIS for 27 (panel type, tracking), no EIS-vs-actual comparison',
        '<b>BESS:</b> 28 operating projects, chemistry (mostly LFP), duration, cycling, charge/discharge spreads',
        '<b>Pumped Hydro:</b> 33 projects tracked (most legacy, 3 new CIS/LTESA)',
        'Composite scoring: Wind/Solar (40% CF + 40% Rev + 20% Curtailment), BESS (30% Rev + 30% Util + 20% Spread + 20% Cycles)',
        '<b>Curtailment:</b> sample data only across all technologies - needs real data',
    ]
    for b in tech_state:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Paragraph('Implementation Plan', styles['SubSection']))

    story.append(Paragraph('Phase 1 - Wind Performance Deep Dive', styles['PhaseTitle']))
    wind = [
        'Analyse hub height vs capacity factor correlation (expected: taller = higher CF)',
        'OEM performance comparison: Vestas vs GE vs Goldwind vs Nordex',
        'Rotor diameter impact on CF (larger swept area = higher energy capture)',
        'Build scatter plot: Hub height (x) vs CF (y), coloured by OEM',
        'Overlay EIS assumed CF to show design miss by turbine type',
    ]
    for b in wind:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Paragraph('Phase 2 - BESS Performance Deep Dive', styles['PhaseTitle']))
    bess = [
        'Revenue analysis by duration (2hr vs 4hr vs 8hr)',
        'Cycling analysis: seasonal patterns (summer vs winter)',
        'Charge/discharge price spread by state and season',
        'Grid-forming vs grid-following performance comparison',
        'Chemistry impact tracking (LFP vs NMC)',
    ]
    for b in bess:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Paragraph('Phase 3 - Cross-Technology Insights', styles['PhaseTitle']))
    cross = [
        'Hybrid analysis: Does co-located BESS improve solar revenue? (hybrid vs standalone comparison)',
        'REZ-level performance: Do projects in declared REZs perform better or worse?',
        'State-level benchmarks: Per-technology CF rankings by state',
        'Curtailment heatmap: Technology x State x Month',
    ]
    for b in cross:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Spacer(1, 4*mm))
    effort_data4 = [['Large effort: 2-3 sessions']]
    et4 = Table(effort_data4, colWidths=[160])
    et4.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), ACCENT_PURPLE),
        ('TEXTCOLOR', (0, 0), (-1, -1), white),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(et4)

    story.append(PageBreak())

    # ====== TASK 5: REZ ======
    story.append(Paragraph('5. REZ Deep Dive', styles['SectionTitle']))
    story.append(HRFlowable(width='100%', thickness=1, color=ACCENT_RED, spaceAfter=8))

    story.append(Paragraph('Current State', styles['SubSection']))
    rez_state = [
        '18 REZ zones tracked across 5 states (NSW 5, VIC 5, QLD 4, SA 3, TAS 1)',
        'REZ list page + detail page with projects, transmission status, capacity targets',
        'Grid Connection intelligence with congestion scoring per REZ',
        'NSW REZ access rights tracked (CWO: 10 projects / 7.15 GW, SW: 4 projects / 3.56 GW)',
        '6 major transmission projects tracked ($22.1B total investment)',
        '57 projects linked to REZs out of 1,067 total',
    ]
    for b in rez_state:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Paragraph('Implementation Plan', styles['SubSection']))

    story.append(Paragraph('Phase 1 - Research Each REZ (Internet Research)', styles['PhaseTitle']))
    story.append(Paragraph('For each of the 18 REZs, research and document:', styles['Body']))
    rez_research = [
        '<b>Governance:</b> Who manages? (EnergyCo NSW, VicGrid VIC, Powerlink QLD, ElectraNet SA, TasNetworks TAS)',
        '<b>Access scheme:</b> How do proponents get access? (competitive tender, first-come, registration)',
        '<b>Infrastructure:</b> What transmission exists vs planned? Target completion dates?',
        '<b>Costs:</b> Access charges, network augmentation contributions, bond requirements',
        '<b>Risks:</b> Congestion (current and projected), curtailment history, planning constraints, community opposition',
        '<b>Current state:</b> Projects connected, queue depth, available hosting capacity',
    ]
    for b in rez_research:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Paragraph('Phase 2 - REZ Comparison Dashboard', styles['PhaseTitle']))
    rez_dash = [
        'New intelligence module or enhanced REZ detail page',
        'Comparative table: All 18 REZs side-by-side',
        'Metrics: Hosting capacity (GW), projects connected, pipeline, congestion score, transmission status',
        'Risk rating: Traffic light (green/amber/red) based on congestion + transmission readiness',
    ]
    for b in rez_dash:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Paragraph('Phase 3 - REZ Performance Correlation', styles['PhaseTitle']))
    rez_perf = [
        'Link REZ membership to project performance data',
        'Question: Do projects in declared REZs perform better or worse? (curtailment impact)',
        'Question: Is CWO REZ congested enough to hurt operating project capacity factors?',
    ]
    for b in rez_perf:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Paragraph('Phase 4 - REZ Investment Guide', styles['PhaseTitle']))
    rez_guide = [
        'For each REZ: "What a developer needs to know"',
        'Cost breakdown, timeline expectations, risk factors',
        'Which REZs offer best value for wind vs solar vs BESS?',
    ]
    for b in rez_guide:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Spacer(1, 4*mm))
    effort_data5 = [['Large effort: 2-3 sessions (research-heavy)']]
    et5 = Table(effort_data5, colWidths=[200])
    et5.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), ACCENT_RED),
        ('TEXTCOLOR', (0, 0), (-1, -1), white),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(et5)

    story.append(PageBreak())

    # ====== TASK 6: CIS/LTESA ======
    story.append(Paragraph('6. CIS/LTESA Outcomes Deep Dive', styles['SectionTitle']))
    story.append(HRFlowable(width='100%', thickness=1, color=ACCENT_GREEN, spaceAfter=8))

    story.append(Paragraph('Current State (post v2.7.0)', styles['SubSection']))
    cis_state = [
        '7 tabs on SchemeTracker: Overview, Milestone Tracker, Watchlist, ESG, CIS Success, CIS Briefing, Timeline',
        'CIS Briefing tab complete with 4 sections and 8 interactive charts',
        'Senate Estimates data integrated (63 projects per DCCEEW, reconciled to our 71)',
        'Financial-close data for 47 projects (6 operating, 3 commissioning, 11 construction)',
        'ESG tracker with agreement status for all 71 CIS + 23 LTESA projects',
    ]
    for b in cis_state:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Paragraph('Gaps Identified', styles['SubSection']))
    gaps = [
        'No state-by-state dedicated dashboard',
        'No CIS vs LTESA success rate comparison (head-to-head)',
        'No developer concentration analysis',
        'Financial-close data exists (47 projects) but not surfaced in the UI',
        'No policy target alignment tracking (awarded vs 40 GW target burndown)',
        'No First Nations outcomes tracking (only publication status, not actual jobs/equity)',
    ]
    for b in gaps:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Paragraph('Implementation Plan', styles['SubSection']))

    story.append(Paragraph('Phase 1 - State-by-State Dashboard', styles['PhaseTitle']))
    s1 = [
        'Per state: CIS projects, LTESA projects, total capacity, confirmed, operating, construction',
        'State comparison chart: Stacked bar showing stage distribution per state',
        'NSW dominant story: Most projects, most transmission investment, most complex (LTESA overlap)',
    ]
    for b in s1:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Paragraph('Phase 2 - CIS vs LTESA Head-to-Head', styles['PhaseTitle']))
    s2 = [
        'Success rate comparison: What % of CIS projects have executed vs % of LTESA?',
        'Time-to-construction: Average months from award to construction start',
        'Technology preference: Why does LTESA have more batteries?',
        'Contract mechanism comparison: Cap-and-collar (CIS) vs options/annuity (LTESA)',
    ]
    for b in s2:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Paragraph('Phase 3 - Surface Financial-Close Data', styles['PhaseTitle']))
    s3 = [
        'Integrate financial-close-data.ts into SchemeTracker UI',
        'Add FC status indicators to all project tables',
        'Show financing details: lenders, ARENA/CEFC grants, total investment',
        'Highlight the FC bottleneck: 22 executed CISAs but only ~9 at financial close',
    ]
    for b in s3:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Paragraph('Phase 4 - Policy Target Tracking', styles['PhaseTitle']))
    s4 = [
        'CIS: 40 GW target burndown chart showing awarded / committed / operating vs target',
        'LTESA: 12 GW generation + 2 GW LDS by 2030 progress tracker',
        'Projection: At current execution pace, when will targets realistically be met?',
    ]
    for b in s4:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', styles['Bullet']))

    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        '<b>Note:</b> SchemeTracker.tsx is now 4,800+ lines. Consider splitting into separate component files per tab before adding more features.',
        styles['Body']
    ))

    effort_data6 = [['Large effort: 2-3 sessions']]
    et6 = Table(effort_data6, colWidths=[160])
    et6.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), ACCENT_GREEN),
        ('TEXTCOLOR', (0, 0), (-1, -1), white),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(et6)

    # ====== FOOTER ======
    story.append(Spacer(1, 15*mm))
    story.append(HRFlowable(width='100%', thickness=0.5, color=BORDER_GRAY, spaceAfter=6))
    story.append(Paragraph('AURES v2.7.0 | Development Roadmap | 29 March 2026 | Confidential', styles['FooterText']))

    # Build
    doc.build(story)
    print(f'PDF generated: {output_path}')

if __name__ == '__main__':
    build_pdf()
