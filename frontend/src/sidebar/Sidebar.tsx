import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ImportHistory from '../pages/ImportHistory';
import { logout } from '../login/logout';
import './Sidebar.css';
import { FaTachometerAlt, FaUserFriends, FaTable, FaPlug, FaChartBar, FaCog, FaSignOutAlt, FaUserPlus, FaFileExport, FaLayerGroup, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

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
          <button
            className="sidebar-toggle-floating"
            onClick={() => setCollapsed(!collapsedProp)}
            aria-label={collapsedProp ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ position: 'absolute', top: 24, right: -18, zIndex: 1200 }}
          >
            {collapsedProp ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
          <div className="sidebar-section-label">MENU</div>
          <nav className="sidebar-links">
            <Link to="/home" className={`sidebar-link${location.pathname === '/home' ? ' active' : ''}`}><FaTachometerAlt className="sidebar-icon" /> Dashboard</Link>
            <Link to="/overlapping-sessions" className={`sidebar-link${location.pathname === '/overlapping-sessions' ? ' active' : ''}`}><FaLayerGroup className="sidebar-icon" /> Overlapping Sessions</Link>
            <Link to="/user-stats" className={`sidebar-link${location.pathname === '/user-stats' ? ' active' : ''}`}><FaUserFriends className="sidebar-icon" /> User Statistics</Link>
            <Link to="/charge-point-stats" className={`sidebar-link${location.pathname === '/charge-point-stats' ? ' active' : ''}`}><FaPlug className="sidebar-icon" /> Chargepoint Statistics</Link>
            <Link to="/data-table" className={`sidebar-link${location.pathname === '/data-table' ? ' active' : ''}`}><FaTable className="sidebar-icon" /> Data Table</Link>
            <Link to="/fraud-map" className={`sidebar-link${location.pathname === '/fraud-map' ? ' active' : ''}`}><FaChartBar className="sidebar-icon" /> Fraud Map</Link>
          </nav>
          <div className="sidebar-section-label">OTHERS</div>
          <nav className="sidebar-links">
            <Link to="/settings" className={`sidebar-link${location.pathname === '/settings' ? ' active' : ''}`}><FaCog className="sidebar-icon" /> Settings</Link>
            <Link to="/export" className={`sidebar-link${location.pathname === '/export' ? ' active' : ''}`}><FaFileExport className="sidebar-icon" /> Export</Link>
            <Link to="#" className="sidebar-link" onClick={() => window.dispatchEvent(new CustomEvent('openCreateUser'))}><FaUserPlus className="sidebar-icon" /> Create User</Link>
          </nav>
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-logout-separator" />
          <button className="sidebar-link sidebar-logout" style={{ textAlign: 'left', height: '50px', width: '100%', background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }} onClick={logout}><FaSignOutAlt className="sidebar-icon" /> Logout</button>
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