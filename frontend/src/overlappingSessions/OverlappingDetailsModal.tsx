import React, { useEffect, useState } from 'react';
import './OverlappingDetailsModal.css';

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

interface OverlappingDetailsModalProps {
  cdrId: string;
  onClose: () => void;
}

const OverlappingDetailsModal: React.FC<OverlappingDetailsModalProps> = ({ cdrId, onClose }) => {
  const [details, setDetails] = useState<OverlappingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/overlapping-details/${cdrId}`)
      .then(res => res.json())
      .then(data => {
        const cleaned = data.map((item: any) => ({
          ...item,
          Volume: parseFloat((item.Volume ?? '0').toString().replace(',', '.')),
          Calculated_Cost: typeof item.Calculated_Cost === 'string'
            ? parseFloat(item.Calculated_Cost.replace(',', '.'))
            : item.Calculated_Cost
        }));
        setDetails(cleaned);
      })
      .finally(() => setLoading(false));
  }, [cdrId]);

  const formatDate = (value: string) => new Date(value).toLocaleString();

  return (
    <div className="details-modal-overlay">
      <div className="details-modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2 className="details-modal-title">Details for CDR: {cdrId}</h2>
        {loading ? (
          <p className="modal-loading">Loading...</p>
        ) : details.length === 0 ? (
          <p className="modal-empty">No details found.</p>
        ) : (
          <table className="modal-table">
            <thead>
              <tr>
                <th>CDR ID</th>
                <th>Authentication ID</th>
                <th>Charge Point ID</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>City</th>
                <th>Country</th>
                <th>Volume (kWh)</th>
                <th>Cost (€)</th>
              </tr>
            </thead>
            <tbody>
              {details.map(detail => (
                  <tr key={detail.CDR_ID} className={detail.CDR_ID === cdrId ? 'highlight-bold-row' : ''}>
                  <td>{detail.CDR_ID}</td>
                  <td>{detail.Authentication_ID}</td>
                  <td>{detail.Charge_Point_ID}</td>
                  <td>{formatDate(detail.Start_datetime)}</td>
                  <td>{formatDate(detail.End_datetime)}</td>
                  <td>{detail.Charge_Point_City}</td>
                  <td>{detail.Charge_Point_Country}</td>
                  <td>{detail.Volume}</td>
                  <td>{detail.Calculated_Cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default OverlappingDetailsModal;
