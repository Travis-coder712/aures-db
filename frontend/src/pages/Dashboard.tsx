import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useNEMStats } from '../hooks/useNEMStats'
import { TECHNOLOGY_CONFIG } from '../lib/types'
import type { Technology } from '../lib/types'

const STATUS_COLORS = {
  operating: '#22c55e',
  construction: '#f59e0b',
  development: '#3b82f6',
}

export default function Dashboard() {
  const { stats, loading } = useNEMStats()

  if (loading || !stats) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-[var(--color-bg-card)] rounded w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[var(--color-bg-card)] rounded-xl h-24" />
            ))}
          </div>
          <div className="bg-[var(--color-bg-card)] rounded-xl h-80" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <section>
        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text)] mb-2">
          NEM Fleet Dashboard
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Capacity overview across Australia's National Electricity Market and WEM.
          {' '}{(stats.operating_gw + stats.construction_gw + stats.development_gw).toFixed(0)} GW tracked across 1,067 projects.
        </p>
      </section>

      {/* Headline Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <FleetCard
          label="Operating"
          value={`${stats.operating_gw.toFixed(1)} GW`}
          color={STATUS_COLORS.operating}
        />
        <FleetCard
          label="Under Construction"
          value={`${stats.construction_gw.toFixed(1)} GW`}
          color={STATUS_COLORS.construction}
          sublabel={`${stats.pipeline.length} projects`}
        />
        <FleetCard
          label="In Development"
          value={`${stats.development_gw.toFixed(1)} GW`}
          color={STATUS_COLORS.development}
        />
        <FleetCard
          label="Total Storage"
          value={`${stats.total_storage_gwh.toFixed(0)} GWh`}
          color="#8b5cf6"
          sublabel="BESS + pumped hydro"
        />
      </section>

      {/* Capacity by Technology */}
      <section className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          Capacity by Technology
        </h2>
        <div className="h-72 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.by_technology} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                label={{
                  value: 'GW',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#6b7280',
                  fontSize: 12,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#f1f5f9',
                  fontSize: 13,
                }}
                formatter={(value: number) => `${value.toFixed(1)} GW`}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
              />
              <Bar
                dataKey="operating"
                name="Operating"
                stackId="a"
                fill={STATUS_COLORS.operating}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="construction"
                name="Construction"
                stackId="a"
                fill={STATUS_COLORS.construction}
              />
              <Bar
                dataKey="development"
                name="Development"
                stackId="a"
                fill={STATUS_COLORS.development}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Capacity by State */}
      <section className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          Capacity by State
        </h2>
        <div className="h-72 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.by_state} layout="vertical" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                type="number"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                label={{
                  value: 'GW',
                  position: 'insideBottom',
                  offset: -2,
                  fill: '#6b7280',
                  fontSize: 12,
                }}
              />
              <YAxis
                type="category"
                dataKey="state"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#f1f5f9',
                  fontSize: 13,
                }}
                formatter={(value: number) => `${value.toFixed(1)} GW`}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              <Bar
                dataKey="operating"
                name="Operating"
                stackId="a"
                fill={STATUS_COLORS.operating}
              />
              <Bar
                dataKey="construction"
                name="Construction"
                stackId="a"
                fill={STATUS_COLORS.construction}
              />
              <Bar
                dataKey="development"
                name="Development"
                stackId="a"
                fill={STATUS_COLORS.development}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Construction Pipeline */}
      <section className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            Construction Pipeline
          </h2>
          <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] px-2 py-1 rounded-full">
            {stats.pipeline.length} projects · {stats.construction_gw.toFixed(1)} GW
          </span>
        </div>
        {stats.pipeline.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No projects currently under construction.</p>
        ) : (
          <div className="space-y-2">
            {stats.pipeline.map((p) => {
              const tech = TECHNOLOGY_CONFIG[p.technology]
              return (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <span className="text-base">{tech?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--color-text)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                        {p.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] flex-shrink-0">
                        {p.state}
                      </span>
                    </div>
                    {p.developer && (
                      <span className="text-xs text-[var(--color-text-muted)]">{p.developer}</span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-medium" style={{ color: tech?.color }}>
                      {p.capacity_mw >= 1000
                        ? `${(p.capacity_mw / 1000).toFixed(1)} GW`
                        : `${p.capacity_mw} MW`}
                    </span>
                    {p.storage_mwh ? (
                      <div className="text-[10px] text-[var(--color-text-muted)]">
                        {p.storage_mwh >= 1000
                          ? `${(p.storage_mwh / 1000).toFixed(1)} GWh`
                          : `${p.storage_mwh} MWh`}
                      </div>
                    ) : null}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function FleetCard({
  label,
  value,
  color,
  sublabel,
}: {
  label: string
  value: string | number
  color?: string
  sublabel?: string
}) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
        {label}
      </p>
      <p className="text-xl lg:text-2xl font-bold" style={{ color: color || 'var(--color-text)' }}>
        {value}
      </p>
      {sublabel && (
        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{sublabel}</p>
      )}
    </div>
  )
}
