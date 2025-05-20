import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
//import ImportPage from './pages/ImportPage';
import ExportPage from './pages/ExportPage';
import './App.css';
import ChargeDetails from './ChargeDetails/ChargeDetail';
import Home from './home/Home';
import OverlappingSessions from './overlappingSessions/OverlappingSessions';
import { TabelDetails } from './tabel/TabelDetails';
// import { TabelForm } from './tabel/Tabel';
import UserStats from './userStats/UserStats';
import { DataProvider } from './context/DataContext';

import ChargePointStatsTable from './components/ChargePointStatsTable';
import DataTable from './tabel/DataTable';
import ImportDropdown from './pages/ImportDropdown';

const App: React.FC = () => {
  function setShowHistory(arg0: boolean): void {
    throw new Error('Function not implemented.');
  }

  return (
    <DataProvider>
      <Router>
        <nav className="navbar">
          <div className="nav-content">
            <Link to="/" className="nav-link" style={{ textDecoration: 'none' }}>
              <h1>Project D</h1>
            </Link>
            <div className="nav-links">
              <Link to="/" className="nav-link">Home</Link>
              <div className="nav-link-dropdown"><ImportDropdown /></div>
              <Link to="/export" className="nav-link">Export</Link>
              <Link to="/overlapping-sessions" className="nav-link">Overlapping Sessions</Link>
              <Link to="/user-stats" className="nav-link">User Statistics</Link>
              <Link to="/charge-point-stats" className="nav-link">Charge Point Statistics</Link>
              <Link to="/data-table" className="nav-link">Data Table</Link>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            {/* <Route path="/import" element={<ImportPage />} /> */}
            <Route path="/export" element={<ExportPage />} />
            {/* <Route path="/tabel/all" element={<TabelForm />} /> */}
            <Route path="/charges/:timeRange" element={<ChargeDetails />} />
            <Route path="/" element={
              <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
                <Home />
              </div>
            } />
            <Route path="/overlapping-sessions" element={<OverlappingSessions />} />
            <Route path="details/:cdrId" element={<TabelDetails />} />
            <Route path="/user-stats" element={<UserStats />} />
            <Route path="/charge-point-stats" element={<ChargePointStatsTable />} />
            <Route path="/data-table" element={<DataTable />} />
          </Routes>
        </main>
      </Router>
    </DataProvider>
  );
};

export default App;
