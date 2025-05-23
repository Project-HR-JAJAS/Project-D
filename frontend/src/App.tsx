import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ExportPage from './pages/ExportPage';
import './App.css';
import ChargeDetails from './ChargeDetails/ChargeDetail';
import Home from './home/Home';
import OverlappingSessions from './overlappingSessions/OverlappingSessions';
import { TabelDetails } from './tabel/TabelDetails';
import UserStats from './userStats/UserStats';
import { DataProvider } from './context/DataContext';
import ChargePointStatsTable from './chargepointstats/ChargePointStatsTable';
import DataTable from './tabel/DataTable';
import LoginPage from './login/LoginPage';
import CreateUser from './createUser/CreateUser';
import FraudMapPage from './fraudMap/FraudMapPage';
import './fraudMap/FraudMap.css';
import Sidebar from './sidebar/Sidebar';

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 60;

const AppRoutes: React.FC<{ sidebarCollapsed: boolean; setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>> }> = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/';
  const [showCreateUser, setShowCreateUser] = useState(false);

  useEffect(() => {
    const handler = () => setShowCreateUser(true);
    window.addEventListener('openCreateUser', handler);
    return () => window.removeEventListener('openCreateUser', handler);
  }, []);

  return (
    <>
      {!isLoginPage && <Sidebar collapsedProp={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />}
      {showCreateUser && (
        <CreateUser onClose={() => setShowCreateUser(false)} />
      )}
      <main
        className="main-content"
        style={{
          marginLeft: !isLoginPage ? (sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH) : 0,
          transition: 'margin-left 0.2s cubic-bezier(0.4,0,0.2,1)'
        }}
      >
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/export" element={<ExportPage />} />
          <Route path="/charges/:timeRange" element={<ChargeDetails />} />
          <Route path="/home" element={
            <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
              <Home />
            </div>
          } />
          <Route path="/overlapping-sessions" element={<OverlappingSessions />} />
          <Route path="details/:cdrId" element={<TabelDetails />} />
          <Route path="/user-stats" element={<UserStats />} />
          <Route path="/charge-point-stats" element={<ChargePointStatsTable />} />
          <Route path="/data-table" element={<DataTable />} />
          <Route path="/fraud-map" element={<FraudMapPage />} />
        </Routes>
      </main>
    </>
  );
};

const App: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <DataProvider>
      <Router>
        <Sidebar collapsedProp={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <AppRoutes sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
      </Router>
    </DataProvider>
  );
};

export default App;
