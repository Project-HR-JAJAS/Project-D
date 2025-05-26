import React, { useEffect, useState } from 'react';
import './OverlappingModal.css';
import TableExportButton from '../exportButton/TableExportButton';

interface OverlappingSession {
  CDR_ID: string;
  Authentication_ID: string;
  Start_datetime: string;
  End_datetime: string;
  Charge_Point_City: string;
  Volume: number;
  Charge_Point_ID: string;
  Charge_Point_Country: string;
  Calculated_Cost: number;
}

interface OverlappingModalProps {
  cdrId: string;
  onClose: () => void;
}

const OverlappingModal: React.FC<OverlappingModalProps> = ({ cdrId, onClose }) => {
  const [sessions, setSessions] = useState<OverlappingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [authId, setAuthId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof OverlappingSession | null; direction: 'asc' | 'desc' | null }>({ key: null, direction: null });
  
  useEffect(() => {
    fetch(`http://localhost:8000/api/overlapping-cluster/${cdrId}`)
      .then(res => res.json())
      .then(data => {
        const cleaned = data.map((item: any) => ({
          ...item,
          Volume: parseFloat((item.Volume ?? '0').toString().replace(',', '.')),
          Calculated_Cost: typeof item.Calculated_Cost === 'string'
            ? parseFloat(item.Calculated_Cost.replace(',', '.'))
            : item.Calculated_Cost
        }));

        setSessions(cleaned);

        if (cleaned.length > 0) {
          setAuthId(cleaned[0].Authentication_ID);
        }
      })
      .finally(() => setLoading(false));
  }, [cdrId]);

  const formatDate = (value: string) => new Date(value).toLocaleString();

  const handleSort = (key: keyof OverlappingSession) => {
        setSortConfig(prev => {
            if (prev.key !== key) return { key, direction: 'asc' };
            if (prev.direction === 'asc') return { key, direction: 'desc' };
            if (prev.direction === 'desc') return { key: null, direction: null };
            return { key, direction: 'asc' };
        });
    };

    const getSortIndicator = (key: keyof OverlappingSession) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '';
        }
        return '';
    };

    let sortedSessions = [...sessions];
    if (sortConfig.key !== null && sortConfig.direction) {
      const key = sortConfig.key!;

      sortedSessions.sort((a, b) => {
        const aVal = a[key] ?? '';
        const bVal = b[key] ?? '';

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        return sortConfig.direction === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }

  const exportColumns = [
    { label: 'CDR ID', key: 'CDR_ID' },
    { label: 'Charge Point ID', key: 'Charge_Point_ID' },
    { label: 'Start Time', key: 'Start_datetime' },
    { label: 'End Time', key: 'End_datetime' },
    { label: 'City', key: 'Charge_Point_City' },
    { label: 'Country', key: 'Charge_Point_Country' },
    { label: 'Volume (kWh)', key: 'Volume' },
    { label: 'Cost (€)', key: 'Calculated_Cost' },
  ];

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
        <div>
          <TableExportButton
            data={sortedSessions}
            columns={exportColumns}
            filename={`overlapping_sessions_${cdrId}`}
            format="xlsx"
          />
          <table className="modal-table">
            <thead>
              <tr>
                <th>CDR ID</th>
                <th>Charge Point ID</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>City</th>
                <th>Country</th>
                <th className="sortable-header" onClick={() => handleSort('Volume')}>
                      Volume (kWh){getSortIndicator('Volume')}
                  </th>
                <th className="sortable-header" onClick={() => handleSort('Calculated_Cost')}>
                  Cost (€){getSortIndicator('Calculated_Cost')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedSessions.map((session) => (
                <tr key={session.CDR_ID} className={session.CDR_ID === cdrId ? 'highlight-row' : ''}>
                  <td>{session.CDR_ID}</td>
                  <td>{session.Charge_Point_ID}</td>
                  <td>{formatDate(session.Start_datetime)}</td>
                  <td>{formatDate(session.End_datetime)}</td>
                  <td>{session.Charge_Point_City}</td>
                  <td>{session.Charge_Point_Country}</td>
                  <td>{session.Volume}</td>
                  <td>{session.Calculated_Cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverlappingModal;
