import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import ExportPage from './pages/ExportPage';
import './App.css';
import ChargeDetails from './ChargeDetails/ChargeDetail';
import Home from './home/Home';
import OverlappingSessions from './overlappingSessions/OverlappingSessions';
import { TabelDetails } from './tabel/TabelDetails';
import UserStats from './userStats/UserStats';
import { DataProvider } from './context/DataContext';
import ChargePointStatsTable from './components/ChargePointStatsTable';
import DataTable from './tabel/DataTable';
import ImportDropdown from './pages/ImportDropdown';
import LoginPage from './login/LoginPage';
import CreateUser from './createUser/CreateUser';
import FraudMapPage from './fraudMap/FraudMapPage';
import './fraudMap/FraudMap.css';

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/';
  const [showCreateUser, setShowCreateUser] = useState(false);

  return (
    <>
      {!isLoginPage && (
        <nav className="navbar">
          <div className="nav-content">
            <Link to="/home" className="nav-link" style={{ textDecoration: 'none' }}>
              <h1>Project D</h1>
            </Link>
            <div className="nav-links">
              <Link to="/home" className="nav-link">Home</Link>
              <div className="nav-link-dropdown"><ImportDropdown /></div>
              <Link to="/export" className="nav-link">Export</Link>
              <Link to="/overlapping-sessions" className="nav-link">Overlapping Sessions</Link>
              <Link to="/user-stats" className="nav-link">User Statistics</Link>
              <Link to="/charge-point-stats" className="nav-link">Charge Point Statistics</Link>
              <Link to="/data-table" className="nav-link">Data Table</Link>
              <Link to="/fraud-map" className="nav-link">Fraud Map</Link>
              <div 
                className="nav-link"
                onClick={() => setShowCreateUser(true)}
              >
                Create User
              </div>
            </div>
          </div>
        </nav>
      )}
      {showCreateUser && (
        <CreateUser onClose={() => setShowCreateUser(false)} />
      )}

      <main className="main-content">
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
  return (
    <DataProvider>
      <Router>
        <AppRoutes />
      </Router>
    </DataProvider>
  );
};

export default App;
