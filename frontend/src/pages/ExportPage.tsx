import React, { useState } from 'react';
import "./ExportPage.css";

const allColumns = [
  "CDR_ID", "Start_datetime", "End_datetime", "Duration", "Volume",
  "Charge_Point_Address", "Charge_Point_ZIP", "Charge_Point_City",
  "Charge_Point_Country", "Charge_Point_Type", "Product_Type", "Tariff_Type",
  "Authentication_ID", "Contract_ID", "Meter_ID", "OBIS_Code",
  "Charge_Point_ID", "Service_Provider_ID", "Infra_Provider_ID", "Calculated_Cost"
];

const ExportPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([...allColumns]);

  const toggleColumn = (column: string) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  const toggleAll = () => {
    if (selectedColumns.length === allColumns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns([...allColumns]);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const params = new URLSearchParams({
        format,
        columns: selectedColumns.join(","),
      });

      const response = await fetch(`http://localhost:8000/api/export?${params.toString()}`);

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
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Export failed.' });
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

        <div>
          <label>
            <input
              type="checkbox"
              checked={selectedColumns.length === allColumns.length}
              onChange={toggleAll}
            /> Select All
          </label>
        </div>

        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {allColumns.map((col) => (
            <label key={col} style={{ display: 'block' }}>
              <input
                type="checkbox"
                checked={selectedColumns.includes(col)}
                onChange={() => toggleColumn(col)}
              /> {col}
            </label>
          ))}
        </div>
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
