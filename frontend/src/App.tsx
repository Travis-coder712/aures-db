import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import ProjectList from './pages/ProjectList'
import ProjectDetail from './pages/ProjectDetail'
import Search from './pages/Search'
import Guides from './pages/Guides'
import GuideReader from './pages/GuideReader'
import ConstraintsModule from './pages/learn/ConstraintsModule'
import CISLTESAModule from './pages/learn/CISLTESAModule'
import NSWRezTransmissionModule from './pages/learn/NSWRezTransmissionModule'
import BESSStoryModule from './pages/learn/BESSStoryModule'
import EnergyTransitionModule from './pages/learn/EnergyTransitionModule'
import PlanningApprovalsModule from './pages/learn/PlanningApprovalsModule'
import AemoConnectionsModule from './pages/learn/AemoConnectionsModule'
import PpasModule from './pages/learn/PpasModule'
import ProjectFinancingModule from './pages/learn/ProjectFinancingModule'
import SummingItUpModule from './pages/learn/SummingItUpModule'
import ValuingProjectsModule from './pages/learn/ValuingProjectsModule'
import LearnHub from './pages/learn/LearnHub'
import ModuleStub from './pages/learn/ModuleStub'
// SchemesOverview merged into SchemeTracker intelligence page
import SchemeRoundDetail from './pages/SchemeRoundDetail'
import Dashboard from './pages/Dashboard'
import REZList from './pages/REZList'
import REZDetail from './pages/REZDetail'
import Performance from './pages/Performance'
import DeveloperList from './pages/DeveloperList'
import DeveloperDetail from './pages/DeveloperDetail'
import OEMList from './pages/OEMList'
import OEMDetail from './pages/OEMDetail'
import ContractorList from './pages/ContractorList'
import ContractorDetail from './pages/ContractorDetail'
import OfftakerList from './pages/OfftakerList'
import OfftakerDetail from './pages/OfftakerDetail'
import MapView from './pages/MapView'
import DataSources from './pages/DataSources'
import BESSCapex from './pages/BESSCapex'
import ProjectTimeline from './pages/ProjectTimeline'
import IntelligenceHub from './pages/IntelligenceHub'
import SchemeTracker from './pages/intelligence/SchemeTracker'
import DriftAnalysis from './pages/intelligence/DriftAnalysis'
import WindResource from './pages/intelligence/WindResource'
import SolarResource from './pages/intelligence/SolarResource'
import Dunkelflaute from './pages/intelligence/Dunkelflaute'
import EnergyMix from './pages/intelligence/EnergyMix'
import DeveloperScores from './pages/intelligence/DeveloperScores'
import RevenueIntel from './pages/intelligence/RevenueIntel'
import TransmissionInfra from './pages/intelligence/TransmissionInfra'
import MansfieldPipeline from './pages/intelligence/MansfieldPipeline'
import EISTechnical from './pages/intelligence/EISTechnical'
import NemActivities from './pages/intelligence/NemActivities'
import BessBidding from './pages/intelligence/BessBidding'
import BessPortfolio from './pages/intelligence/BessPortfolio'
import BessRecords from './pages/intelligence/BessRecords'
import AssetLifecycle from './pages/intelligence/AssetLifecycle'
import BatteryWatch from './components/intelligence/BatteryWatch'
import BatteryMarket from './pages/intelligence/BatteryMarket'
import ResearchNotes from './pages/intelligence/ResearchNotes'
import QldBatteryBriefing from './pages/intelligence/QldBatteryBriefing'
import News from './pages/News'
import Watchlist from './pages/Watchlist'
import NotFound from './pages/NotFound'

const LifecycleQuartile = lazy(() => import('./pages/intelligence/LifecycleQuartile'))
const RiskSignals = lazy(() => import('./pages/intelligence/RiskSignals'))

function LazyFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  )
}

function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="search" element={<Search />} />
        <Route path="guides" element={<Guides />} />
        <Route path="guides/:id" element={<GuideReader />} />
        <Route path="learn" element={<LearnHub />} />
        <Route path="learn/constraints" element={<ConstraintsModule />} />
        <Route path="learn/constraints/:lessonId" element={<ConstraintsModule />} />
        <Route path="learn/cis-ltesa-bidding" element={<CISLTESAModule />} />
        <Route path="learn/cis-ltesa-bidding/:lessonId" element={<CISLTESAModule />} />
        <Route path="learn/nsw-rez" element={<NSWRezTransmissionModule />} />
        <Route path="learn/nsw-rez/:lessonId" element={<NSWRezTransmissionModule />} />
        <Route path="learn/bess-story" element={<BESSStoryModule />} />
        <Route path="learn/bess-story/:lessonId" element={<BESSStoryModule />} />
        <Route path="learn/energy-transition" element={<EnergyTransitionModule />} />
        <Route path="learn/energy-transition/:lessonId" element={<EnergyTransitionModule />} />
        <Route path="learn/planning-approvals" element={<PlanningApprovalsModule />} />
        <Route path="learn/planning-approvals/:lessonId" element={<PlanningApprovalsModule />} />
        <Route path="learn/aemo-connections" element={<AemoConnectionsModule />} />
        <Route path="learn/aemo-connections/:lessonId" element={<AemoConnectionsModule />} />
        <Route path="learn/ppas" element={<PpasModule />} />
        <Route path="learn/ppas/:lessonId" element={<PpasModule />} />
        <Route path="learn/project-financing" element={<ProjectFinancingModule />} />
        <Route path="learn/project-financing/:lessonId" element={<ProjectFinancingModule />} />
        <Route path="learn/summing-it-up" element={<SummingItUpModule />} />
        <Route path="learn/summing-it-up/:lessonId" element={<SummingItUpModule />} />
        <Route path="learn/valuing-projects" element={<ValuingProjectsModule />} />
        <Route path="learn/valuing-projects/:lessonId" element={<ValuingProjectsModule />} />
        <Route path="learn/:moduleId" element={<ModuleStub />} />
        {/* Redirect old /schemes to intelligence page */}
        <Route path="schemes" element={<Navigate to="/intelligence/scheme-tracker" replace />} />
        <Route path="schemes/:scheme/:roundId" element={<SchemeRoundDetail />} />
        {/* Phase 2.5: Dashboard + REZ */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="rez" element={<REZList />} />
        <Route path="rez/:id" element={<REZDetail />} />
        {/* Phase 3: Performance */}
        <Route path="performance" element={<Performance />} />
        {/* Phase 4: Developers */}
        <Route path="developers" element={<DeveloperList />} />
        <Route path="developers/:slug" element={<DeveloperDetail />} />
        {/* Phase 5: OEMs + Contractors */}
        <Route path="oems" element={<OEMList />} />
        <Route path="oems/:slug" element={<OEMDetail />} />
        <Route path="contractors" element={<ContractorList />} />
        <Route path="contractors/:slug" element={<ContractorDetail />} />
        {/* Phase 5: Offtakers */}
        <Route path="offtakers" element={<OfftakerList />} />
        <Route path="offtakers/:slug" element={<OfftakerDetail />} />
        {/* Phase 4: Map */}
        <Route path="map" element={<MapView />} />
        {/* Analytics → Intelligence redirects (old bookmarks) */}
        <Route path="analytics/bess-capex" element={<Navigate to="/intelligence/bess-capex" replace />} />
        <Route path="analytics/project-timeline" element={<Navigate to="/intelligence/project-timeline" replace />} />
        {/* Intelligence Layer */}
        <Route path="intelligence" element={<IntelligenceHub />} />
        <Route path="intelligence/bess-capex" element={<BESSCapex />} />
        <Route path="intelligence/project-timeline" element={<ProjectTimeline />} />
        <Route path="intelligence/scheme-tracker" element={<SchemeTracker />} />
        <Route path="intelligence/drift-analysis" element={<DriftAnalysis />} />
        <Route path="intelligence/wind-resource" element={<WindResource />} />
        <Route path="intelligence/solar-resource" element={<SolarResource />} />
        <Route path="intelligence/dunkelflaute" element={<Dunkelflaute />} />
        <Route path="intelligence/energy-mix" element={<EnergyMix />} />
        <Route path="intelligence/developer-scores" element={<DeveloperScores />} />
        <Route path="intelligence/revenue" element={<RevenueIntel />} />
        <Route path="intelligence/transmission-infra" element={<TransmissionInfra />} />
        <Route path="intelligence/mansfield-pipeline" element={<MansfieldPipeline />} />
        <Route path="intelligence/grid-connection" element={<Navigate to="/intelligence/transmission-infra" replace />} />
        <Route path="intelligence/eis-technical" element={<EISTechnical />} />
        <Route path="intelligence/nem-activities" element={<NemActivities />} />
        <Route path="intelligence/bess-bidding" element={<BessBidding />} />
        <Route path="intelligence/bess-portfolio" element={<BessPortfolio />} />
        <Route path="intelligence/bess-records" element={<BessRecords />} />
        <Route path="intelligence/asset-lifecycle" element={<AssetLifecycle />} />
        <Route path="intelligence/battery-watch" element={<div className="p-6 lg:p-8 max-w-5xl"><BatteryWatch /></div>} />
        <Route path="intelligence/battery-market" element={<BatteryMarket />} />
        <Route path="intelligence/research" element={<ResearchNotes />} />
        <Route path="intelligence/qld-battery-briefing" element={<QldBatteryBriefing />} />
        <Route
          path="intelligence/lifecycle-quartile"
          element={
            <Suspense fallback={<LazyFallback />}>
              <LifecycleQuartile />
            </Suspense>
          }
        />
        <Route
          path="intelligence/risk-signals"
          element={
            <Suspense fallback={<LazyFallback />}>
              <RiskSignals />
            </Suspense>
          }
        />
        {/* News */}
        <Route path="news" element={<News />} />
        {/* Admin */}
        <Route path="data-sources" element={<DataSources />} />
        {/* Watchlist */}
        <Route path="watchlist" element={<Watchlist />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </>
  )
}

export default App
