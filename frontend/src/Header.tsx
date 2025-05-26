import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaUserCircle, FaChevronDown, FaSignOutAlt, FaFileImport, FaHistory } from 'react-icons/fa';
import './Header.css';
import { logout } from './login/logout';
import ImportHistory from './pages/ImportHistory';

const Header: React.FC = () => {
  const [username, setUsername] = useState(() => localStorage.getItem('username') || 'Admin');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showImportHistory, setShowImportHistory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    setUsername(storedUsername || 'Admin');
  }, []);

  // Import Files logic
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

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  return (
    <header className="custom-header">
      <div className="header-title">Project D</div>
      <div className="header-center">
        <div className="header-search">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search CDR_ID" 
            className="search-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const searchValue = e.currentTarget.value.trim();
                if (searchValue) {
                  window.location.href = `/cdr-details/${searchValue}`;
                }
              }
            }}
          />
        </div>
      </div>
      <div className="header-right">
        <button className="header-action-btn" onClick={() => setShowImportHistory(true)} title="Import History">
          <FaHistory /> Import History
        </button>
        <button className="header-action-btn" onClick={handleFileSelect} disabled={isUploading} title="Import Files">
          <FaFileImport /> Import Files
        </button>
        <input
          type="file"
          title="Import Files"
          ref={fileInputRef}
          multiple
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <div className="user-info" onClick={() => setDropdownOpen((v) => !v)}>
          <FaUserCircle className="user-avatar" />
          <span className="username">{username}</span>
          <FaChevronDown className="dropdown-icon" />
          {dropdownOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={logout}>
                <FaSignOutAlt className="dropdown-item-icon" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
      {showImportHistory && (
        <ImportHistory onClose={() => setShowImportHistory(false)} />
      )}
      {(isUploading || statusMessage) && (
        <div className="import-toast" style={{ position: 'fixed', right: 20, top: 80, zIndex: 3000, background: '#fff', color: '#1976d2', padding: '12px 20px', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          {isUploading ? '⏳ Uploading...' : statusMessage}
        </div>
      )}
    </header>
  );
};

export default Header; 