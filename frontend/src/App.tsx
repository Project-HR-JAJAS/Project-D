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
import PrivateRoute from './middleware/PrivateRoute';
import Header from './Header';

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
      {!isLoginPage && <Header />}
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
          <Route path="/export" element={<PrivateRoute><ExportPage /></PrivateRoute>} />
          <Route path="/charges/:timeRange" element={<PrivateRoute><ChargeDetails /></PrivateRoute>} />
          <Route path="/home" element={<PrivateRoute><div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}><Home /></div></PrivateRoute>} />
          <Route path="/overlapping-sessions" element={<PrivateRoute><OverlappingSessions /></PrivateRoute>} />
          <Route path="details/:cdrId" element={<PrivateRoute><TabelDetails /></PrivateRoute>} />
          <Route path="/user-stats" element={<PrivateRoute><UserStats /></PrivateRoute>} />
          <Route path="/charge-point-stats" element={<PrivateRoute><ChargePointStatsTable /></PrivateRoute>} />
          <Route path="/data-table" element={<PrivateRoute><DataTable /></PrivateRoute>} />
          <Route path="/fraud-map" element={<PrivateRoute><FraudMapPage /></PrivateRoute>} />
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
        <AppRoutes sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
      </Router>
    </DataProvider>
  );
};

export default App;
