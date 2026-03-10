import { useState, useEffect, useMemo } from 'react'
import { fetchLeagueTableIndex, fetchLeagueTable } from '../lib/dataService'
import type { LeagueTable, LeagueTableIndex, LeagueTechnology, State } from '../lib/types'

export function useLeagueTableIndex() {
  const [index, setIndex] = useState<LeagueTableIndex | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeagueTableIndex()
      .then((data) => setIndex(data))
      .finally(() => setLoading(false))
  }, [])

  return { index, loading }
}

export function useLeagueTable(tech: LeagueTechnology, year: number) {
  const [table, setTable] = useState<LeagueTable | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchLeagueTable(tech, year)
      .then((data) => setTable(data))
      .finally(() => setLoading(false))
  }, [tech, year])

  return { table, loading }
}

export function useFilteredLeagueTable(
  table: LeagueTable | null,
  stateFilter: State | 'ALL',
) {
  const filtered = useMemo(() => {
    if (!table) return null
    if (stateFilter === 'ALL') return table

    return {
      ...table,
      projects: table.projects.filter((p) => p.state === stateFilter),
    }
  }, [table, stateFilter])

  return filtered
}
