import React from 'react';
import './DecisionHistoryModal.css';

interface Decision {
  id: number;
  cdr_id: string;
  user_id: string;
  user_name: string;
  status: 'approve' | 'deny' | 'maybe';
  reason: string;
  decision_time: string;
}

interface DecisionHistoryModalProps {
  decisions: Decision[];
  cdrId: string;
  onClose: () => void;
}

const DecisionHistoryModal: React.FC<DecisionHistoryModalProps> = ({ decisions, cdrId, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Decision History for {cdrId}</h3>
        <ul>
          {decisions.length === 0 ? (
            <li>No decisions yet.</li>
          ) : (
            decisions.map((d) => (
              <li key={d.id} style={{ marginBottom: 16 }}>
                <b>{d.status === 'approve' ? 'Fraud' : d.status === 'deny' ? 'No Fraud' : 'Uncertain'}</b> by {d.user_name} on {new Date(d.decision_time).toLocaleString()}<br />
                <span>{d.reason}</span>
              </li>
            ))
          )}
        </ul>
        <button className="modal-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default DecisionHistoryModal; 