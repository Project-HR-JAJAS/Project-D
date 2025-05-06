import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ImportPage from './pages/ImportPage';
import ExportPage from './pages/ExportPage';
import './App.css';
import ChargeDetails from './ChargeDetails/ChargeDetail';
import Home from './home/Home';
import OverlappingSessions from './overlappingSessions/OverlappingSessions';
import { TabelDetails } from './tabel/TabelDetails';
import { TabelForm } from './tabel/Tabel';
import ChargePointStatsTable from './components/ChargePointStatsTable';
import DataTable from './tabel/DataTable';

const App: React.FC = () => {
  return (
    <Router>
      <nav className="navbar">
        <div className="nav-content">
          <Link to="/" className="nav-link" style={{ textDecoration: 'none' }}>
            <h1>Project D</h1>
          </Link>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/import" className="nav-link">Import</Link>
            <Link to="/export" className="nav-link">Export</Link>
            <Link to="/overlapping-sessions" className="nav-link">Overlappende Sessies</Link>
            <Link to="/charge-point-stats" className="nav-link">Laadpunt Statistieken</Link>
            <Link to="/data-table" className="nav-link">Data Tabel</Link>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/import" element={<ImportPage />} />
          <Route path="/export" element={<ExportPage />} />
          <Route path="/tabel/all" element={<TabelForm />} />
          <Route path="/charges/:timeRange" element={<ChargeDetails />} />
          <Route path="/" element={
            <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
              <Home />
            </div>
          } />
          <Route path="/overlapping-sessions" element={<OverlappingSessions />} />
          <Route path="details/:cdrId" element={<TabelDetails />} />
          <Route path="/charge-point-stats" element={<ChargePointStatsTable />} />
          <Route path="/data-table" element={<DataTable />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;
