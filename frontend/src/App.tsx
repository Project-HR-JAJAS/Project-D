import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ImportPage from './pages/ImportPage';
import ExportPage from './pages/ExportPage';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <nav className="navbar">
        <div className="nav-content">
          <h1>Project D</h1>
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
          <Route path="/" element={
            <div className="home-container">
              <h2>Welcome to Project D</h2>
              <Link to="/import" className="import-link">
                Go to Import Page
              </Link>
              <Link to="/export" className="export-link">
                Go to Export Page
              </Link>
            </div>
          } />
        </Routes>
      </main>
    </Router>
  );
};

export default App;
 