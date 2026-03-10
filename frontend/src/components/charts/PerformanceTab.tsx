import {
  BarChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ComposedChart, Legend,
} from 'recharts'
import type { Project, AnnualPerformance } from '../../lib/types'
import { getPerformanceData } from '../../data/sample-performance'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TooltipFormatter = (value: any, name: any) => [string, string]

interface Props {
  project: Project
}

export default function PerformanceTab({ project }: Props) {
  const perf = getPerformanceData(project.id)

  if (!perf) {
    return (
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] border-dashed rounded-xl p-8 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">
          Performance data not yet available for this project
        </p>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          AEMO dispatch data pipeline coming in Phase 3
        </p>
      </div>
    )
  }

  const isBess = project.technology === 'bess'

  return (
    <div className="space-y-6">
      {/* Sample data notice */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
        <p className="text-[10px] text-amber-600 dark:text-amber-400">
          Sample data — real AEMO dispatch data pipeline coming in Phase 3
        </p>
      </div>

      {isBess ? (
        <BessCharts perf={perf} annual={perf.annual} />
      ) : (
        <GenerationCharts perf={perf} annual={perf.annual} />
      )}
    </div>
  )
}

// ============================================================
// Wind / Solar / Hybrid Charts
// ============================================================

function GenerationCharts({
  perf,
  annual,
}: {
  perf: ReturnType<typeof getPerformanceData> & {}
  annual: AnnualPerformance[]
}) {
  const priceData = annual.map((a) => ({
    year: a.year.toString(),
    price: a.energy_price_received,
  }))

  const curtailmentData = annual.map((a) => ({
    year: a.year.toString(),
    curtailment: a.curtailment_pct,
    capacityFactor: a.capacity_factor_pct,
  }))

  return (
    <>
      {/* YTD Summary */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="YTD Avg Price"
          value={`$${perf.ytd_price}/MWh`}
          sub={perf.ytd_period}
        />
        <MetricCard
          label="Latest Curtailment"
          value={`${annual[annual.length - 1]?.curtailment_pct ?? '—'}%`}
          sub={annual[annual.length - 1]?.year.toString() ?? ''}
          warn={
            annual.length > 0 &&
            (annual[annual.length - 1]?.curtailment_pct ?? 0) > 5
          }
        />
      </div>

      {/* Energy Price Received Chart */}
      <ChartSection title="Energy Price Received ($/MWh)">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={priceData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="var(--color-text-muted)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--color-text-muted)" tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={((value: number) => [`$${value}/MWh`, 'Avg Price']) as TooltipFormatter}
            />
            <Bar dataKey="price" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      {/* Curtailment & Capacity Factor Chart */}
      <ChartSection title="Curtailment & Capacity Factor">
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={curtailmentData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="var(--color-text-muted)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--color-text-muted)" tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={((value: number, name: string) => [
                `${value}%`,
                name === 'curtailment' ? 'Curtailment' : 'Capacity Factor',
              ]) as TooltipFormatter}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value: string) =>
                value === 'curtailment' ? 'Curtailment %' : 'Capacity Factor %'
              }
            />
            <Bar dataKey="capacityFactor" fill="#22c55e" radius={[4, 4, 0, 0]} opacity={0.7} />
            <Line
              type="monotone"
              dataKey="curtailment"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 4, fill: '#ef4444' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartSection>
    </>
  )
}

// ============================================================
// BESS Charts
// ============================================================

function BessCharts({
  perf,
  annual,
}: {
  perf: ReturnType<typeof getPerformanceData> & {}
  annual: AnnualPerformance[]
}) {
  const priceData = annual.map((a) => ({
    year: a.year.toString(),
    charge: a.avg_charge_price,
    discharge: a.avg_discharge_price,
    spread: (a.avg_discharge_price ?? 0) - (a.avg_charge_price ?? 0),
  }))

  const utilisationData = annual.map((a) => ({
    year: a.year.toString(),
    utilisation: a.utilisation_pct,
    cycles: a.cycles,
  }))

  const latestYear = annual[annual.length - 1]
  const latestSpread = latestYear
    ? (latestYear.avg_discharge_price ?? 0) - (latestYear.avg_charge_price ?? 0)
    : 0

  return (
    <>
      {/* YTD Summary */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          label="YTD Charge"
          value={`$${perf.ytd_charge_price}/MWh`}
          sub={perf.ytd_period}
        />
        <MetricCard
          label="YTD Discharge"
          value={`$${perf.ytd_discharge_price}/MWh`}
          sub={perf.ytd_period}
        />
        <MetricCard
          label="Latest Spread"
          value={`$${latestSpread}/MWh`}
          sub={latestYear?.year.toString() ?? ''}
        />
      </div>

      {/* Charge / Discharge Price Chart */}
      <ChartSection title="Avg Charge & Discharge Price ($/MWh)">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={priceData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="var(--color-text-muted)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--color-text-muted)" tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={((value: number, name: string) => [
                `$${value}/MWh`,
                name === 'charge' ? 'Charge' : name === 'discharge' ? 'Discharge' : 'Spread',
              ]) as TooltipFormatter}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value: string) => {
                if (value === 'charge') return 'Charge Price'
                if (value === 'discharge') return 'Discharge Price'
                return 'Spread'
              }}
            />
            <Bar dataKey="charge" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="discharge" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      {/* Utilisation & Cycles Chart */}
      <ChartSection title="Utilisation & Cycles">
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={utilisationData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="var(--color-text-muted)" />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11 }}
              stroke="var(--color-text-muted)"
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              stroke="var(--color-text-muted)"
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={((value: number, name: string) => [
                name === 'utilisation' ? `${value}%` : `${value}`,
                name === 'utilisation' ? 'Utilisation' : 'Cycles',
              ]) as TooltipFormatter}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value: string) =>
                value === 'utilisation' ? 'Utilisation %' : 'Cycles/Year'
              }
            />
            <Bar
              yAxisId="left"
              dataKey="utilisation"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              opacity={0.7}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cycles"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 4, fill: '#f59e0b' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartSection>
    </>
  )
}

// ============================================================
// Shared sub-components
// ============================================================

function ChartSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">{title}</h3>
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        {children}
      </div>
    </section>
  )
}

function MetricCard({
  label,
  value,
  sub,
  warn,
}: {
  label: string
  value: string
  sub: string
  warn?: boolean
}) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-3 py-2">
      <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-sm font-bold ${warn ? 'text-red-500' : 'text-[var(--color-text)]'}`}>
        {value}
      </p>
      <p className="text-[10px] text-[var(--color-text-muted)]">{sub}</p>
    </div>
  )
}
