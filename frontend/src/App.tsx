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
        {/* Future routes */}
        {/* <Route path="watchlist" element={<Watchlist />} /> */}
        {/* <Route path="developers" element={<DeveloperList />} /> */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
