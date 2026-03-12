import { useState, useEffect } from 'react'
import { fetchDataSources } from '../lib/dataService'
import type { DataSourcesIndex, DataSourceInfo } from '../lib/types'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

function getStatus(source: DataSourceInfo): { label: string; color: string } {
  if (source.last_status === 'never') return { label: 'Never Run', color: '#ef4444' }
  if (source.last_status === 'failed') return { label: 'Failed', color: '#ef4444' }
  if (source.last_status === 'running') return { label: 'Running', color: '#f59e0b' }

  const days = daysSince(source.last_run)
  if (days === null) return { label: 'Unknown', color: '#6b7280' }

  const thresholds: Record<string, number> = {
    monthly: 35,
    quarterly: 100,
    ad_hoc: 999,
  }
  const threshold = thresholds[source.frequency] || 35

  if (days <= threshold * 0.7) return { label: 'Current', color: '#22c55e' }
  if (days <= threshold) return { label: 'Due Soon', color: '#f59e0b' }
  return { label: 'Overdue', color: '#ef4444' }
}

function formatFrequency(f: string): string {
  return f === 'ad_hoc' ? 'Ad hoc' : f.charAt(0).toUpperCase() + f.slice(1)
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

export default function DataSources() {
  const [data, setData] = useState<DataSourcesIndex | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDataSources().then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-bg-elevated)] rounded w-48" />
          <div className="h-64 bg-[var(--color-bg-elevated)] rounded" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Data Sources</h1>
        <p className="text-[var(--color-text-muted)]">
          Data sources metadata not yet exported. Run the export pipeline to generate this data.
        </p>
      </div>
    )
  }

  const stats = data.database_stats

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">Data Sources & Status</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Where AURES data comes from and when each source was last updated.
        </p>
      </div>

      {/* Database Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)]">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Projects</p>
          <p className="text-2xl font-bold text-[var(--color-text)]">{formatNumber(stats.total_projects)}</p>
        </div>
        <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)]">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Operating</p>
          <p className="text-2xl font-bold text-[var(--color-operating)]">{formatNumber(stats.operating_projects)}</p>
        </div>
        <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)]">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Offtakes</p>
          <p className="text-2xl font-bold text-[var(--color-text)]">{stats.total_offtakes}</p>
        </div>
        <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)]">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Last Export</p>
          <p className="text-sm font-bold text-[var(--color-text)]">{formatDate(data.exported_at)}</p>
        </div>
      </div>

      {/* Sources Table */}
      <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Pipeline Data Sources</h2>
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                <th className="text-left px-4 py-2.5 font-medium">Source</th>
                <th className="text-left px-4 py-2.5 font-medium">Frequency</th>
                <th className="text-left px-4 py-2.5 font-medium">Last Updated</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-right px-4 py-2.5 font-medium">Records</th>
              </tr>
            </thead>
            <tbody>
              {data.sources.map((source) => {
                const status = getStatus(source)
                const days = daysSince(source.last_run)
                return (
                  <tr key={source.id} className="border-b border-[var(--color-border)]/50 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--color-text)]">{source.name}</div>
                      <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{source.description}</div>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">
                      {formatFrequency(source.frequency)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[var(--color-text)]">{formatDate(source.last_run)}</div>
                      {days !== null && (
                        <div className="text-xs text-[var(--color-text-muted)]">{days}d ago</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: status.color + '20', color: status.color }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-text-muted)] tabular-nums">
                      {source.records_imported > 0 ? formatNumber(source.records_imported) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden divide-y divide-[var(--color-border)]/50">
          {data.sources.map((source) => {
            const status = getStatus(source)
            const days = daysSince(source.last_run)
            return (
              <div key={source.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="font-medium text-sm text-[var(--color-text)]">{source.name}</div>
                  <span
                    className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0"
                    style={{ backgroundColor: status.color + '20', color: status.color }}
                  >
                    {status.label}
                  </span>
                </div>
                <div className="text-xs text-[var(--color-text-muted)] mb-2">{source.description}</div>
                <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                  <span>{formatFrequency(source.frequency)}</span>
                  <span>{formatDate(source.last_run)}{days !== null ? ` (${days}d ago)` : ''}</span>
                  {source.records_imported > 0 && (
                    <span>{formatNumber(source.records_imported)} records</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CLI hint */}
      <div className="mt-6 bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Updating Data</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-3">
          Data updates are run locally via the pipeline admin tool. To update all sources:
        </p>
        <code className="block bg-[var(--color-bg)] text-xs text-[var(--color-primary)] px-3 py-2 rounded-lg font-mono">
          python3 pipeline/admin.py
        </code>
      </div>
    </div>
  )
}
