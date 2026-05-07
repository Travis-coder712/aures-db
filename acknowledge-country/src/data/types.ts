export type FactCategory =
  | 'history'
  | 'culture'
  | 'language'
  | 'land'
  | 'people'
  | 'contemporary'
  | 'sovereignty'
  | 'spirituality'

export interface Fact {
  text: string
  category: FactCategory
  source: string
  sourceUrl: string
}

export interface Language {
  name: string
  family?: string
  status: 'active' | 'revitalizing' | 'endangered' | 'dormant' | 'reconstructed'
  speakerCount?: string
  revitalizationNotes?: string
  revitalizationUrl?: string
}

export interface AcknowledgementTemplates {
  brief: string
  standard: string
  comprehensive: string
}

export interface Nation {
  id: string
  name: string
  alternateNames?: string[]
  nativeLandSlug?: string
  region: string
  stateTerritory: string
  traditionalCountry: string
  nativePlaceName?: { name: string; englishName: string }
  coordinates: { lat: number; lng: number }
  language: Language
  facts: Fact[]
  acknowledgementTemplates: AcknowledgementTemplates
  websiteUrl?: string
  commonWords?: CommonWord[]
  nativeTitle?: NativeTitleInfo
}

export interface City {
  name: string
  state: string
  lat: number
  lng: number
  nationId: string
  nativeName?: string
  nativeLandUrl?: string
}

export interface HistoricalEvent {
  year: number
  yearEnd?: number
  title: string
  description: string
  significance: string
  source: string
  sourceUrl: string
  category: 'legislation' | 'milestone' | 'resistance' | 'reconciliation' | 'culture'
}

export interface Resource {
  id: string
  type: 'podcast' | 'youtube' | 'website'
  title: string
  creator?: string
  description: string
  url: string
  tags?: string[]
}

export interface CommonWord {
  word: string
  pronunciation?: string  // phonetic guide
  meaning: string
  notes?: string  // e.g. cultural context
}

export interface NativeTitleInfo {
  status: 'determined' | 'consent_determined' | 'pending' | 'extinguished' | 'under_freehold' | 'partial'
  determinationDate?: string
  body?: string  // the Aboriginal Corporation or body that holds/represents
  bodyUrl?: string
  areaDescription?: string  // what land is covered
  wasContested?: boolean
  notes: string  // significance, history, what it means, difficulty, opposition
  source: string
  sourceUrl: string
}

export type Screen = 'welcome' | 'location' | 'acknowledge' | 'guide' | 'resources'
export type AcknowledgementFormat = 'brief' | 'standard' | 'comprehensive'
export type AcknowledgeTab = 'text' | 'facts' | 'history' | 'language' | 'nativeTitle'
