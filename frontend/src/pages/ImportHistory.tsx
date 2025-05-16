import React, { useEffect, useState } from 'react';
import { fetchImportLogs, ImportLogEntry } from './ImportHistory.api'; // Adjust the path if needed

interface ImportHistoryProps {
  onClose: () => void;
}

const ImportHistory: React.FC<ImportHistoryProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<ImportLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await fetchImportLogs();
        setLogs(data);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Import History</h2>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <table className="modal-table">
            <thead>
              <tr>
                <th>Date Imported</th>
                <th>File Name</th>
                <th>Status</th>
                <th>Amount of Entries</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={index}>
                  <td>{log.date}</td>
                  <td>{log.filename}</td>
                  <td>{log.status}</td>
                  <td>{log.records}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ImportHistory;
