import { useState, useCallback } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend, ReferenceLine, AreaChart, Area,
} from 'recharts'

// Icons — defined BEFORE const arrays (Vite HMR pattern)
const FirmingIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)
const CostIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const EmissionsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
  </svg>
)
const RenewIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)
const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)
const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
)
const LoadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
)
const InfoIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

// ─── Types ───────────────────────────────────────────────────────────────────

type Objective = 'cost' | 'emissions' | 'renewables'

type DemandProfile = 'evening_peak' | 'heatwave' | 'dunkelflaute' | 'annual'

interface Assumptions {
  bessCostPerGWh: number      // $B/GWh
  bessPowerCostPerGW: number  // $B/GW for power electronics (separate from energy)
  gasCostPerGW: number        // $B/GW capital
  gasVomc: number             // $/MWh variable O&M
  gasEmissions: number        // tCO2/MWh
  bessRte: number             // round-trip efficiency 0-1
  bessAnnualDegradation: number // % per year
}

interface ScenarioParams {
  bessGWh: number       // total BESS investment in GWh
  bessDurationHrs: number  // 2, 4, 6, or 8
  demandGW: number      // peak demand to firm
  renewSharePct: number // % of energy from renewables
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_ASSUMPTIONS: Assumptions = {
  bessCostPerGWh: 0.4,          // $400M/GWh (energy cost)
  bessPowerCostPerGW: 0.8,      // $800M/GW (power electronics)
  gasCostPerGW: 0.9,            // $900M/GW OCGT
  gasVomc: 80,                  // $/MWh
  gasEmissions: 0.55,           // tCO2/MWh
  bessRte: 0.87,
  bessAnnualDegradation: 2.5,
}

const PRESET_SCENARIOS: { label: string; desc: string; params: ScenarioParams }[] = [
  {
    label: 'Current NEM trajectory',
    desc: '10 GWh BESS, 2hr duration — reflects today\'s fleet average',
    params: { bessGWh: 10, bessDurationHrs: 2, demandGW: 8, renewSharePct: 45 },
  },
  {
    label: 'ISP Slow Change 2035',
    desc: '40 GWh BESS, 4hr avg — modest storage build-out',
    params: { bessGWh: 40, bessDurationHrs: 4, demandGW: 10, renewSharePct: 65 },
  },
  {
    label: 'ISP Step Change 2035',
    desc: '80 GWh BESS, 6hr avg — accelerated transition',
    params: { bessGWh: 80, bessDurationHrs: 6, demandGW: 12, renewSharePct: 82 },
  },
  {
    label: '2hr fleet (gas-heavy)',
    desc: '20 GWh at 2hr — maximum power, minimum energy',
    params: { bessGWh: 20, bessDurationHrs: 2, demandGW: 8, renewSharePct: 55 },
  },
  {
    label: '8hr fleet (gas-light)',
    desc: '20 GWh at 8hr — extended storage, less gas firming',
    params: { bessGWh: 20, bessDurationHrs: 8, demandGW: 8, renewSharePct: 55 },
  },
]

// Demand profiles — 24-hour normalised load curve (MW fraction of peak)
const DEMAND_PROFILES: Record<DemandProfile, { label: string; desc: string; curve: number[] }> = {
  evening_peak: {
    label: 'Evening peak',
    desc: 'Typical NEM weekday — load peaks 6-9 PM',
    curve: [0.55,0.50,0.47,0.45,0.46,0.50,0.58,0.70,0.78,0.82,0.85,0.83,0.81,0.80,0.80,0.82,0.88,0.95,1.00,0.97,0.90,0.80,0.68,0.60],
  },
  heatwave: {
    label: 'Heatwave day',
    desc: 'Summer extreme — high AC load 2-8 PM, solar clipping midday',
    curve: [0.62,0.58,0.55,0.54,0.55,0.58,0.65,0.72,0.80,0.87,0.92,0.94,0.93,0.95,0.98,1.00,1.00,0.99,0.97,0.93,0.88,0.82,0.75,0.68],
  },
  dunkelflaute: {
    label: 'Dunkelflaute week',
    desc: 'Low wind + low solar — maximum gas/storage stress',
    curve: [0.75,0.72,0.70,0.69,0.70,0.72,0.78,0.85,0.90,0.92,0.93,0.93,0.92,0.91,0.90,0.92,0.96,1.00,1.00,0.98,0.94,0.88,0.82,0.78],
  },
  annual: {
    label: 'Annual average',
    desc: 'Typical 24-hour average across all seasons',
    curve: [0.60,0.57,0.54,0.52,0.53,0.57,0.65,0.74,0.80,0.83,0.84,0.83,0.81,0.80,0.80,0.82,0.86,0.91,0.95,0.93,0.87,0.80,0.72,0.65],
  },
}

// Solar generation profile (fraction of capacity factor)
const SOLAR_PROFILE = [0,0,0,0,0,0,0.05,0.20,0.45,0.65,0.80,0.90,0.92,0.88,0.80,0.65,0.40,0.15,0.02,0,0,0,0,0]
// Wind generation profile (fraction — more stable overnight)
const WIND_PROFILE = [0.35,0.37,0.38,0.38,0.37,0.35,0.33,0.30,0.28,0.28,0.30,0.30,0.31,0.32,0.33,0.35,0.38,0.40,0.40,0.38,0.37,0.37,0.36,0.35]

// ISP reference lines (GW firming needed each year)
const ISP_REFS = {
  current: { label: 'Current NEM (2024)', gasGW: 6.2, bessGW: 4.0, color: '#6b7280' },
  slow: { label: 'ISP Slow Change 2035', gasGW: 4.5, bessGW: 12.0, color: '#3b82f6' },
  step: { label: 'ISP Step Change 2035', gasGW: 2.8, bessGW: 22.0, color: '#10b981' },
}

// ─── Model ───────────────────────────────────────────────────────────────────

function computeFirming(params: ScenarioParams, assumptions: Assumptions, demandProfile: DemandProfile, objective: Objective) {
  const { bessGWh, bessDurationHrs, demandGW, renewSharePct } = params
  const { bessCostPerGWh, bessPowerCostPerGW, gasCostPerGW, gasVomc, gasEmissions, bessRte } = assumptions

  // BESS power capacity given fixed GWh investment
  const bessPowerGW = bessGWh / bessDurationHrs

  // Renewable energy share split 60/40 wind/solar (approximate NEM target)
  const renewGW_wind = (renewSharePct / 100) * demandGW * 1.3 * 0.6  // overbuild 30%
  const renewGW_solar = (renewSharePct / 100) * demandGW * 1.3 * 0.4

  const profile = DEMAND_PROFILES[demandProfile].curve
  const hourlyData = profile.map((loadFrac, h) => {
    const demandMW = loadFrac * demandGW * 1000 // MW

    // Renewable generation this hour
    const windMW = WIND_PROFILE[h] * renewGW_wind * 1000
    const solarMW = SOLAR_PROFILE[h] * renewGW_solar * 1000
    const renewMW = windMW + solarMW

    // Surplus or deficit
    const balance = renewMW - demandMW
    let bessMW = 0
    let gasMW = 0

    if (balance >= 0) {
      // Surplus — charge BESS (capped at BESS power capacity)
      bessMW = -Math.min(balance * bessRte, bessPowerGW * 1000)
    } else {
      // Deficit — discharge BESS first, then gas fills remainder
      const deficit = -balance
      bessMW = Math.min(deficit, bessPowerGW * 1000)
      gasMW = Math.max(0, deficit - bessMW)
    }

    return { hour: h, demandMW, renewMW: Math.round(renewMW), bessMW: Math.round(bessMW), gasMW: Math.round(gasMW) }
  })

  // Peak gas required
  const peakGasGW = Math.max(...hourlyData.map(d => d.gasMW)) / 1000

  // Total gas energy (MWh across day)
  const totalGasMWh = hourlyData.reduce((sum, d) => sum + d.gasMW, 0)
  const totalDemandMWh = hourlyData.reduce((sum, d) => sum + d.demandMW, 0)

  // Effective renewables % (accounting for actual dispatch)
  const effectiveRenewPct = ((totalDemandMWh - totalGasMWh) / totalDemandMWh) * 100

  // CAPEX
  const bessTotalCapex = (bessGWh * bessCostPerGWh) + (bessPowerGW * bessPowerCostPerGW)
  const gasCapex = peakGasGW * gasCostPerGW
  const totalCapex = bessTotalCapex + gasCapex

  // Annual gas cost (annualised — scale daily to 365 days)
  const annualGasCost = totalGasMWh * 365 * gasVomc / 1e6  // $M/yr

  // Annual emissions
  const annualEmissions = totalGasMWh * 365 * gasEmissions / 1e6  // MtCO2/yr

  // Score by objective (lower is better)
  let score = 0
  if (objective === 'cost') score = totalCapex + annualGasCost * 10  // 10-yr NPV proxy
  else if (objective === 'emissions') score = annualEmissions
  else score = -(effectiveRenewPct)

  return {
    bessPowerGW: Math.round(bessPowerGW * 10) / 10,
    peakGasGW: Math.round(peakGasGW * 10) / 10,
    bessTotalCapex: Math.round(bessTotalCapex * 10) / 10,
    gasCapex: Math.round(gasCapex * 10) / 10,
    totalCapex: Math.round(totalCapex * 10) / 10,
    annualGasCost: Math.round(annualGasCost),
    annualEmissions: Math.round(annualEmissions * 100) / 100,
    effectiveRenewPct: Math.round(effectiveRenewPct * 10) / 10,
    hourlyData,
    score,
  }
}

// Duration sweep — same GWh at different durations
function computeDurationSweep(params: ScenarioParams, assumptions: Assumptions, demandProfile: DemandProfile, objective: Objective) {
  return [2, 4, 6, 8].map(hrs => {
    const r = computeFirming({ ...params, bessDurationHrs: hrs }, assumptions, demandProfile, objective)
    return {
      duration: `${hrs}hr`,
      bessGW: r.bessPowerGW,
      gasGW: r.peakGasGW,
      capex: r.totalCapex,
      emissions: r.annualEmissions,
      renewPct: r.effectiveRenewPct,
    }
  })
}

// ─── Saved scenarios ──────────────────────────────────────────────────────────

interface SavedScenario {
  id: string
  label: string
  params: ScenarioParams
  objective: Objective
  demandProfile: DemandProfile
  savedAt: string
}

function loadSaved(): SavedScenario[] {
  try {
    const raw = localStorage.getItem('aures-firming-scenarios')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveToDB(scenarios: SavedScenario[]) {
  localStorage.setItem('aures-firming-scenarios', JSON.stringify(scenarios))
}

// ─── Sub-components ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3 shadow-xl text-xs">
      <div className="font-medium text-[var(--color-text)] mb-1">{label}</div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[var(--color-text-muted)]">{p.name}:</span>
          <span className="text-[var(--color-text)] font-medium tabular-nums">
            {typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function KPICard({ label, value, unit, sub, colour }: { label: string; value: string | number; unit?: string; sub?: string; colour?: string }) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
      <div className="text-xs text-[var(--color-text-muted)] mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums" style={colour ? { color: colour } : {}}>{value}</span>
        {unit && <span className="text-sm text-[var(--color-text-muted)]">{unit}</span>}
      </div>
      {sub && <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{sub}</div>}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GasBessFirming() {
  const [objective, setObjective] = useState<Objective | null>(null)
  const [demandProfile, setDemandProfile] = useState<DemandProfile>('evening_peak')
  const [params, setParams] = useState<ScenarioParams>({
    bessGWh: 20,
    bessDurationHrs: 4,
    demandGW: 8,
    renewSharePct: 60,
  })
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS)
  const [showAssumptions, setShowAssumptions] = useState(false)
  const [editAssumptions, setEditAssumptions] = useState(false)
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(loadSaved)
  const [saveLabel, setSaveLabel] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [showLoad, setShowLoad] = useState(false)

  const result = objective
    ? computeFirming(params, assumptions, demandProfile, objective)
    : null
  const sweep = objective
    ? computeDurationSweep(params, assumptions, demandProfile, objective)
    : null

  const handlePreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setParams(preset.params)
  }

  const handleSave = useCallback(() => {
    if (!saveLabel.trim() || !objective) return
    const next: SavedScenario = {
      id: Date.now().toString(),
      label: saveLabel.trim(),
      params,
      objective,
      demandProfile,
      savedAt: new Date().toISOString(),
    }
    const updated = [next, ...savedScenarios].slice(0, 10)
    setSavedScenarios(updated)
    saveToDB(updated)
    setSaveLabel('')
    setShowSaveInput(false)
  }, [saveLabel, objective, params, demandProfile, savedScenarios])

  const handleLoad = (s: SavedScenario) => {
    setParams(s.params)
    setObjective(s.objective)
    setDemandProfile(s.demandProfile)
    setShowLoad(false)
  }

  const handleDelete = (id: string) => {
    const updated = savedScenarios.filter(s => s.id !== id)
    setSavedScenarios(updated)
    saveToDB(updated)
  }

  // Hourly dispatch chart data
  const dispatchData = result?.hourlyData.map(d => ({
    hour: `${d.hour}:00`,
    'Renewables (MW)': d.renewMW,
    'BESS discharge (MW)': d.bessMW > 0 ? d.bessMW : 0,
    'BESS charge (MW)': d.bessMW < 0 ? -d.bessMW : 0,
    'Gas (MW)': d.gasMW,
    'Demand (MW)': d.demandMW,
  }))

  // ── Render: entry screen ──────────────────────────────────────────────────
  if (!objective) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <FirmingIcon />
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Gas vs BESS Firming</h1>
        </div>
        <p className="text-[var(--color-text-muted)] mb-8 max-w-2xl">
          How much gas firming does grid-scale BESS displace? The answer depends on duration.
          Fix your total storage investment in GWh, vary the hours, and see how residual gas capacity changes.
        </p>

        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
          What are you solving for?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { id: 'cost' as Objective, icon: <CostIcon />, label: 'Minimise cost', desc: 'Lowest total CAPEX + gas operating cost over 10 years' },
            { id: 'emissions' as Objective, icon: <EmissionsIcon />, label: 'Minimise emissions', desc: 'Reduce annual tCO₂ from gas-fired generation' },
            { id: 'renewables' as Objective, icon: <RenewIcon />, label: 'Hit renewable target', desc: 'Maximise effective renewable share in dispatched energy' },
          ].map(obj => (
            <button
              key={obj.id}
              onClick={() => setObjective(obj.id)}
              className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 text-left hover:border-[var(--color-primary)] transition-colors group"
            >
              <div className="text-[var(--color-primary)] mb-3 group-hover:scale-110 transition-transform inline-block">{obj.icon}</div>
              <div className="font-semibold text-[var(--color-text)] mb-1">{obj.label}</div>
              <div className="text-xs text-[var(--color-text-muted)]">{obj.desc}</div>
            </button>
          ))}
        </div>

        {savedScenarios.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Saved scenarios</h2>
            <div className="space-y-2">
              {savedScenarios.slice(0, 3).map(s => (
                <div key={s.id} className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-[var(--color-text)]">{s.label}</span>
                    <span className="text-xs text-[var(--color-text-muted)] ml-2">{s.params.bessGWh} GWh · {s.params.bessDurationHrs}hr · {s.objective}</span>
                  </div>
                  <button onClick={() => handleLoad(s)} className="text-xs text-[var(--color-primary)] hover:underline">Load</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Start from a preset</h2>
          <div className="space-y-2">
            {PRESET_SCENARIOS.map(p => (
              <button
                key={p.label}
                onClick={() => { handlePreset(p); setObjective('cost') }}
                className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3 text-left hover:border-[var(--color-primary)] transition-colors"
              >
                <div className="text-sm font-medium text-[var(--color-text)]">{p.label}</div>
                <div className="text-xs text-[var(--color-text-muted)]">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Render: results ───────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3 mb-6">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FirmingIcon />
          <h1 className="text-xl font-bold text-[var(--color-text)] truncate">Gas vs BESS Firming</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setObjective(null)}
            className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            ← Change objective
          </button>
          {/* Save */}
          {!showSaveInput ? (
            <button
              onClick={() => setShowSaveInput(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <SaveIcon /> Save
            </button>
          ) : (
            <div className="flex gap-1">
              <input
                autoFocus
                value={saveLabel}
                onChange={e => setSaveLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="Scenario name…"
                className="text-xs px-2 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text)] w-36"
              />
              <button onClick={handleSave} className="text-xs px-2 py-1.5 rounded-lg bg-[var(--color-primary)] text-white">Save</button>
              <button onClick={() => setShowSaveInput(false)} className="text-xs px-2 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)]">✕</button>
            </div>
          )}
          {savedScenarios.length > 0 && (
            <button
              onClick={() => setShowLoad(!showLoad)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <LoadIcon /> Load
            </button>
          )}
        </div>
      </div>

      {/* Load dropdown */}
      {showLoad && (
        <div className="mb-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
          <div className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">Saved scenarios</div>
          {savedScenarios.map(s => (
            <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-[var(--color-border)] last:border-0">
              <div>
                <span className="text-sm text-[var(--color-text)]">{s.label}</span>
                <span className="text-xs text-[var(--color-text-muted)] ml-2">{s.params.bessGWh} GWh · {s.params.bessDurationHrs}hr</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleLoad(s)} className="text-xs text-[var(--color-primary)] hover:underline">Load</button>
                <button onClick={() => handleDelete(s.id)} className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Objective + profile pills */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">Objective:</span>
          {(['cost', 'emissions', 'renewables'] as Objective[]).map(o => (
            <button
              key={o}
              onClick={() => setObjective(o)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${objective === o ? 'bg-[var(--color-primary)] text-white' : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]'}`}
            >
              {o === 'cost' ? 'Min cost' : o === 'emissions' ? 'Min emissions' : 'Max renewables'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">Profile:</span>
          {(Object.keys(DEMAND_PROFILES) as DemandProfile[]).map(d => (
            <button
              key={d}
              onClick={() => setDemandProfile(d)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${demandProfile === d ? 'bg-[var(--color-primary)] text-white' : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]'}`}
            >
              {DEMAND_PROFILES[d].label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* BESS GWh */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2">
              Total BESS investment — <span className="text-[var(--color-text)]">{params.bessGWh} GWh</span>
            </label>
            <input type="range" min={5} max={200} step={5} value={params.bessGWh}
              onChange={e => setParams(p => ({ ...p, bessGWh: +e.target.value }))}
              className="w-full accent-[var(--color-primary)]" />
            <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1"><span>5 GWh</span><span>200 GWh</span></div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2">
              Average duration — <span className="text-[var(--color-text)]">{params.bessDurationHrs} hours</span>
            </label>
            <div className="flex gap-2">
              {[2, 4, 6, 8].map(h => (
                <button
                  key={h}
                  onClick={() => setParams(p => ({ ...p, bessDurationHrs: h }))}
                  className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-colors ${params.bessDurationHrs === h ? 'bg-[var(--color-primary)] text-white' : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]'}`}
                >
                  {h}hr
                </button>
              ))}
            </div>
          </div>

          {/* Peak demand */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2">
              Peak demand to firm — <span className="text-[var(--color-text)]">{params.demandGW} GW</span>
            </label>
            <input type="range" min={2} max={20} step={0.5} value={params.demandGW}
              onChange={e => setParams(p => ({ ...p, demandGW: +e.target.value }))}
              className="w-full accent-[var(--color-primary)]" />
            <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1"><span>2 GW</span><span>20 GW</span></div>
          </div>

          {/* Renewables share */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2">
              Target renewable share — <span className="text-[var(--color-text)]">{params.renewSharePct}%</span>
            </label>
            <input type="range" min={20} max={100} step={5} value={params.renewSharePct}
              onChange={e => setParams(p => ({ ...p, renewSharePct: +e.target.value }))}
              className="w-full accent-[var(--color-primary)]" />
            <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1"><span>20%</span><span>100%</span></div>
          </div>
        </div>

        {/* Preset buttons */}
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          <span className="text-xs text-[var(--color-text-muted)] mr-2">Presets:</span>
          {PRESET_SCENARIOS.map(p => (
            <button
              key={p.label}
              onClick={() => handlePreset(p)}
              className="text-xs px-2.5 py-1 mr-1 mb-1 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <KPICard label="BESS power capacity" value={result.bessPowerGW} unit="GW" sub={`${params.bessGWh} GWh ÷ ${params.bessDurationHrs}hr`} colour="#10b981" />
            <KPICard label="Residual gas needed" value={result.peakGasGW} unit="GW" sub="peak capacity required" colour={result.peakGasGW > 4 ? '#ef4444' : result.peakGasGW > 2 ? '#f59e0b' : '#10b981'} />
            <KPICard label="Total CAPEX" value={`$${result.totalCapex}B`} sub={`BESS $${result.bessTotalCapex}B + Gas $${result.gasCapex}B`} />
            <KPICard label="Effective renewables" value={`${result.effectiveRenewPct}%`} sub={`${result.annualEmissions} MtCO₂/yr`} colour={result.effectiveRenewPct > 70 ? '#10b981' : '#f59e0b'} />
          </div>

          {/* The key insight: BESS power vs gas by duration */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-sm font-semibold text-[var(--color-text)]">Duration trade-off — {params.bessGWh} GWh fixed</h2>
              <div className="relative group">
                <InfoIcon />
                <div className="absolute left-6 top-0 hidden group-hover:block bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3 text-xs text-[var(--color-text-muted)] w-64 z-10 shadow-xl">
                  Same total GWh investment. Longer duration = lower BESS power (GW) but each unit of storage lasts longer before needing gas backup. Shorter duration = more GW of BESS power but discharges faster.
                </div>
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              Fixing {params.bessGWh} GWh total, how does duration shift the BESS power vs residual gas split?
            </p>
            {sweep && (
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={sweep} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="duration" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} label={{ value: 'GW', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--color-text-muted)' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="bessGW" name="BESS power (GW)" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="gasGW" name="Gas needed (GW)" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  {/* ISP reference lines */}
                  <ReferenceLine y={ISP_REFS.current.gasGW} stroke={ISP_REFS.current.color} strokeDasharray="4 2"
                    label={{ value: 'Current gas', fontSize: 10, fill: ISP_REFS.current.color, position: 'right' }} />
                  <ReferenceLine y={ISP_REFS.slow.gasGW} stroke={ISP_REFS.slow.color} strokeDasharray="4 2"
                    label={{ value: 'ISP Slow 2035', fontSize: 10, fill: ISP_REFS.slow.color, position: 'right' }} />
                  <ReferenceLine y={ISP_REFS.step.gasGW} stroke={ISP_REFS.step.color} strokeDasharray="4 2"
                    label={{ value: 'ISP Step 2035', fontSize: 10, fill: ISP_REFS.step.color, position: 'right' }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Hourly dispatch */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-[var(--color-text)] mb-1">24-hour dispatch — {DEMAND_PROFILES[demandProfile].label}</h2>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">{DEMAND_PROFILES[demandProfile].desc}</p>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dispatchData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} interval={3} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} label={{ value: 'MW', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="Renewables (MW)" stackId="1" stroke="#10b981" fill="#10b98140" strokeWidth={1.5} />
                <Area type="monotone" dataKey="BESS discharge (MW)" stackId="1" stroke="#3b82f6" fill="#3b82f640" strokeWidth={1.5} />
                <Area type="monotone" dataKey="Gas (MW)" stackId="1" stroke="#f59e0b" fill="#f59e0b40" strokeWidth={1.5} />
                <Line type="monotone" dataKey="Demand (MW)" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* CAPEX breakdown */}
          {sweep && (
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 mb-6">
              <h2 className="text-sm font-semibold text-[var(--color-text)] mb-4">Total CAPEX by duration ($B) — {params.bessGWh} GWh</h2>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={sweep} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="duration" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} label={{ value: '$B', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--color-text-muted)' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="capex" name="Total CAPEX ($B)" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                  <Line type="monotone" dataKey="renewPct" name="Renew % (right)" stroke="#10b981" strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Assumptions panel */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl mb-6 overflow-hidden">
            <button
              onClick={() => setShowAssumptions(!showAssumptions)}
              className="w-full flex items-center justify-between p-4 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
            >
              <span>Model assumptions</span>
              <span className="text-[var(--color-text-muted)]">{showAssumptions ? '▲' : '▼'}</span>
            </button>
            {showAssumptions && (
              <div className="px-5 pb-5 border-t border-[var(--color-border)]">
                <div className="flex justify-end mt-3 mb-4">
                  <button
                    onClick={() => setEditAssumptions(!editAssumptions)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    <EditIcon /> {editAssumptions ? 'Lock assumptions' : 'Edit assumptions'}
                  </button>
                  {editAssumptions && (
                    <button
                      onClick={() => setAssumptions(DEFAULT_ASSUMPTIONS)}
                      className="ml-2 text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                    >
                      Reset defaults
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {[
                    { key: 'bessCostPerGWh' as keyof Assumptions, label: 'BESS energy cost', unit: '$B/GWh', min: 0.1, max: 1.0, step: 0.05 },
                    { key: 'bessPowerCostPerGW' as keyof Assumptions, label: 'BESS power (inverters)', unit: '$B/GW', min: 0.3, max: 1.5, step: 0.1 },
                    { key: 'gasCostPerGW' as keyof Assumptions, label: 'Gas OCGT CAPEX', unit: '$B/GW', min: 0.5, max: 2.0, step: 0.1 },
                    { key: 'gasVomc' as keyof Assumptions, label: 'Gas variable O&M', unit: '$/MWh', min: 30, max: 200, step: 5 },
                    { key: 'gasEmissions' as keyof Assumptions, label: 'Gas emissions intensity', unit: 'tCO₂/MWh', min: 0.3, max: 0.8, step: 0.05 },
                    { key: 'bessRte' as keyof Assumptions, label: 'BESS round-trip efficiency', unit: '%', min: 0.75, max: 0.95, step: 0.01 },
                  ].map(({ key, label, unit, min, max, step }) => (
                    <div key={key}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
                        <span className="text-xs font-medium text-[var(--color-text)] tabular-nums">
                          {key === 'bessRte' ? `${Math.round(assumptions[key] * 100)}%` : assumptions[key]}
                          {key !== 'bessRte' && ` ${unit}`}
                        </span>
                      </div>
                      {editAssumptions ? (
                        <input type="range" min={min} max={max} step={step} value={assumptions[key]}
                          onChange={e => setAssumptions(a => ({ ...a, [key]: +e.target.value }))}
                          className="w-full accent-[var(--color-primary)]" />
                      ) : (
                        <div className="h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--color-primary)] opacity-50 rounded-full"
                            style={{ width: `${((assumptions[key] - min) / (max - min)) * 100}%` }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
                  <div className="flex items-start gap-2 text-xs text-[var(--color-text-muted)]">
                    <InfoIcon />
                    <span>Costs reflect 2024–2025 Australian market benchmarks. BESS energy and power costs are modelled separately — longer duration adds energy cost but not power cost. Gas CAPEX assumes OCGT peaker plant. Emissions intensity reflects average NEM gas generation.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ISP reference table */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3">ISP 2026 reference trajectories</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <th className="text-left pb-2 font-medium">Scenario</th>
                <th className="text-right pb-2 font-medium">Gas GW (2035)</th>
                <th className="text-right pb-2 font-medium">BESS GW (2035)</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(ISP_REFS).map(r => (
                <tr key={r.label} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="py-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: r.color }} />
                    {r.label}
                  </td>
                  <td className="py-2 text-right tabular-nums font-medium" style={{ color: '#f59e0b' }}>{r.gasGW} GW</td>
                  <td className="py-2 text-right tabular-nums font-medium" style={{ color: '#10b981' }}>{r.bessGW} GW</td>
                </tr>
              ))}
              {result && (
                <tr className="bg-[var(--color-border)] bg-opacity-30">
                  <td className="py-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block bg-purple-500" />
                    Your scenario ({params.bessGWh} GWh · {params.bessDurationHrs}hr)
                  </td>
                  <td className="py-2 text-right tabular-nums font-semibold" style={{ color: '#f59e0b' }}>{result.peakGasGW} GW</td>
                  <td className="py-2 text-right tabular-nums font-semibold" style={{ color: '#10b981' }}>{result.bessPowerGW} GW</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
