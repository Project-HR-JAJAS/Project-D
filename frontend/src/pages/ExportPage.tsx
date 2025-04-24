import React, { useState } from 'react';
import "./ExportPage.css";

const ExportPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');

  const handleExport = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`http://localhost:8000/api/export?format=${format}`);
      
      if (response.status === 404) {
        const data = await response.json();
        setMessage({ type: 'info', text: data.detail });
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to export file.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cdr_export.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: `File exported successfully as .${format}` });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error exporting file. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-container">
      <h1>Export CDR Data</h1>

      <div className="format-selector">
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as 'xlsx' | 'csv')}
          disabled={loading}
        >
          <option value="xlsx">Excel (.xlsx)</option>
          <option value="csv">CSV (.csv)</option>
        </select>
      </div>

      <button
        className="download-button"
        onClick={handleExport}
        disabled={loading}
      >
        {loading ? <div className="loading-spinner"></div> : 'Download'}
      </button>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default ExportPage;