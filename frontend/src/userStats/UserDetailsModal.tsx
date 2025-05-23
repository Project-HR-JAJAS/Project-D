// src/components/UserDetailsModal.tsx
import React, { useEffect, useState } from 'react';
import './UserDetailsModal.css';

interface CdrDetail {
  CDR_ID: string;
  Start_datetime: string;
  End_datetime: string;
  Duration: number;
  Volume: number;
  Charge_Point_ID: string;
  Charge_Point_City: string;
  Charge_Point_Country: string;
  Calculated_Cost: number;
}

interface UserDetailsModalProps {
  authId: string;
  onClose: () => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ authId, onClose }) => {
  const [details, setDetails] = useState<CdrDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/user-details/${authId}`)
      .then(res => res.json())
      .then(data => {
        const parsed = data.map((item: any) => ({
          ...item,
          Volume: parseFloat((item.Volume ?? '0').toString().replace(',', '.')),
          Calculated_Cost: parseFloat((item.Calculated_Cost ?? '0').toString().replace(',', '.'))
        }));
        setDetails(parsed);
      })
      .finally(() => setLoading(false));
  }, [authId]);

  const formatDate = (str: string) => new Date(str).toLocaleString();

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2 className="modal-title">CDR Details for Authentication ID: {authId}</h2>

        {loading ? (
          <p className="modal-loading">Loading...</p>
        ) : details.length === 0 ? (
          <p className="modal-empty">No records found.</p>
        ) : (
          <table className="modal-table">
            <thead>
              <tr>
                <th>CDR ID</th>
                <th>Start</th>
                <th>End</th>
                <th>Duration (min)</th>
                <th>Volume (kWh)</th>
                <th>Cost (€)</th>
                <th>Point ID</th>
                <th>City</th>
                <th>Country</th>
              </tr>
            </thead>
            <tbody>
              {details.map(detail => (
                <tr key={detail.CDR_ID}>
                  <td>{detail.CDR_ID}</td>
                  <td>{formatDate(detail.Start_datetime)}</td>
                  <td>{formatDate(detail.End_datetime)}</td>
                  <td>{detail.Duration}</td>
                  <td>{detail.Volume.toFixed(2)}</td>
                  <td>{detail.Calculated_Cost.toFixed(2)}</td>
                  <td>{detail.Charge_Point_ID}</td>
                  <td>{detail.Charge_Point_City}</td>
                  <td>{detail.Charge_Point_Country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserDetailsModal;
