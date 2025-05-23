import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ImportHistory from '../pages/ImportHistory';
import { logout } from '../login/logout';
import './Sidebar.css';

interface SidebarProps {
  collapsedProp: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsedProp, setCollapsed }) => {
  const location = useLocation();
  const [showImportHistory, setShowImportHistory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://localhost:8000/api/import', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.success) {
          setStatusMessage(`✔️ ${file.name}: ${data.message}`);
        } else {
          setStatusMessage(`❌ ${file.name}: ${data.message}`);
        }
      } catch (err) {
        setStatusMessage(`❌ ${file.name}: Error uploading file.`);
      }
    }
    setIsUploading(false);
    event.target.value = '';
  };

  React.useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  return (
    <>
      <div className={`sidebar${collapsedProp ? ' collapsed' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-header">
            <Link to="/home" className="sidebar-title">
              <h1>Project D</h1>
            </Link>
            <button
              className="sidebar-toggle"
              onClick={() => setCollapsed(!collapsedProp)}
              aria-label={collapsedProp ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsedProp ? '→' : '←'}
            </button>
          </div>
          <nav className="sidebar-links">
            <Link to="/home" className={`sidebar-link${location.pathname === '/home' ? ' active' : ''}`}>Home</Link>
            {/* <div className="sidebar-link-dropdown"><ImportDropdown /></div> */}
            <Link to="/overlapping-sessions" className={`sidebar-link${location.pathname === '/overlapping-sessions' ? ' active' : ''}`}>Overlapping Sessions</Link>
            <Link to="/user-stats" className={`sidebar-link${location.pathname === '/user-stats' ? ' active' : ''}`}>User Statistics</Link>
            <Link to="/charge-point-stats" className={`sidebar-link${location.pathname === '/charge-point-stats' ? ' active' : ''}`}>Charge Point Statistics</Link>
            <Link to="/data-table" className={`sidebar-link${location.pathname === '/data-table' ? ' active' : ''}`}>Data Table</Link>
            <Link to="/fraud-map" className={`sidebar-link${location.pathname === '/fraud-map' ? ' active' : ''}`}>Fraud Map</Link>
            <Link to="/export" className={`sidebar-link${location.pathname === '/export' ? ' active' : ''}`}>Export</Link>
            <Link to="#" className="sidebar-link" onClick={() => window.dispatchEvent(new CustomEvent('openCreateUser'))}>Create User</Link>
            <button className="sidebar-link" style={{ textAlign: 'left', width: '100%', background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }} onClick={logout}>Logout</button>
          </nav>
        </div>
        <div className="sidebar-bottom">
          <button className="sidebar-link" onClick={() => setShowImportHistory(true)}>
            Import History
          </button>
          <br />
          <button className="sidebar-link" onClick={handleFileSelect} disabled={isUploading}>Import Files</button>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </div>
      {showImportHistory && (
        <ImportHistory onClose={() => setShowImportHistory(false)} />
      )}
      {(isUploading || statusMessage) && (
        <div className="import-toast" style={{ position: 'fixed', left: 20, bottom: 80, zIndex: 3000, background: '#fff', color: '#1976d2', padding: '12px 20px', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          {isUploading ? '⏳ Uploading...' : statusMessage}
        </div>
      )}
    </>
  );
};

export default Sidebar; 