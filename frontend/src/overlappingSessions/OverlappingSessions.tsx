import React, { useEffect, useState } from 'react';
import './OverlappingSessions.css';

const OverlappingSessions: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/overlapping-sessions")
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (value: string) => new Date(value).toLocaleString();

  return (
    <div className="overlap-container">
      <h2 className="overlap-title">Overlappende Sessies per Laadpas</h2>

      {loading ? (
        <div className="overlap-loading">Bezig met laden...</div>
      ) : data.length === 0 ? (
        <div className="overlap-empty">Geen overlappende sessies gevonden</div>
      ) : (
        <div className="overlap-table-wrapper">
          <table className="overlap-table">
            <thead>
              <tr>
                <th>Authentication ID</th>
                <th>Starttijd</th>
                <th>Eindtijd</th>
                <th>Stad</th>
                <th>Volume (kWh)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "even" : "odd"}>
                  <td>{row.Authentication_ID}</td>
                  <td>{formatDate(row.Start_datetime)}</td>
                  <td>{formatDate(row.End_datetime)}</td>
                  <td>{row.Charge_Point_City}</td>
                  <td>{row.Volume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OverlappingSessions;
