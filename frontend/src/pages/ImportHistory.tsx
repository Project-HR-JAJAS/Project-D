import React, { useEffect, useState } from 'react';
import { fetchImportLogs, ImportLogEntry } from './ImportHistory.api'; // Adjust the path if needed
import './ImportHistory.css';
import { useNavigate } from 'react-router-dom';

interface ImportHistoryProps {
  onClose: () => void;
}

const ImportHistory: React.FC<ImportHistoryProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<ImportLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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

  const handleViewFraudCases = (filename: string) => {
    navigate(`/fraud-cases/${encodeURIComponent(filename)}`);
  };

  return (
    <div className="model-overlay">
      <div className="model-content">
        <button className="model-close" onClick={onClose}>×</button>
        <h2 className="model-title">Import History</h2>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <table className="model-table">
            <thead>
              <tr>
                <th>Date Imported</th>
                <th>File Name</th>
                <th>Status</th>
                <th>Amount of Entries</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr
                  key={index}
                  className={log.status === "Success" ? "row-success" : "row-fail"}
                >
                  <td>{log.date}</td>
                  <td>{log.filename}</td>
                  <td>{log.status}</td>
                  <td>{log.records}</td>
                  <td>
                    {log.status === 'Success' && (
                      <button
                        style={{ marginLeft: 8 }}
                        onClick={() => {
                          onClose();
                          navigate(`/fraud-cases/${encodeURIComponent(log.filename)}`);
                        }}
                      >
                        View Fraud Cases
                      </button>
                    )}
                  </td>
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
