import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import ProjectList from './pages/ProjectList'
import ProjectDetail from './pages/ProjectDetail'
import Search from './pages/Search'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="search" element={<Search />} />
        {/* Phase 2 routes */}
        {/* <Route path="cis" element={<CISRounds />} /> */}
        {/* <Route path="cis/:roundId" element={<CISRoundDetail />} /> */}
        {/* <Route path="ltesa" element={<LTESARounds />} /> */}
        {/* <Route path="rez" element={<REZList />} /> */}
        {/* <Route path="watchlist" element={<Watchlist />} /> */}
        {/* Phase 3 routes */}
        {/* <Route path="performance" element={<Performance />} /> */}
        {/* <Route path="performance/wind" element={<WindLeague />} /> */}
        {/* <Route path="performance/solar" element={<SolarLeague />} /> */}
        {/* <Route path="performance/bess" element={<BESSLeague />} /> */}
        {/* Phase 4 routes */}
        {/* <Route path="developers" element={<DeveloperList />} /> */}
        {/* <Route path="developers/:id" element={<DeveloperProfile />} /> */}
        {/* <Route path="oems" element={<OEMList />} /> */}
        {/* <Route path="learn" element={<EducationHub />} /> */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
