import React, { useEffect, useRef, useState } from 'react';
import ImportHistory from './ImportHistory';
import './ImportDropdown.css';

interface ImportDropdownProps {}

const ImportDropdown: React.FC<ImportDropdownProps> = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false); // New state to control dropdown

  const handleFileSelect = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
      setIsOpen(false); // Close dropdown when clicking Import Files
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
    event.target.value = ''; // Reset input so user can re-upload same file if needed
  };

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  return (
    <div className="import-dropdown">
      <button
        className="dropdown-toggle"
        onClick={() => setIsOpen(prev => !prev)}
      >
        Import ▼
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <button onClick={handleFileSelect} disabled={isUploading}>
            Import Files
          </button>
          <button
            onClick={() => {
              setShowHistory(true);
              setIsOpen(false); // Close dropdown on click
            }}
          >
            Import History
          </button>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {showHistory && (
        <ImportHistory onClose={() => setShowHistory(false)} />
      )}

      {(isUploading || statusMessage) && (
        <div className="import-toast">
          {isUploading ? '⏳ Uploading...' : statusMessage}
        </div>
      )}
    </div>
  );
};

export default ImportDropdown;
