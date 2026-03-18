import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import ProjectList from './pages/ProjectList'
import ProjectDetail from './pages/ProjectDetail'
import Search from './pages/Search'
import Guides from './pages/Guides'
import GuideReader from './pages/GuideReader'
import SchemesOverview from './pages/SchemesOverview'
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
import Dunkelflaute from './pages/intelligence/Dunkelflaute'
import EnergyMix from './pages/intelligence/EnergyMix'
import DeveloperScores from './pages/intelligence/DeveloperScores'
import RevenueIntel from './pages/intelligence/RevenueIntel'
import TransmissionInfra from './pages/intelligence/TransmissionInfra'
import EISTechnical from './pages/intelligence/EISTechnical'
import News from './pages/News'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="search" element={<Search />} />
        <Route path="guides" element={<Guides />} />
        <Route path="guides/:id" element={<GuideReader />} />
        {/* Phase 2: Schemes */}
        <Route path="schemes" element={<SchemesOverview />} />
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
        {/* Analytics */}
        <Route path="analytics/bess-capex" element={<BESSCapex />} />
        <Route path="analytics/project-timeline" element={<ProjectTimeline />} />
        {/* Intelligence Layer */}
        <Route path="intelligence" element={<IntelligenceHub />} />
        <Route path="intelligence/scheme-tracker" element={<SchemeTracker />} />
        <Route path="intelligence/drift-analysis" element={<DriftAnalysis />} />
        <Route path="intelligence/wind-resource" element={<WindResource />} />
        <Route path="intelligence/dunkelflaute" element={<Dunkelflaute />} />
        <Route path="intelligence/energy-mix" element={<EnergyMix />} />
        <Route path="intelligence/developer-scores" element={<DeveloperScores />} />
        <Route path="intelligence/revenue" element={<RevenueIntel />} />
        <Route path="intelligence/grid-connection" element={<TransmissionInfra />} />
        <Route path="intelligence/eis-technical" element={<EISTechnical />} />
        {/* News */}
        <Route path="news" element={<News />} />
        {/* Admin */}
        <Route path="data-sources" element={<DataSources />} />
        {/* Future routes */}
        {/* <Route path="watchlist" element={<Watchlist />} /> */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
