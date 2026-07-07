import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { fetchResearchNotes } from '../../lib/dataService'
import type { ResearchNotesData, ResearchNote, ResearchNoteCategory } from '../../lib/types'
import DataProvenance from '../../components/common/DataProvenance'

// Icons — defined BEFORE const arrays (Vite HMR pattern)
const BessIcon = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
const SchemeIcon = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
const PriceIcon = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const PolicyIcon = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
const RezIcon = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
const SenateIcon = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>

type DateRange = '30d' | '90d' | 'all'

const CATEGORIES: { id: ResearchNoteCategory | 'all'; label: string; icon: React.ReactNode; colour: string }[] = [
  { id: 'all', label: 'All', icon: null, colour: 'var(--color-primary)' },
  { id: 'bess-market', label: 'BESS Market', icon: <BessIcon />, colour: '#10b981' },
  { id: 'cis-ltesa', label: 'CIS / LTESA', icon: <SchemeIcon />, colour: '#3b82f6' },
  { id: 'wholesale-prices', label: 'Wholesale Prices', icon: <PriceIcon />, colour: '#f59e0b' },
  { id: 'policy', label: 'Policy', icon: <PolicyIcon />, colour: '#8b5cf6' },
  { id: 'rez-transmission', label: 'REZ / Transmission', icon: <RezIcon />, colour: '#06b6d4' },
  { id: 'senate-estimates', label: 'Senate Estimates', icon: <SenateIcon />, colour: '#ec4899' },
]

const CATEGORY_COLOUR: Record<string, string> = Object.fromEntries(
  CATEGORIES.filter(c => c.id !== 'all').map(c => [c.id, c.colour])
)

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.filter(c => c.id !== 'all').map(c => [c.id, c.label])
)

function daysAgo(dateStr: string): number {
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ResearchNotes() {
  const [data, setData] = useState<ResearchNotesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<ResearchNoteCategory | 'all'>('all')
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchResearchNotes().then(d => { setData(d); setLoading(false) })
  }, [])

  const filtered = useMemo(() => {
    if (!data) return []
    let notes = data.notes

    if (activeCategory !== 'all') {
      notes = notes.filter(n => n.category === activeCategory)
    }

    if (dateRange !== 'all') {
      const maxDays = dateRange === '30d' ? 30 : 90
      notes = notes.filter(n => daysAgo(n.date) <= maxDays)
    }

    return notes.sort((a, b) => b.date.localeCompare(a.date))
  }, [data, activeCategory, dateRange])

  const toggleNote = (id: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-bg-elevated)] rounded w-1/3" />
          <div className="h-4 bg-[var(--color-bg-elevated)] rounded w-2/3" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-[var(--color-bg-elevated)] rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <p className="text-[var(--color-text-muted)]">Failed to load research notes.</p>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-[var(--color-text)]">Research Notes</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Time-stamped analysis and commentary across NEM market themes. {data.notes.length} notes.
        </p>
      </div>

      {/* Category pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === c.id
                ? 'text-white'
                : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
            style={activeCategory === c.id ? { background: c.colour } : undefined}
          >
            {c.icon}
            {c.label}
          </button>
        ))}
      </div>

      {/* Date range + count */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1">
          {(['30d', '90d', 'all'] as DateRange[]).map(r => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                dateRange === r
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {r === 'all' ? 'All time' : r === '30d' ? '30 days' : '90 days'}
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--color-text-muted)]">{filtered.length} note{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Notes list */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-8 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">No notes match the current filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              expanded={expandedNotes.has(note.id)}
              onToggle={() => toggleNote(note.id)}
            />
          ))}
        </div>
      )}

      {/* Data Provenance */}
      <div className="mt-8">
        <DataProvenance page="research-notes" />
      </div>
    </div>
  )
}

// ---------- Note Card ----------

function NoteCard({ note, expanded, onToggle }: {
  note: ResearchNote; expanded: boolean; onToggle: () => void
}) {
  const catColour = CATEGORY_COLOUR[note.category] || 'var(--color-text-muted)'
  const catLabel = CATEGORY_LABEL[note.category] || note.category

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
      {/* Header — always visible, clickable */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 lg:p-5 flex items-start gap-3 hover:bg-[var(--color-bg-elevated)]/50 transition-colors"
      >
        <div className="shrink-0 mt-0.5">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: catColour }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: catColour + '20', color: catColour }}>
              {catLabel}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">{formatDate(note.date)}</span>
          </div>
          <h3 className="text-sm font-semibold text-[var(--color-text)] leading-snug">{note.title}</h3>
          {!expanded && note.sections.length > 0 && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">
              {note.sections[0].body}
            </p>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-[var(--color-text-muted)] shrink-0 mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 lg:px-5 pb-4 lg:pb-5 pt-0 border-t border-[var(--color-border)]">
          <div className="space-y-4 mt-4">
            {note.sections.map((s, i) => (
              <div key={i}>
                {s.heading && (
                  <h4 className="text-xs font-semibold text-[var(--color-text)] mb-1">{s.heading}</h4>
                )}
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{s.body}</p>
                {s.image && (
                  <div className="mt-3">
                    <img
                      src={s.image.src}
                      alt={s.image.alt}
                      className="rounded-lg border border-[var(--color-border)] w-full max-w-2xl"
                    />
                    {s.image.caption && (
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-1 italic">{s.image.caption}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {note.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 text-[10px] rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Related projects */}
          {note.related_project_ids.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="text-[10px] text-[var(--color-text-muted)]">Related:</span>
              {note.related_project_ids.map(id => (
                <Link
                  key={id}
                  to={`/projects/${id}`}
                  className="text-[10px] text-[var(--color-primary)] hover:underline"
                >
                  {id}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
