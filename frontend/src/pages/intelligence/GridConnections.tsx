import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { fetchElectranetData, type ElectranetData } from '../../lib/dataService'
import ScrollableTable from '../../components/common/ScrollableTable'

const REGIONS = ['Mid North', 'Eyre Peninsula', 'South East'] as const
type Region = typeof REGIONS[number]

const REGION_COLOURS: Record<Region, string> = {
  'Mid North': '#10b981',
  'Eyre Peninsula': '#3b82f6',
  'South East': '#f59e0b',
}

const STATE_STUBS = [
  { state: 'NSW', tnsp: 'TransGrid', status: 'available via AEMO KCI — see EIS Coverage tab' },
  { state: 'VIC', tnsp: 'VicGrid / AusNet Services', status: 'AEMO NER 5.18A.2 register ingested — no forward-looking headroom document' },
  { state: 'QLD', tnsp: 'Powerlink', status: 'available via AEMO KCI — see EIS Coverage tab' },
  { state: 'TAS', tnsp: 'TasNetworks', status: 'available via AEMO KCI — see EIS Coverage tab' },
]

function fmtMW(v: number | string | null | undefined): string {
  if (v == null || v === '') return '—'
  if (typeof v === 'string') return v // e.g. "5/55" from Table 16
  return v.toLocaleString('en-AU', { maximumFractionDigits: 0 }) + ' MW'
}

function fmtVoltage(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${v} kV`
}

function fmtInt(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toLocaleString('en-AU')
}

export default function GridConnections() {
  const [data, setData] = useState<ElectranetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeRegion, setActiveRegion] = useState<Region>('Mid North')

  useEffect(() => {
    fetchElectranetData().then(d => { setData(d); setLoading(false) })
  }, [])

  const regionSummary = useMemo(() => {
    if (!data) return null
    return REGIONS.map(region => {
      const existing = data.existing.filter(r => r.region === region)
      const available = data.available.filter(r => r.region === region)
      const bays = data.bays.filter(r => r.region === region)
      const ras = data.ras.filter(r => (r.region_area || '').toLowerCase().includes(region.toLowerCase())
        || r.region_area?.toLowerCase() === 'all')
      const gen = existing.filter(r => r.connection_type === 'generation')
        .reduce((sum, r) => sum + (typeof r.capacity_mw === 'number' ? r.capacity_mw : 0), 0)
      const headroom = available.reduce((sum, r) => {
        const v = r.available_generation_high_constraints_mw
          ?? r.available_generation_low_constraints_mw
        return sum + (typeof v === 'number' ? v : 0)
      }, 0)
      return {
        region, existing: existing.length, available: available.length,
        bays: bays.reduce((s, b) => s + (b.available_bays || 0), 0),
        ras: ras.length,
        gen_connected_mw: gen,
        gen_headroom_mw: headroom,
      }
    })
  }, [data])

  const regionData = useMemo(() => {
    if (!data) return null
    return {
      existing: data.existing.filter(r => r.region === activeRegion),
      available: data.available.filter(r => r.region === activeRegion),
      bays: data.bays.filter(r => r.region === activeRegion),
      ras: data.ras.filter(r => (r.region_area || '').toLowerCase().includes(activeRegion.toLowerCase())
        || r.region_area?.toLowerCase() === 'all'),
    }
  }, [data, activeRegion])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Grid Connection Headroom
        </h1>
        <div style={{ color: 'var(--color-text-secondary)' }}>Loading connection data…</div>
      </div>
    )
  }

  if (!data || !regionSummary || !regionData) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Grid Connection Headroom
        </h1>
        <div style={{ color: 'var(--color-text-secondary)' }}>Connection data unavailable.</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Grid Connection Headroom
        </h1>
        <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          Forward-looking connection capacity per substation across Australia's transmission networks.
          Complementary to <Link to="/intelligence/eis-technical" className="underline">AEMO KCI</Link> —
          KCI is per-project application state, while this shows the TNSP's own headroom estimates for
          <em> new</em> connections. Currently SA (ElectraNet) is populated; other states link to their KCI data.
        </p>
        <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Source: {data.manifest?.source || 'ElectraNet — Network Connection Opportunities to 2030'}
          {data.manifest?.source_published ? ` · Published ${data.manifest.source_published}` : ''}
          {data.manifest?.ingested_at ? ` · Ingested ${data.manifest.ingested_at}` : ''}
        </div>
      </div>

      {/* Region summary tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {regionSummary.map(r => (
          <button
            key={r.region}
            onClick={() => setActiveRegion(r.region)}
            className="text-left p-4 rounded-lg border transition-colors"
            style={{
              background: activeRegion === r.region ? 'var(--color-bg-secondary)' : 'var(--color-bg-primary)',
              borderColor: activeRegion === r.region ? REGION_COLOURS[r.region] : 'var(--color-border)',
              borderLeftWidth: '3px', borderLeftColor: REGION_COLOURS[r.region],
            }}
          >
            <div className="font-bold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {r.region}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <div>Existing: <span className="font-mono font-bold" style={{ color: 'var(--color-text-primary)' }}>{r.existing}</span></div>
              <div>Bays: <span className="font-mono font-bold" style={{ color: 'var(--color-text-primary)' }}>{r.bays}</span></div>
              <div>Connected gen: <span className="font-mono" style={{ color: 'var(--color-text-primary)' }}>{fmtInt(Math.round(r.gen_connected_mw))} MW</span></div>
              <div>Headroom (high): <span className="font-mono font-bold" style={{ color: REGION_COLOURS[r.region] }}>{fmtInt(Math.round(r.gen_headroom_mw))} MW</span></div>
              <div>RAS: <span className="font-mono" style={{ color: 'var(--color-text-primary)' }}>{r.ras}</span></div>
            </div>
          </button>
        ))}
      </div>

      {/* Existing connections */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
          Existing &amp; committed connections — {activeRegion}
          <span className="ml-2 text-sm font-normal" style={{ color: 'var(--color-text-tertiary)' }}>
            ({regionData.existing.length} rows)
          </span>
        </h2>
        <ScrollableTable>
          <table className="w-full text-sm" style={{ color: 'var(--color-text-primary)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="text-left py-2 px-3">Sub-region</th>
                <th className="text-left py-2 px-3">Connection</th>
                <th className="text-left py-2 px-3">Type</th>
                <th className="text-right py-2 px-3">Capacity</th>
                <th className="text-left py-2 px-3">Voltage</th>
                <th className="text-left py-2 px-3">Substation</th>
                <th className="text-left py-2 px-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {regionData.existing.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="py-2 px-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{r.sub_region}</td>
                  <td className="py-2 px-3 font-medium">{r.connection_name}</td>
                  <td className="py-2 px-3">
                    <span className="text-xs px-2 py-0.5 rounded" style={{
                      background: r.connection_type === 'generation' ? '#10b981' : '#6366f1',
                      color: 'white',
                    }}>{r.connection_type}</span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono">{fmtMW(r.capacity_mw)}</td>
                  <td className="py-2 px-3 font-mono text-xs">{fmtVoltage(r.voltage_kv)}</td>
                  <td className="py-2 px-3 text-xs">{r.substation || '—'}</td>
                  <td className="py-2 px-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{r.notes || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollableTable>
      </section>

      {/* Available capacity */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
          Available capacity for new connections — {activeRegion}
          <span className="ml-2 text-sm font-normal" style={{ color: 'var(--color-text-tertiary)' }}>
            ({regionData.available.length} substations)
          </span>
        </h2>
        <ScrollableTable>
          <table className="w-full text-sm" style={{ color: 'var(--color-text-primary)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="text-left py-2 px-3">Sub-region</th>
                <th className="text-left py-2 px-3">Substation</th>
                <th className="text-left py-2 px-3">Voltage</th>
                <th className="text-right py-2 px-3">Bays</th>
                <th className="text-right py-2 px-3">Gen (low)</th>
                <th className="text-right py-2 px-3">Gen (high)</th>
                <th className="text-right py-2 px-3">Load</th>
                <th className="text-left py-2 px-3">Interest</th>
                <th className="text-left py-2 px-3">Constraints</th>
              </tr>
            </thead>
            <tbody>
              {regionData.available.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="py-2 px-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{r.sub_region}</td>
                  <td className="py-2 px-3 font-medium">{r.substation}</td>
                  <td className="py-2 px-3 font-mono text-xs">{fmtVoltage(r.voltage_kv)}</td>
                  <td className="py-2 px-3 text-right font-mono">{fmtInt(r.spare_bay_availability)}</td>
                  <td className="py-2 px-3 text-right font-mono" style={{ color: '#94a3b8' }}>{fmtMW(r.available_generation_low_constraints_mw)}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold" style={{ color: '#10b981' }}>{fmtMW(r.available_generation_high_constraints_mw)}</td>
                  <td className="py-2 px-3 text-right font-mono" style={{ color: '#6366f1' }}>{fmtMW(r.available_load_mw)}</td>
                  <td className="py-2 px-3 text-xs">
                    {r.proponent_interest && (
                      <span className="text-xs px-2 py-0.5 rounded" style={{
                        background: r.proponent_interest === 'High' ? '#dc2626' :
                                    r.proponent_interest === 'Medium' ? '#f59e0b' : '#6b7280',
                        color: 'white',
                      }}>{r.proponent_interest}</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{r.constraints_note || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollableTable>
      </section>

      {/* Available bays */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
          Available bays per substation — {activeRegion}
          <span className="ml-2 text-sm font-normal" style={{ color: 'var(--color-text-tertiary)' }}>
            ({regionData.bays.length} rows)
          </span>
        </h2>
        <ScrollableTable>
          <table className="w-full text-sm" style={{ color: 'var(--color-text-primary)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="text-left py-2 px-3">Substation</th>
                <th className="text-left py-2 px-3">Voltage</th>
                <th className="text-right py-2 px-3">Available bays</th>
                <th className="text-left py-2 px-3">Bay type</th>
                <th className="text-left py-2 px-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {regionData.bays.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="py-2 px-3 font-medium">{r.substation}</td>
                  <td className="py-2 px-3 font-mono text-xs">{fmtVoltage(r.voltage_kv)}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold">{fmtInt(r.available_bays)}</td>
                  <td className="py-2 px-3 text-xs">{r.bay_type || '—'}</td>
                  <td className="py-2 px-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{r.notes || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollableTable>
      </section>

      {/* Remedial Action Schemes */}
      {regionData.ras.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            Remedial Action Schemes affecting {activeRegion}
            <span className="ml-2 text-sm font-normal" style={{ color: 'var(--color-text-tertiary)' }}>
              ({regionData.ras.length})
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {regionData.ras.map((r, i) => (
              <div key={i} className="p-3 rounded border" style={{
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
                borderLeftWidth: '3px', borderLeftColor: '#dc2626',
              }}>
                <div className="font-bold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  {r.scheme_name}
                </div>
                <div className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  {r.region_area}{r.impacted_substation ? ` · ${r.impacted_substation}` : ''}
                </div>
                {r.description && (
                  <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {r.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Other states — placeholder */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
          Other states
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {STATE_STUBS.map(s => (
            <div key={s.state} className="p-3 rounded border" style={{
              background: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
            }}>
              <div className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {s.state} <span className="text-xs font-normal" style={{ color: 'var(--color-text-tertiary)' }}>({s.tnsp})</span>
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                {s.status}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 pt-4 text-xs" style={{
        color: 'var(--color-text-tertiary)',
        borderTop: '1px solid var(--color-border)',
      }}>
        <div className="font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Data sources</div>
        <div>
          ElectraNet — <a href={data.manifest?.source_url || '#'} target="_blank" rel="noopener noreferrer"
             className="underline">Network Connection Opportunities to 2030 (FY25-26)</a>
          {data.manifest?.source_published ? ` · ${data.manifest.source_published}` : ''}
          {data.manifest?.classification ? ` · ${data.manifest.classification}` : ''}
          . Ingested {data.manifest?.ingested_at || '2026-08-09'} via <code>v3.31.0</code>.
        </div>
        <div className="mt-1">
          AEMO NER 5.18A.2 (VIC register) ingested {data.manifest?.ingested_at || '2026-08-09'} via <code>v3.31.0</code>.
        </div>
      </div>
    </div>
  )
}
