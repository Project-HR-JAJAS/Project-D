import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ImportPage from './pages/ImportPage';
import ExportPage from './pages/ExportPage';
import './App.css';
import ChargeDetails from './home/ChargeDetail';
import Home from './home/Home';
import { TabelDetails } from './tabel/TabelDetails';
import { TabelForm } from './tabel/Tabel';

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
          <Route path="details/:cdrId" element={<TabelDetails />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;
