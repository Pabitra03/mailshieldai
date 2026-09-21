import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout, ToastHost, UploadModal } from './components';
import { LandingPage } from './pages/LandingPage';
import { LiveFeed } from './pages/LiveFeed';
import { Overview } from './pages/Overview';
import { CaseDetail } from './pages/CaseDetail';
import { GeoIntel } from './pages/GeoIntel';
import { Campaigns } from './pages/Campaigns';
import { Evidence } from './pages/Evidence';
import { Reports } from './pages/Reports';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<Layout />}>
          <Route path="/console" element={<LiveFeed />} />
          <Route path="/console/overview" element={<Overview />} />
          <Route path="/console/feed" element={<Navigate to="/console" replace />} />
          <Route path="/console/cases/:id" element={<CaseDetail />} />
          <Route path="/console/geo-intel" element={<GeoIntel />} />
          <Route path="/console/campaigns" element={<Campaigns />} />
          <Route path="/console/evidence" element={<Evidence />} />
          <Route path="/console/reports" element={<Reports />} />
          <Route path="/feed" element={<Navigate to="/console" replace />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/geo-intel" element={<Navigate to="/console/geo-intel" replace />} />
          <Route path="/campaigns" element={<Navigate to="/console/campaigns" replace />} />
          <Route path="/evidence" element={<Navigate to="/console/evidence" replace />} />
          <Route path="/reports" element={<Navigate to="/console/reports" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <UploadModal />
      <ToastHost />
    </BrowserRouter>
  );
}
