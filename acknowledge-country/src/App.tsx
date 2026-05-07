import React, { useState, useCallback, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { findNationById } from './data/nations'
import { GENERAL_FACTS } from './data/generalFacts'
import { LEGISLATION } from './data/legislation'
import { RESOURCES } from './data/resources'
import { CITIES, findNearestCity, searchCities } from './data/cities'
import { ON_THIS_DAY, getTodayKey } from './data/onThisDay'
import type {
  Nation,
  City,
  Screen,
  AcknowledgementFormat,
  AcknowledgeTab,
  FactCategory,
  Fact,
  HistoricalEvent,
  Resource,
} from './data/types'

// ── Colour tokens ──────────────────────────────────────────────────────────
const C = {
  bg: '#0d0906',
  card: '#1c130d',
  cardHover: '#241a11',
  border: '#3d2a1a',
  borderLight: '#4f3520',
  text: '#f0e6d8',
  muted: '#9a7d68',
  ochre: '#d4882d',
  ochreDark: '#a86720',
  red: '#8b1a1a',
  redLight: '#b52424',
  sky: '#7ab8d4',
}

// ── Category styling ───────────────────────────────────────────────────────
const CAT_STYLE: Record<FactCategory, { bg: string; label: string }> = {
  history: { bg: '#4a1c0d', label: 'History' },
  culture: { bg: '#0d3040', label: 'Culture' },
  language: { bg: '#1a3d1a', label: 'Language' },
  land: { bg: '#2d3000', label: 'Country' },
  people: { bg: '#300d35', label: 'People' },
  contemporary: { bg: '#1a1a3d', label: 'Contemporary' },
  sovereignty: { bg: '#3d1a00', label: 'Sovereignty' },
  spirituality: { bg: '#221a35', label: 'Spirituality' },
}

// ── Helpers ────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function pickFacts(nation: Nation, count = 6): Fact[] {
  return shuffle(nation.facts).slice(0, Math.min(count, nation.facts.length))
}

function pickGeneralFacts(count = 3): Fact[] {
  return shuffle(GENERAL_FACTS).slice(0, count)
}

function pickEvents(count = 8): HistoricalEvent[] {
  return shuffle(LEGISLATION).slice(0, count).sort((a, b) => a.year - b.year)
}

// ── Sub-components ─────────────────────────────────────────────────────────
function SourceLink({ source, url }: { source: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: C.sky, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}
      title={`Source: ${source}`}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
      </svg>
      {source}
    </a>
  )
}

function FactCard({ fact, index }: { fact: Fact; index: number }) {
  const style = CAT_STYLE[fact.category]
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: '1rem 1.1rem',
        animationDelay: `${index * 60}ms`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <span
          style={{
            background: style.bg,
            color: C.ochre,
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '2px 7px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
            marginTop: 2,
            flexShrink: 0,
          }}
        >
          {style.label}
        </span>
        <div>
          <p style={{ color: C.text, fontSize: '0.9rem', lineHeight: 1.65, margin: 0 }}>{fact.text}</p>
          <div style={{ marginTop: '0.5rem' }}>
            <SourceLink source={fact.source} url={fact.sourceUrl} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── NAV BAR ────────────────────────────────────────────────────────────────
function NavBar({
  screen,
  onNav,
  hasNation,
}: {
  screen: Screen
  onNav: (s: Screen) => void
  hasNation: boolean
}) {
  const items: { id: Screen; label: string; icon: React.ReactNode }[] = [
    {
      id: 'welcome',
      label: 'Home',
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
          <path d="M9 21V12h6v9" />
        </svg>
      ),
    },
    {
      id: hasNation ? 'acknowledge' : 'location',
      label: 'Acknowledge',
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ),
    },
    {
      id: 'guide',
      label: 'Guide',
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
    },
    {
      id: 'resources',
      label: 'Learn More',
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5V5a2.5 2.5 0 012.5-2.5H20v15H6.5A2.5 2.5 0 014 19.5z" />
        </svg>
      ),
    },
  ]

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: C.card,
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {items.map((item) => {
        const active = screen === item.id || (screen === 'location' && item.id === 'location')
        return (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            style={{
              flex: 1,
              padding: '10px 4px 6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              color: active ? C.ochre : C.muted,
              transition: 'color 0.15s',
            }}
          >
            {item.icon}
            <span style={{ fontSize: '0.65rem', fontWeight: active ? 700 : 400 }}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// ── WELCOME SCREEN ────────────────────────────────────────────────────────
function WelcomeScreen({ onStart, nation }: { onStart: () => void; nation: Nation | null }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        paddingBottom: '5rem',
      }}
    >
      {/* Flag-inspired stripe decoration */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '2rem' }}>
        <div style={{ width: 40, height: 6, borderRadius: 3, background: '#111' }} />
        <div style={{ width: 40, height: 6, borderRadius: 3, background: C.red }} />
        <div style={{ width: 40, height: 6, borderRadius: 3, background: C.ochre }} />
      </div>

      <h1
        style={{
          fontSize: 'clamp(1.8rem, 6vw, 2.6rem)',
          fontWeight: 800,
          color: C.text,
          margin: 0,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}
      >
        Acknowledge
        <br />
        <span style={{ color: C.ochre }}>Country</span>
      </h1>

      <p
        style={{
          marginTop: '1rem',
          color: C.muted,
          maxWidth: 380,
          lineHeight: 1.7,
          fontSize: '0.95rem',
        }}
      >
        A tool to help meeting hosts give a meaningful, informed Acknowledgement of Country — backed by verified, sourced facts about the Traditional Custodians of the land you're on.
      </p>

      {nation && (
        <div
          style={{
            marginTop: '1.5rem',
            padding: '0.9rem 1.2rem',
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            maxWidth: 380,
            width: '100%',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.8rem', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Last location</p>
          <p style={{ margin: '0.3rem 0 0', color: C.ochre, fontWeight: 600 }}>{nation.name} Country</p>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: C.muted }}>{nation.region}</p>
        </div>
      )}

      <button
        onClick={onStart}
        style={{
          marginTop: '2rem',
          padding: '0.9rem 2.5rem',
          background: C.ochre,
          color: '#1a0c04',
          border: 'none',
          borderRadius: 10,
          fontSize: '1rem',
          fontWeight: 700,
          cursor: 'pointer',
          width: '100%',
          maxWidth: 380,
        }}
      >
        {nation ? 'Update My Location' : 'Find My Country'}
      </button>

      <p
        style={{
          marginTop: '2.5rem',
          color: C.muted,
          fontSize: '0.78rem',
          maxWidth: 360,
          lineHeight: 1.6,
        }}
      >
        All facts include verified source links. This app draws on authoritative sources including AIATSIS, Reconciliation Australia, National Museum of Australia, and community-owned organisations.
      </p>

      <p style={{ color: C.muted, fontSize: '0.72rem', marginTop: '1rem' }}>v{__APP_VERSION__}</p>
    </div>
  )
}

// ── LOCATION SCREEN ────────────────────────────────────────────────────────
function LocationScreen({
  onNationFound,
}: {
  onNationFound: (nation: Nation, city: City | null) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<City[]>([])
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)

  const handleSearch = (q: string) => {
    setQuery(q)
    setResults(q.length >= 2 ? searchCities(q) : [])
  }

  const handleSelect = (city: City) => {
    const nation = findNationById(city.nationId)
    if (nation) onNationFound(nation, city)
  }

  const handleGPS = () => {
    setGpsLoading(true)
    setGpsError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const city = findNearestCity(pos.coords.latitude, pos.coords.longitude)
        if (city) {
          const nation = findNationById(city.nationId)
          if (nation) {
            setGpsLoading(false)
            onNationFound(nation, city)
            return
          }
        }
        setGpsLoading(false)
        setGpsError('Could not identify the country for your location. Please search manually.')
      },
      (err) => {
        setGpsLoading(false)
        setGpsError(
          err.code === 1
            ? 'Location access was denied. Please search for your city below.'
            : 'Could not get your location. Please search below.'
        )
      }
    )
  }

  const popular: City[] = [
    ...CITIES.filter((c) =>
      ['Sydney CBD', 'Melbourne CBD', 'Brisbane CBD', 'Perth CBD', 'Adelaide CBD', 'Canberra', 'Darwin CBD', 'Hobart'].includes(c.name)
    ),
  ]

  return (
    <div style={{ padding: '1.5rem', paddingBottom: '5rem', maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ color: C.text, fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.4rem' }}>
        Find Your Country
      </h2>
      <p style={{ color: C.muted, fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        Identify whose Country you are on to generate a meaningful, informed acknowledgement.
      </p>

      {/* GPS Button */}
      <button
        onClick={handleGPS}
        disabled={gpsLoading}
        style={{
          width: '100%',
          padding: '0.85rem',
          background: gpsLoading ? C.border : C.card,
          border: `1.5px solid ${C.border}`,
          borderRadius: 10,
          color: gpsLoading ? C.muted : C.text,
          fontSize: '0.95rem',
          fontWeight: 600,
          cursor: gpsLoading ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
        </svg>
        {gpsLoading ? 'Getting location…' : 'Use My Current Location'}
      </button>

      {gpsError && (
        <p style={{ color: '#e87070', fontSize: '0.82rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
          {gpsError}
        </p>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search for a city or suburb…"
          style={{
            width: '100%',
            padding: '0.85rem 1rem',
            background: C.card,
            border: `1.5px solid ${C.border}`,
            borderRadius: 10,
            color: C.text,
            fontSize: '0.95rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {results.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: C.card,
              border: `1px solid ${C.border}`,
              borderTop: 'none',
              borderRadius: '0 0 10px 10px',
              zIndex: 50,
              overflow: 'hidden',
            }}
          >
            {results.map((city) => {
              const nation = findNationById(city.nationId)
              return (
                <button
                  key={`${city.name}-${city.state}`}
                  onClick={() => handleSelect(city)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'none',
                    border: 'none',
                    borderBottom: `1px solid ${C.border}`,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: C.text,
                  }}
                >
                  <span>
                    <span style={{ fontWeight: 600 }}>{city.name}</span>
                    <span style={{ color: C.muted, fontSize: '0.82rem' }}>  {city.state}</span>
                  </span>
                  <span style={{ color: C.ochre, fontSize: '0.8rem' }}>
                    {nation?.name ?? city.nationId}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Popular cities */}
      <p style={{ color: C.muted, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
        Popular locations
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {popular.map((city) => {
          const nation = findNationById(city.nationId)
          return (
            <button
              key={city.name}
              onClick={() => handleSelect(city)}
              style={{
                padding: '0.75rem',
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 9,
                cursor: 'pointer',
                textAlign: 'left',
                color: C.text,
              }}
            >
              <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{city.name}</div>
              <div style={{ fontSize: '0.75rem', color: C.ochre, marginTop: 2 }}>{nation?.name}</div>
              {city.nativeName && (
                <div style={{ fontSize: '0.72rem', color: C.muted, marginTop: 1 }}>{city.nativeName}</div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── ACKNOWLEDGE SCREEN ────────────────────────────────────────────────────
function AcknowledgeScreen({
  nation,
  city,
}: {
  nation: Nation
  city: City | null
}) {
  const [format, setFormat] = useState<AcknowledgementFormat>('standard')
  const [tab, setTab] = useState<AcknowledgeTab>('text')
  const [copied, setCopied] = useState(false)
  const [facts] = useState<Fact[]>(() => [...pickFacts(nation, 6), ...pickGeneralFacts(2)])
  const [events] = useState<HistoricalEvent[]>(() => pickEvents())

  const ackText = nation.acknowledgementTemplates[format]

  const handleCopy = async () => {
    await navigator.clipboard.writeText(ackText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Acknowledgement of Country — ${nation.name}`,
        text: ackText,
        url: window.location.href,
      })
    } else {
      handleCopy()
    }
  }

  const tabs: { id: AcknowledgeTab; label: string }[] = [
    { id: 'text', label: 'Acknowledge' },
    { id: 'facts', label: 'Facts' },
    { id: 'history', label: 'History' },
    { id: 'language', label: 'Language' },
    { id: 'nativeTitle', label: 'Country & Title' },
  ]

  const nativeLandUrl = city?.nativeLandUrl ?? `https://native-land.ca/#maps/territories/${nation.nativeLandSlug ?? ''}`

  return (
    <div style={{ paddingBottom: '5rem', maxWidth: 700, margin: '0 auto' }}>
      {/* Nation header */}
      <div
        style={{
          padding: '1.5rem',
          background: `linear-gradient(160deg, ${C.card}, ${C.bg})`,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ display: 'flex', gap: 6, marginBottom: '0.75rem' }}>
          <span style={{ padding: '2px 8px', background: C.red + '33', color: C.redLight, borderRadius: 5, fontSize: '0.72rem', fontWeight: 700 }}>
            {nation.stateTerritory}
          </span>
          {city?.nativeName && (
            <span style={{ padding: '2px 8px', background: C.ochre + '22', color: C.ochre, borderRadius: 5, fontSize: '0.72rem', fontWeight: 700 }}>
              {city.nativeName}
            </span>
          )}
        </div>

        <h2 style={{ margin: 0, color: C.text, fontSize: '1.6rem', fontWeight: 800 }}>
          {nation.name}
        </h2>
        {nation.alternateNames && nation.alternateNames.length > 0 && (
          <p style={{ margin: '0.2rem 0 0', color: C.muted, fontSize: '0.8rem' }}>
            Also known as: {nation.alternateNames.join(' · ')}
          </p>
        )}
        <p style={{ margin: '0.75rem 0 0', color: C.muted, fontSize: '0.85rem', lineHeight: 1.6 }}>
          {nation.traditionalCountry}
        </p>

        {/* Map link */}
        <a
          href={nativeLandUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginTop: '0.75rem',
            color: C.sky,
            fontSize: '0.82rem',
            textDecoration: 'none',
          }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7M9 20l6-3M9 20V7M15 17l5.447 2.724A1 1 0 0021 18.764V7.382a1 1 0 00-.553-.894L15 4M15 17V4M9 7l6-3" />
          </svg>
          View territory map on Native Land Digital
        </a>
      </div>

      {/* Format selector */}
      <div style={{ padding: '1rem 1.5rem 0', display: 'flex', gap: '0.5rem' }}>
        {(['brief', 'standard', 'comprehensive'] as AcknowledgementFormat[]).map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            style={{
              flex: 1,
              padding: '0.55rem 0.25rem',
              background: format === f ? C.ochre : C.card,
              border: `1px solid ${format === f ? C.ochre : C.border}`,
              borderRadius: 8,
              color: format === f ? '#1a0c04' : C.muted,
              fontSize: '0.75rem',
              fontWeight: format === f ? 700 : 500,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: `1px solid ${C.border}`,
          padding: '0 1.5rem',
          marginTop: '1rem',
          gap: '0.25rem',
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '0.5rem 0.75rem',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${tab === t.id ? C.ochre : 'transparent'}`,
              color: tab === t.id ? C.ochre : C.muted,
              fontSize: '0.85rem',
              fontWeight: tab === t.id ? 700 : 400,
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '1.25rem 1.5rem' }}>
        {/* ACKNOWLEDGE TAB */}
        {tab === 'text' && (
          <div>
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderLeft: `4px solid ${C.ochre}`,
                borderRadius: 10,
                padding: '1.25rem',
                marginBottom: '1rem',
              }}
            >
              <p style={{ margin: 0, color: C.text, fontSize: '0.95rem', lineHeight: 1.8 }}>
                {ackText}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleCopy}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: copied ? '#1a3d1a' : C.card,
                  border: `1px solid ${copied ? '#2a6b2a' : C.border}`,
                  borderRadius: 9,
                  color: copied ? '#6acd6a' : C.text,
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  {copied ? (
                    <polyline points="20 6 9 17 4 12" />
                  ) : (
                    <>
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </>
                  )}
                </svg>
                {copied ? 'Copied!' : 'Copy text'}
              </button>
              <button
                onClick={handleShare}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 9,
                  color: C.text,
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Share
              </button>
            </div>

            {/* Format guide */}
            <div
              style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
              }}
            >
              <p style={{ margin: '0 0 0.5rem', color: C.muted, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Format guide
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(
                  [
                    ['brief', '~30 seconds', 'Quick formal opening for meetings and events'],
                    ['standard', '~1–2 minutes', 'Recommended for most meetings — context + respect'],
                    ['comprehensive', '3–5 minutes', 'Deep acknowledgement for significant occasions'],
                  ] as const
                ).map(([f, time, desc]) => (
                  <div
                    key={f}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      padding: '0.6rem 0.75rem',
                      background: format === f ? C.ochre + '15' : 'transparent',
                      borderRadius: 7,
                      border: `1px solid ${format === f ? C.ochre + '40' : 'transparent'}`,
                      cursor: 'pointer',
                    }}
                    onClick={() => setFormat(f)}
                  >
                    <span style={{ color: C.ochre, fontSize: '0.82rem', fontWeight: 700, minWidth: 90 }}>{f}</span>
                    <div>
                      <div style={{ color: C.text, fontSize: '0.82rem', fontWeight: 600 }}>{time}</div>
                      <div style={{ color: C.muted, fontSize: '0.78rem' }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FACTS TAB */}
        {tab === 'facts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <p style={{ color: C.muted, fontSize: '0.82rem', margin: '0 0 0.25rem', lineHeight: 1.6 }}>
              Key facts about <strong style={{ color: C.ochre }}>{nation.name}</strong> country and First Nations Australians — each with a verified source link.
            </p>
            {facts.map((f, i) => (
              <FactCard key={i} fact={f} index={i} />
            ))}

            <div
              style={{
                padding: '0.85rem',
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 9,
                marginTop: '0.5rem',
              }}
            >
              <p style={{ margin: 0, color: C.muted, fontSize: '0.8rem', lineHeight: 1.6 }}>
                Want more context? The <strong style={{ color: C.text }}>Guide</strong> tab has advice on how to give an acknowledgement, and the{' '}
                <strong style={{ color: C.text }}>Learn More</strong> tab has curated podcasts, videos, and websites.
              </p>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <div>
            <p style={{ color: C.muted, fontSize: '0.82rem', margin: '0 0 1.25rem', lineHeight: 1.6 }}>
              Key moments in the history of First Nations peoples and Australian law — each with a verified source.
            </p>
            <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 6,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: `linear-gradient(to bottom, ${C.ochre}, ${C.red}, ${C.border})`,
                  borderRadius: 2,
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {events.map((ev, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: -17,
                        top: 4,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background:
                          ev.category === 'reconciliation'
                            ? '#2a6b2a'
                            : ev.category === 'resistance'
                            ? C.red
                            : ev.category === 'legislation'
                            ? '#1a3d6b'
                            : C.ochre,
                        border: `2px solid ${C.bg}`,
                      }}
                    />
                    <div
                      style={{
                        background: C.card,
                        border: `1px solid ${C.border}`,
                        borderRadius: 9,
                        padding: '0.9rem 1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <span style={{ color: C.ochre, fontWeight: 800, fontSize: '0.9rem' }}>
                          {ev.year}
                          {ev.yearEnd ? `–${ev.yearEnd}` : ''}
                        </span>
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: 4,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            background:
                              ev.category === 'reconciliation'
                                ? '#1a3d1a'
                                : ev.category === 'resistance'
                                ? '#3d1a1a'
                                : ev.category === 'legislation'
                                ? '#1a253d'
                                : '#2a2215',
                            color:
                              ev.category === 'reconciliation'
                                ? '#6acd6a'
                                : ev.category === 'resistance'
                                ? '#e87070'
                                : ev.category === 'legislation'
                                ? '#70a8e8'
                                : C.ochre,
                          }}
                        >
                          {ev.category}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 0.4rem', color: C.text, fontWeight: 600, fontSize: '0.88rem' }}>
                        {ev.title}
                      </p>
                      <p style={{ margin: 0, color: C.muted, fontSize: '0.82rem', lineHeight: 1.65 }}>
                        {ev.description}
                      </p>
                      <div style={{ marginTop: '0.5rem' }}>
                        <SourceLink source={ev.source} url={ev.sourceUrl} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LANGUAGE TAB */}
        {tab === 'language' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderLeft: `4px solid #1a6b1a`,
                borderRadius: 10,
                padding: '1.1rem 1.25rem',
              }}
            >
              <p style={{ margin: '0 0 0.25rem', color: C.muted, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Language
              </p>
              <p style={{ margin: 0, color: C.text, fontWeight: 700, fontSize: '1.1rem' }}>
                {nation.language.name}
              </p>
              {nation.language.family && (
                <p style={{ margin: '0.2rem 0 0', color: C.muted, fontSize: '0.82rem' }}>
                  Language family: {nation.language.family}
                </p>
              )}
              {nation.language.speakerCount && (
                <p style={{ margin: '0.4rem 0 0', color: C.text, fontSize: '0.88rem' }}>
                  Speakers: {nation.language.speakerCount}
                </p>
              )}
            </div>

            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '1rem 1.25rem',
              }}
            >
              <p style={{ margin: '0 0 0.3rem', color: C.ochre, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Language status
              </p>
              {['active', 'revitalizing', 'endangered', 'dormant', 'reconstructed'].map((s) => {
                const active = s === nation.language.status
                const labels: Record<string, { label: string; desc: string; color: string }> = {
                  active: { label: 'Active', desc: 'Spoken as a first language by community members', color: '#2a6b2a' },
                  revitalizing: { label: 'Revitalizing', desc: 'Community-led programs actively teaching and growing the language', color: '#6b5a2a' },
                  endangered: { label: 'Endangered', desc: 'Few or no first-language speakers; urgent documentation needed', color: '#6b2a2a' },
                  dormant: { label: 'Dormant', desc: 'No current speakers but documentation exists', color: '#3a3a3a' },
                  reconstructed: { label: 'Reconstructed', desc: 'Rebuilt from historical records by community', color: '#2a3d6b' },
                }
                const lbl = labels[s]
                if (!active) return null
                return (
                  <div
                    key={s}
                    style={{
                      padding: '0.7rem',
                      borderRadius: 8,
                      background: lbl.color + '22',
                      border: `1px solid ${lbl.color}55`,
                    }}
                  >
                    <div style={{ color: C.text, fontWeight: 600, fontSize: '0.9rem' }}>{lbl.label}</div>
                    <div style={{ color: C.muted, fontSize: '0.82rem', marginTop: 3 }}>{lbl.desc}</div>
                  </div>
                )
              })}
            </div>

            {nation.language.revitalizationNotes && (
              <div
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: '1rem 1.25rem',
                }}
              >
                <p style={{ margin: '0 0 0.4rem', color: C.muted, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Revitalization efforts
                </p>
                <p style={{ margin: 0, color: C.text, fontSize: '0.88rem', lineHeight: 1.65 }}>
                  {nation.language.revitalizationNotes}
                </p>
                {nation.language.revitalizationUrl && (
                  <div style={{ marginTop: '0.6rem' }}>
                    <SourceLink source="Learn more" url={nation.language.revitalizationUrl} />
                  </div>
                )}
              </div>
            )}

            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '1rem 1.25rem',
              }}
            >
              <p style={{ margin: '0 0 0.6rem', color: C.ochre, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Language diversity in Australia
              </p>
              <p style={{ margin: 0, color: C.muted, fontSize: '0.85rem', lineHeight: 1.7 }}>
                Before colonisation, over <strong style={{ color: C.text }}>250 distinct language groups</strong> existed across Australia — more linguistic diversity than all of Europe. Today, about 120 are still spoken, but only approximately 13 are being transmitted to children as first languages. Massive community-led efforts are underway.
              </p>
              <div style={{ marginTop: '0.6rem' }}>
                <SourceLink source="First Languages Australia" url="https://www.firstlanguages.org.au" />
              </div>
            </div>

            {nation.nativePlaceName && (
              <div
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: '1rem 1.25rem',
                }}
              >
                <p style={{ margin: '0 0 0.3rem', color: C.muted, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Place name in {nation.language.name}
                </p>
                <p style={{ margin: 0, color: C.ochre, fontWeight: 700, fontSize: '1.3rem' }}>
                  {nation.nativePlaceName.name}
                </p>
                <p style={{ margin: '0.25rem 0 0', color: C.muted, fontSize: '0.85rem' }}>
                  {nation.nativePlaceName.englishName}
                </p>
              </div>
            )}

            {nation.commonWords && nation.commonWords.length > 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '1rem 1.25rem' }}>
                <p style={{ margin: '0 0 0.75rem', color: C.ochre, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Common words in {nation.language.name}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {nation.commonWords.map((w, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 120 }}>
                        <span style={{ color: C.ochre, fontWeight: 700, fontSize: '0.95rem' }}>{w.word}</span>
                        {w.pronunciation && <div style={{ color: C.muted, fontSize: '0.7rem', fontStyle: 'italic' }}>{w.pronunciation}</div>}
                      </div>
                      <div>
                        <span style={{ color: C.text, fontSize: '0.85rem' }}>{w.meaning}</span>
                        {w.notes && <div style={{ color: C.muted, fontSize: '0.78rem', marginTop: 2 }}>{w.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* COUNTRY & TITLE TAB */}
        {tab === 'nativeTitle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {nation.nativeTitle ? (
              <>
                {/* Status badge */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '1rem 1.25rem' }}>
                  <p style={{ margin: '0 0 0.5rem', color: C.muted, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Native Title Status</p>
                  {(() => {
                    const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
                      determined: { label: 'Determined', color: '#6acd6a', bg: '#1a3d1a' },
                      consent_determined: { label: 'Consent Determination', color: '#6acd6a', bg: '#1a3d1a' },
                      pending: { label: 'Claim Pending', color: '#e8c76a', bg: '#3d2d00' },
                      extinguished: { label: 'Extinguished in urban area', color: '#e87070', bg: '#3d1a1a' },
                      under_freehold: { label: 'Held as Aboriginal Freehold', color: '#70a8e8', bg: '#1a253d' },
                      partial: { label: 'Partial Determination', color: '#e8c76a', bg: '#3d2d00' },
                    }
                    const cfg = statusConfig[nation.nativeTitle!.status] ?? { label: nation.nativeTitle!.status, color: C.ochre, bg: C.card }
                    return (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.85rem', background: cfg.bg, borderRadius: 8, border: `1px solid ${cfg.color}44` }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />
                        <span style={{ color: cfg.color, fontWeight: 700, fontSize: '0.9rem' }}>{cfg.label}</span>
                      </div>
                    )
                  })()}
                  {nation.nativeTitle.determinationDate && (
                    <p style={{ margin: '0.6rem 0 0', color: C.muted, fontSize: '0.82rem' }}>
                      Determination / handback: <span style={{ color: C.text }}>{nation.nativeTitle.determinationDate}</span>
                    </p>
                  )}
                </div>

                {/* Body */}
                {nation.nativeTitle.body && (
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '1rem 1.25rem' }}>
                    <p style={{ margin: '0 0 0.25rem', color: C.muted, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Representative Body</p>
                    <p style={{ margin: 0, color: C.text, fontWeight: 600, fontSize: '0.9rem' }}>{nation.nativeTitle.body}</p>
                    {nation.nativeTitle.bodyUrl && (
                      <div style={{ marginTop: '0.4rem' }}>
                        <SourceLink source="Official website" url={nation.nativeTitle.bodyUrl} />
                      </div>
                    )}
                  </div>
                )}

                {/* Area description */}
                {nation.nativeTitle.areaDescription && (
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '1rem 1.25rem' }}>
                    <p style={{ margin: '0 0 0.3rem', color: C.muted, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Area</p>
                    <p style={{ margin: 0, color: C.text, fontSize: '0.88rem', lineHeight: 1.65 }}>{nation.nativeTitle.areaDescription}</p>
                  </div>
                )}

                {/* Notes / narrative */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.ochre}`, borderRadius: 10, padding: '1rem 1.25rem' }}>
                  <p style={{ margin: '0 0 0.5rem', color: C.ochre, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Background & significance</p>
                  <p style={{ margin: 0, color: C.text, fontSize: '0.88rem', lineHeight: 1.7 }}>{nation.nativeTitle.notes}</p>
                  <div style={{ marginTop: '0.75rem' }}>
                    <SourceLink source={nation.nativeTitle.source} url={nation.nativeTitle.sourceUrl} />
                  </div>
                </div>
              </>
            ) : (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '1rem 1.25rem' }}>
                <p style={{ margin: '0 0 0.4rem', color: C.muted, fontSize: '0.82rem', lineHeight: 1.65 }}>
                  Native title information for <strong style={{ color: C.text }}>{nation.name}</strong> country is being compiled. Check the NNTT register for current claim status.
                </p>
                <SourceLink source="National Native Title Tribunal" url="https://www.nntt.gov.au/" />
              </div>
            )}

            {/* What is native title explainer */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '1rem 1.25rem' }}>
              <p style={{ margin: '0 0 0.5rem', color: C.muted, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>What is native title?</p>
              <p style={{ margin: 0, color: C.muted, fontSize: '0.83rem', lineHeight: 1.7 }}>
                Native title is the recognition in Australian law that Aboriginal and Torres Strait Islander peoples have rights to their traditional lands and waters. It was established by the <em>Mabo v Queensland (No 2)</em> High Court decision in 1992, which overturned the colonial fiction of <em>terra nullius</em> — the claim that Australia was legally unoccupied before British colonisation. The <em>Native Title Act 1993</em> created a legal process for determining these rights. Native title can be extinguished by prior grants of freehold land, leases, and other government acts — which is why many urban areas have no surviving native title, even though Aboriginal people's sovereign connection to country is unbroken.
              </p>
              <div style={{ marginTop: '0.6rem' }}>
                <SourceLink source="National Native Title Tribunal" url="https://www.nntt.gov.au/" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── GUIDE SCREEN ──────────────────────────────────────────────────────────
function GuideScreen() {
  const [expanded, setExpanded] = useState<number | null>(0)

  const sections = [
    {
      title: 'What is an Acknowledgement of Country?',
      content: `An Acknowledgement of Country is a statement recognising the Traditional Custodians of the land on which a meeting, event, or activity takes place. It acknowledges the ongoing connection of Aboriginal and Torres Strait Islander peoples to their Country — land, water, sky, and all living things.

Anyone can give an Acknowledgement of Country. It is a sign of respect that is appropriate in any setting, from corporate meetings to community events and school assemblies.

An Acknowledgement of Country differs from a Welcome to Country: a Welcome to Country is a formal ceremony conducted only by a Traditional Custodian or an Elder of the Country on which you are gathering. A Welcome to Country must be given or explicitly authorised by the Traditional Custodians themselves.`,
    },
    {
      title: 'How to give an Acknowledgement',
      content: `A meaningful Acknowledgement of Country should:

• Mention the specific nation or peoples whose Country you are on — not just "the Aboriginal peoples of this area." Use this app to identify the specific nation.

• Acknowledge Elders "past, present and emerging" — this respects the knowledge passed down and recognises future leadership.

• Speak in first person and with sincerity — it is not a recitation; it is an expression of genuine respect.

• Be delivered with pause and tone that communicates respect — not rushed through as a formality.

• Ideally include one piece of meaningful information about the country or peoples you are acknowledging — this elevates it from a formula to an act of genuine recognition.

You can use the templates in this app as a starting point, then personalise them with your own voice.`,
    },
    {
      title: 'Welcome to Country vs Acknowledgement',
      content: `Welcome to Country: A formal ceremony performed only by a Traditional Custodian (Elder or knowledge-holder) of the specific Country where the event is held. It may include song, dance, smoking ceremony, or spoken Welcome. You must invite and compensate the Elder or Custodian for their time. Not every event requires a Welcome to Country.

Acknowledgement of Country: A statement of respect that anyone can give — non-Aboriginal Australians, overseas visitors, or Aboriginal people from other Countries. It recognises the Traditional Custodians without claiming to speak for them. An Acknowledgement is appropriate at the start of meetings, events, performances, classes, and occasions of all kinds.

Both express respect. Only Traditional Custodians can give a Welcome to Country.`,
    },
    {
      title: 'Common questions',
      content: `Do I have to say it the same way every time?
No. Use the templates as a starting point and adapt them in your own voice. The most powerful acknowledgements are sincere and specific.

What if I'm not sure which nation I'm on?
Use this app! Identifying the specific nation — rather than giving a generic acknowledgement — is a mark of respect. If you genuinely cannot find out, acknowledge that you are on Aboriginal Country and name the state or region.

Can I give an Acknowledgement if I'm overseas?
If you are on the Country of non-Australian Indigenous peoples, consider whether an Acknowledgement of their Country is appropriate. The practice is not universal — in some contexts, a respectful mention of local Indigenous peoples without a formal acknowledgement may be more appropriate.

Should there be a moment of silence?
Some people observe a brief pause or moment of reflection after the Acknowledgement — this is a matter of personal practice and context.

Is it tokenistic?
An Acknowledgement is only tokenistic if it is not backed by genuine respect, knowledge, or action. Use this app to ensure your acknowledgement is informed, specific, and meaningful. Pair words with action — support Aboriginal-led organisations, learn more, and advocate for First Nations rights.`,
    },
    {
      title: 'Making it meaningful',
      content: `The most powerful Acknowledgements go beyond a formula. Consider including:

• A specific place name in the Traditional language (e.g., "We gather on Naarm — Melbourne in the Wurundjeri language")
• A fact about the nation's history, culture, or ongoing contribution
• A reference to their language: whether it is being spoken, revitalized, or was nearly lost
• The length of their occupation: "for at least 65,000 years" grounds the acknowledgement in historical reality
• Something contemporary: ongoing cultural practices, land rights, or current community-led work

After your Acknowledgement, invite others to reflect — even 30 seconds of silence can transform a formula into a genuine act of respect.`,
    },
    {
      title: 'Cultural protocols',
      content: `Respecting cultural protocols is important when engaging with Aboriginal and Torres Strait Islander peoples and cultures:

• Always identify and refer to specific nations — "Aboriginal people" is not a monolith. There are over 500 distinct nations.
• Never use sacred images, songs, or designs without permission from the relevant community.
• Be aware of "men's business" and "women's business" — some knowledge and ceremony is restricted.
• When photographing, recording, or publishing about Aboriginal culture, obtain explicit consent.
• Aboriginal and Torres Strait Islander peoples' cultural and intellectual property (ICIP) belongs to the communities, not the public domain.
• Sourced information: always cite where facts come from. This app models this practice — every fact has a source link.`,
    },
  ]

  return (
    <div style={{ padding: '1.5rem', paddingBottom: '5rem', maxWidth: 700, margin: '0 auto' }}>
      <h2 style={{ color: C.text, fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.4rem' }}>
        Guide to Acknowledgement of Country
      </h2>
      <p style={{ color: C.muted, fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        How to give a sincere, informed, and meaningful Acknowledgement of Country.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {sections.map((s, i) => (
          <div
            key={i}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              style={{
                width: '100%',
                padding: '1rem 1.1rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: expanded === i ? C.ochre : C.text,
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              {s.title}
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                style={{ transform: expanded === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {expanded === i && (
              <div
                style={{
                  padding: '0 1.1rem 1.1rem',
                  color: C.muted,
                  fontSize: '0.88rem',
                  lineHeight: 1.75,
                  borderTop: `1px solid ${C.border}`,
                  paddingTop: '0.9rem',
                  whiteSpace: 'pre-line',
                }}
              >
                {s.content}
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: '1.5rem',
          padding: '1rem 1.2rem',
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
        }}
      >
        <p style={{ margin: '0 0 0.4rem', color: C.ochre, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Authoritative guidance
        </p>
        <p style={{ margin: 0, color: C.muted, fontSize: '0.85rem', lineHeight: 1.65 }}>
          Reconciliation Australia is the national authority on Acknowledgement of Country protocols. Their resources are the definitive guide for organisations and individuals.
        </p>
        <a
          href="https://www.reconciliation.org.au/reconciliation/acknowledgement-of-country-and-welcome-to-country/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-block', marginTop: '0.6rem', color: C.sky, fontSize: '0.82rem' }}
        >
          Reconciliation Australia — Acknowledgement protocols →
        </a>
      </div>
    </div>
  )
}

// ── RESOURCES SCREEN ──────────────────────────────────────────────────────
function ResourcesScreen() {
  const [filter, setFilter] = useState<'all' | 'podcast' | 'youtube' | 'website'>('all')

  const filtered = filter === 'all' ? RESOURCES : RESOURCES.filter((r) => r.type === filter)

  const typeIcon: Record<Resource['type'], React.ReactNode> = {
    podcast: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
      </svg>
    ),
    youtube: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" />
      </svg>
    ),
    website: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
  }

  const typeColor: Record<Resource['type'], string> = {
    podcast: '#8b3a1a',
    youtube: '#8b1a1a',
    website: '#1a3d6b',
  }

  const typeLabel: Record<Resource['type'], string> = {
    podcast: 'Podcast',
    youtube: 'Video',
    website: 'Website',
  }

  return (
    <div style={{ padding: '1.5rem', paddingBottom: '5rem', maxWidth: 700, margin: '0 auto' }}>
      <h2 style={{ color: C.text, fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.4rem' }}>
        Learn More
      </h2>
      <p style={{ color: C.muted, fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
        Curated podcasts, videos, and websites for deeper learning about First Nations cultures, histories, and peoples.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {(['all', 'podcast', 'youtube', 'website'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.45rem 0.9rem',
              background: filter === f ? C.ochre : C.card,
              border: `1px solid ${filter === f ? C.ochre : C.border}`,
              borderRadius: 20,
              color: filter === f ? '#1a0c04' : C.muted,
              fontSize: '0.8rem',
              fontWeight: filter === f ? 700 : 400,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f === 'all' ? 'All' : f === 'youtube' ? 'Video' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.map((r) => (
          <a
            key={r.id}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '1rem 1.1rem',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = C.borderLight)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = C.border)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '2px 7px',
                        background: typeColor[r.type] + '33',
                        color:
                          r.type === 'podcast' ? '#e88a6a' : r.type === 'youtube' ? '#e87070' : '#70a8e8',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        borderRadius: 4,
                      }}
                    >
                      {typeIcon[r.type]}
                      {typeLabel[r.type]}
                    </span>
                  </div>
                  <div style={{ color: C.text, fontWeight: 600, fontSize: '0.9rem' }}>{r.title}</div>
                  {r.creator && (
                    <div style={{ color: C.ochre, fontSize: '0.78rem', marginTop: '0.2rem' }}>{r.creator}</div>
                  )}
                  <p style={{ margin: '0.4rem 0 0', color: C.muted, fontSize: '0.82rem', lineHeight: 1.6 }}>
                    {r.description}
                  </p>
                </div>
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  stroke={C.muted}
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  style={{ flexShrink: 0, marginTop: 2 }}
                >
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </div>
              {r.tags && (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                  {r.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '1px 7px',
                        background: C.border,
                        color: C.muted,
                        borderRadius: 4,
                        fontSize: '0.68rem',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

// ── MAIN APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [nation, setNation] = useState<Nation | null>(null)
  const [city, setCity] = useState<City | null>(null)

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  useEffect(() => {
    try {
      const stored = localStorage.getItem('country-ack-nation')
      if (stored) {
        const n = findNationById(stored)
        if (n) setNation(n)
      }
    } catch (_) {}
  }, [])

  const handleNationFound = useCallback((n: Nation, c: City | null) => {
    setNation(n)
    setCity(c)
    try { localStorage.setItem('country-ack-nation', n.id) } catch (_) {}
    setScreen('acknowledge')
  }, [])

  const handleNav = (s: Screen) => {
    if (s === 'acknowledge' && !nation) {
      setScreen('location')
    } else {
      setScreen(s)
    }
  }

  return (
    <div
      style={{
        background: C.bg,
        minHeight: '100vh',
        color: C.text,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {needRefresh && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, background: C.ochre, color: '#1a0c04', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
          <span>Update available</span>
          <button onClick={() => updateServiceWorker(true)} style={{ background: '#1a0c04', color: C.ochre, border: 'none', borderRadius: 6, padding: '0.3rem 0.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>Refresh</button>
        </div>
      )}
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {screen === 'welcome' && (
          <WelcomeScreen onStart={() => setScreen('location')} nation={nation} />
        )}
        {screen === 'location' && <LocationScreen onNationFound={handleNationFound} />}
        {screen === 'acknowledge' && nation && (
          <AcknowledgeScreen nation={nation} city={city} />
        )}
        {screen === 'guide' && <GuideScreen />}
        {screen === 'resources' && <ResourcesScreen />}
      </div>

      <NavBar screen={screen} onNav={handleNav} hasNation={!!nation} />
    </div>
  )
}
