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
  const [sortConfig, setSortConfig] = useState<{ key: keyof CdrDetail | null; direction: 'asc' | 'desc' | null }>({
  key: null,
  direction: null,
  });

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

  const handleSort = (key: keyof CdrDetail) => {
    setSortConfig(prev => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      if (prev.direction === 'desc') return { key: null, direction: null };
      return { key, direction: 'asc' };
    });
  };

  const getSortIndicator = (key: keyof CdrDetail) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '';
    }
    return '';
  };
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
                <th>Charge Point ID</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Duration (min)</th>
                <th onClick={() => handleSort('Volume')} className="sortable-header">
                  Volume (kWh){getSortIndicator('Volume')}
                </th>
                <th onClick={() => handleSort('Calculated_Cost')} className="sortable-header">
                  Cost (€){getSortIndicator('Calculated_Cost')}
                </th>
                <th>City</th>
                <th>Country</th>
              </tr>
            </thead>
            <tbody>
                {[...details]
                  .sort((a, b) => {
                    if (!sortConfig.key || !sortConfig.direction) return 0;
                    const aVal = a[sortConfig.key] ?? 0;
                    const bVal = b[sortConfig.key] ?? 0;

                    if (typeof aVal === 'number' && typeof bVal === 'number') {
                      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
                    }

                    return 0;
                  })
                    .map(detail => (
                <tr key={detail.CDR_ID}>
                  <td>{detail.CDR_ID}</td>
                  <td>{detail.Charge_Point_ID}</td>
                  <td>{formatDate(detail.Start_datetime)}</td>
                  <td>{formatDate(detail.End_datetime)}</td>
                  <td>{detail.Duration}</td>
                  <td>{detail.Volume.toFixed(2)}</td>
                  <td>{detail.Calculated_Cost.toFixed(2)}</td>
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
