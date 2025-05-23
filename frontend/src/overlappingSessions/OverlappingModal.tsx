import React, { useEffect, useState } from 'react';
import './OverlappingModal.css';

interface OverlappingSession {
  CDR_ID: string;
  Authentication_ID: string;
  Start_datetime: string;
  End_datetime: string;
  Charge_Point_City: string;
  Volume: number;
}

interface OverlappingModalProps {
  cdrId: string;
  onClose: () => void;
}

const OverlappingModal: React.FC<OverlappingModalProps> = ({ cdrId, onClose }) => {
  const [sessions, setSessions] = useState<OverlappingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [authId, setAuthId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`http://localhost:8000/api/overlapping-sessions/${cdrId}`)
      .then(res => res.json())
      .then(data => {
        setSessions(data);
        if (data.length > 0) {
          setAuthId(data[0].Authentication_ID);
        }
      })
      .finally(() => setLoading(false));
  }, [cdrId]);

  const formatDate = (value: string) => new Date(value).toLocaleString();

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2 className="modal-title">
          Overlapping Sessions for CDR {cdrId}{authId ? ` (Authentication ID ${authId})` : ''}
        </h2>

        {loading ? (
          <p className="modal-loading">Loading...</p>
        ) : sessions.length === 0 ? (
          <p className="modal-empty">No overlapping sessions found.</p>
        ) : (
          <table className="modal-table">
            <thead>
              <tr>
                <th>CDR ID</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>City</th>
                <th>Volume (kWh)</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.CDR_ID} className={session.CDR_ID === cdrId ? 'highlight-row' : ''}>
                  <td>{session.CDR_ID}</td>
                  <td>{formatDate(session.Start_datetime)}</td>
                  <td>{formatDate(session.End_datetime)}</td>
                  <td>{session.Charge_Point_City}</td>
                  <td>{session.Volume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default OverlappingModal;
