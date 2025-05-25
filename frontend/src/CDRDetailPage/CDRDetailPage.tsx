import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './CDRDetailPage.css';
import MapComponent from './MapComponent'; // adjust path if needed


interface CDRDetail {
  [key: string]: any;
}

const CDRDetailPage: React.FC = () => {
  const { CDR_ID } = useParams<{ CDR_ID: string }>();
  const [cdr, setCdr] = useState<CDRDetail | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [desc, setDesc] = useState('');
  const [fraudError, setFraudError] = useState('');
  const [action, setAction] = useState<'approve' | 'deny' | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Get username from localStorage
  const username = localStorage.getItem('username') || 'User';
  const avatarLetter = username.charAt(0).toUpperCase();

  useEffect(() => {
    if (!CDR_ID) return;
    setLoading(true);
    fetch(`http://localhost:8000/api/cdr-details/${CDR_ID}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setCdr(data.cdr);
        setReasons(data.reasons);
        setLatitude(data.latitude);
        setLongitude(data.longitude);
        setLoading(false);
      })
      .catch(() => {
        setError('Details not found');
        setLoading(false);
      });
  }, [CDR_ID]);

  const handleFraudAction = (type: 'approve' | 'deny') => {
    setAction(type);
    if (!desc.trim()) {
      setFraudError('Beschrijving is verplicht.');
      return;
    }
    setFraudError('');
    // TODO: Send approval/denial to backend
    alert(`Fraude ${type === 'approve' ? 'goedgekeurd' : 'afgewezen'} met beschrijving: ${desc}`);
    setDesc('');
    setAction(null);
  };

  const handleFindLocation = async () => {
    setGeoLoading(true);
    setGeoError('');
    try {
      const res = await fetch(`http://localhost:8000/api/geocode-cdr/${CDR_ID}`, { method: 'POST' });
      if (!res.ok) throw new Error('Could not geocode');
      const data = await res.json();
      setLatitude(data.latitude);
      setLongitude(data.longitude);
    } catch (err) {
      setGeoError('Locatie niet gevonden');
    } finally {
      setGeoLoading(false);
    }
  };

  if (loading) return <div className="cdr-detail-loading">Loading...</div>;
  if (error || !cdr) return <div className="cdr-detail-error">{error || 'No details found.'}</div>;

  // Prepare details for display (filter out null/undefined)
  const detailFields = [
    { label: 'Chargepoint ID', value: cdr.Charge_Point_ID },
    { label: 'Start Time', value: cdr.Start_datetime },
    { label: 'End Time', value: cdr.End_datetime },
    { label: 'Address', value: cdr.Charge_Point_Address },
    { label: 'Zip', value: cdr.Charge_Point_ZIP },
    { label: 'City', value: cdr.Charge_Point_City },
    { label: 'Country', value: cdr.Charge_Point_Country },
    { label: 'Duration', value: cdr.Duration },
    { label: 'Type', value: cdr.Charge_Point_Type },
    { label: 'Cost', value: cdr.Calculated_Cost },
    { label: 'Volume', value: cdr.Volume },
  ];

  return (
    <div className="cdr-detail-main-container">
      <h2 className="cdr-detail-header">{CDR_ID}</h2>
      <div className="cdr-detail-content">
        {/* Details Section */}
        <div className="cdr-detail-section details-section">
          <h3>Details</h3>
          <div className="cdr-detail-fields">
            {detailFields.map(
              (f, i) => f.value !== undefined && f.value !== null && (
                <div key={i} className="cdr-detail-row">
                  <span className="cdr-detail-label">{f.label}:</span>
                  <span className="cdr-detail-value">{String(f.value)}</span>
                </div>
              )
            )}
          </div>
          <div className="cdr-detail-reasons">
            <div className="cdr-detail-label">Reason:</div>
            <ol>
              {reasons.length === 0 ? <li>No reasons found</li> : reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ol>
          </div>
        </div>
        {/* Right Panel: Fraud Approval */}
        <div className="cdr-detail-section right-section">
          <div className="cdr-fraud-approve-row">
            <span>Approval/Deny Fraud</span>
            <button className="cdr-fraud-btn approve" onClick={() => handleFraudAction('approve')}>✔</button>
            <button className="cdr-fraud-btn deny" onClick={() => handleFraudAction('deny')}>✖</button>
          </div>
          <div className="cdr-user-info">
            <div className="cdr-avatar">{avatarLetter}</div>
            <span className="cdr-username">{username}</span>
          </div>
          <div className="cdr-fraud-desc-label">Reason for approval/denial</div>
          <textarea
            className="cdr-fraud-desc"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder={`Add reason for approval/denial`}
          />
          {fraudError && <div className="cdr-fraud-error">{fraudError}</div>}
        </div>
      </div>
      {/* Map Section */}
      <div className="cdr-detail-section map-section">
        {(latitude && longitude) ? (
          <div className="cdr-map-container">
            <MapComponent latitude={latitude} longitude={longitude} />
          </div>
        ) : (
          <div>
            <div className="cdr-map-placeholder">Location not found</div>
            <button
              className="find-location-btn"
              onClick={handleFindLocation}
              disabled={geoLoading}
            >
              {geoLoading ? 'Bezig met zoeken...' : 'Find Location'}
            </button>
            {geoError && <div style={{ color: 'red' }}>{geoError}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default CDRDetailPage; 