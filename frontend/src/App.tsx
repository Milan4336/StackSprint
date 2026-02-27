import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Transactions } from './pages/Transactions';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Alerts } from './pages/Alerts';
import { Cases } from './pages/Cases';
import { Radar } from './pages/Radar';
import { Audit } from './pages/Audit';
import { ModelHealth } from './pages/ModelHealth';
import { Updates } from './pages/Updates';
import { System } from './pages/System';
import { FraudNetwork } from './pages/FraudNetwork';
import { BehaviorProfiles } from './pages/BehaviorProfiles';
import { AppLayout } from './components/layout/AppLayout';

export const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/radar" element={<Radar />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/model-health" element={<ModelHealth />} />
          <Route path="/updates" element={<Updates />} />
          <Route path="/fraud-network" element={<FraudNetwork />} />
          <Route path="/behavior-profiles" element={<BehaviorProfiles />} />
          <Route path="/system" element={<System />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </BrowserRouter>
);
