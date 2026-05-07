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

export type Screen = 'welcome' | 'location' | 'acknowledge' | 'guide' | 'resources'
export type AcknowledgementFormat = 'brief' | 'standard' | 'comprehensive'
export type AcknowledgeTab = 'text' | 'facts' | 'history' | 'language'
