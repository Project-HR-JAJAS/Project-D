import React, { useState } from 'react';
import "./ExportPage.css";

const ExportPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');

  const handleExport = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`http://localhost:8000/api/export?format=${format}`);
      if (!response.ok) {
        throw new Error('Failed to export file.');
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
      setMessage({ type: 'error', text: 'Error exporting file. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        gap: '16px',
        padding: '16px',
      }}
    >
      <h1 style={{ marginBottom: '16px' }}>Export CDR Data</h1>

      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as 'xlsx' | 'csv')}
        disabled={loading}
        style={{
          minWidth: '200px',
          padding: '8px',
          fontSize: '16px',
        }}
      >
        <option value="xlsx">Excel (.xlsx)</option>
        <option value="csv">CSV (.csv)</option>
      </select>

      <button
        onClick={handleExport}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          color: '#fff',
          backgroundColor: '#007bff',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {loading ? (
          <div
            style={{
              width: '24px',
              height: '24px',
              border: '3px solid #fff',
              borderTop: '3px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          ></div>
        ) : (
          <span>Download</span>
        )}
      </button>

      {message && (
        <div
          style={{
            width: '100%',
            maxWidth: '500px',
            padding: '10px',
            borderRadius: '4px',
            color: message.type === 'success' ? '#155724' : '#721c24',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          }}
        >
          {message.text}
        </div>
      )}
    </div>
  );
};

export default ExportPage;