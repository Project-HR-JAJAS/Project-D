import React, { useState, useEffect } from 'react';
import './Settings.css';
import { getFraudThresholds, saveFraudThresholds } from './Settings.api';

interface FraudThresholds {
  maxVolumeKwh: number;
  maxDurationMinutes: number;
  minCostThreshold: number;
  minTimeGapMinutes: number;
  behaviorThreshold: number;
  minDistanceKm: number;
  minTravelTimeMinutes: number;
}

const Settings = () => {
  const [thresholds, setThresholds] = useState<FraudThresholds>({
    maxVolumeKwh: 22,
    maxDurationMinutes: 60,
    minCostThreshold: 20,
    minTimeGapMinutes: 30,
    behaviorThreshold: 3,
    minDistanceKm: 10,
    minTravelTimeMinutes: 15,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const data = await getFraudThresholds();
        setThresholds(data);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    fetchThresholds();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setThresholds((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const success = await saveFraudThresholds(thresholds);
      if (success) {
        setSaveStatus('Settings saved successfully! Fraud detection running...');
      } else {
        setSaveStatus('Failed to save settings');
      }
    } catch (error) {
      setSaveStatus('Network error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  // Threshold descriptions
  const thresholdDescriptions: Record<keyof FraudThresholds, string> = {
    maxVolumeKwh: "Maximum allowed energy consumption (kWh) per charging session. Sessions exceeding this volume will be flagged.",
    maxDurationMinutes: "Maximum allowed session duration (minutes). Shorter sessions with high volume will be flagged.",
    minCostThreshold: "Minimum cost (€) to trigger cost/volume ratio check. Sessions above this cost with low volume will be analyzed.",
    minTimeGapMinutes: "Minimum required gap (minutes) between consecutive sessions. Shorter gaps at same station will be flagged.",
    behaviorThreshold: "Number of similar fraud flags needed to trigger repeated behavior detection.",
    minDistanceKm: "Minimum distance (km) considered impossible to travel between sessions given the time gap.",
    minTravelTimeMinutes: "Minimum travel time (minutes) required for the distance between consecutive sessions."
  };

  // Rule mapping for each threshold
  const ruleAffects: Record<keyof FraudThresholds, string[]> = {
    maxVolumeKwh: ['High Volume'],
    maxDurationMinutes: ['High Volume'],
    minCostThreshold: ['Cost-Volume Mismatch'],
    minTimeGapMinutes: ['Consecutive Sessions'],
    behaviorThreshold: ['Repeated Behavior'],
    minDistanceKm: ['Impossible Travel'],
    minTravelTimeMinutes: ['Impossible Travel']
  };

  // Rules for the overview section
  const detectionRules = [
    {
      title: 'High Volume',
      description: 'Detects sessions with abnormally high energy consumption that could indicate meter tampering or bypass.',
      thresholds: ['Max Volume (kWh)', 'Max Duration (minutes)']
    },
    {
      title: 'Cost-Volume Mismatch',
      description: 'Flags sessions with unusually high cost but low energy consumption, which may indicate pricing manipulation.',
      thresholds: ['Min Cost Threshold (€)']
    },
    {
      title: 'Consecutive Sessions',
      description: 'Identifies multiple charging sessions at the same station with implausibly short gaps.',
      thresholds: ['Min Time Gap (minutes)']
    },
    {
      title: 'Repeated Behavior',
      description: 'Detects patterns of similar fraud flags across multiple sessions from the same user.',
      thresholds: ['Behavior Threshold']
    },
    {
      title: 'Impossible Travel',
      description: 'Flags consecutive sessions at different stations that are too far apart for the time gap.',
      thresholds: ['Min Distance (km)', 'Min Travel Time (minutes)']
    }
  ];

  return (
    <div className="settings-container">
      <h1>Fraud Detection Settings</h1>
      <div className="settings-intro">
        Configure detection thresholds. Changes will trigger a new fraud analysis.
      </div>

      <div className="rules-overview">
        <h2>Detection Rules</h2>
        <div className="rules-list">
          {detectionRules.map((rule, index) => (
            <div className="rule-card" key={index}>
              <div className="rule-header">
                <h3>{rule.title}</h3>
              </div>
              <div className="rule-description">
                {rule.description}
              </div>
              <div className="rule-thresholds">
                <div className="thresholds-title">Thresholds:</div>
                <ul>
                  {rule.thresholds.map((threshold, idx) => (
                    <li key={idx}>{threshold}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="thresholds-section">
        <h2>Adjust Thresholds</h2>
        <form onSubmit={handleSubmit}>
          {Object.entries(thresholds).map(([key, value]) => (
            <div className="threshold-group" key={key}>
              <div className="threshold-header">
                <h3>{formatLabel(key)}</h3>
                <div className="threshold-rules">
                  <span className="affects-label">Affects:</span>
                  {ruleAffects[key as keyof FraudThresholds].map((rule, idx) => (
                    <span className="rule-name" key={idx}>{rule}</span>
                  ))}
                </div>
              </div>
              <div className="threshold-description">
                {thresholdDescriptions[key as keyof FraudThresholds]}
              </div>
              <div className="threshold-control">
                <input
                  type="number"
                  name={key}
                  value={value}
                  onChange={handleChange}
                  step={key.includes('Volume') || key.includes('Distance') || key.includes('Cost') ? '0.1' : '1'}
                  min="0"
                />
              </div>
            </div>
          ))}

          <button type="submit" disabled={isSaving} className="save-button">
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>

          {saveStatus && <div className="status-message">{saveStatus}</div>}
        </form>
      </div>
    </div>
  );
};

const formatLabel = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .replace('Kwh', '(kWh)')
    .replace('Km', '(km)')
    .replace('€', '(€)')
    .replace('Minutes', '(minutes)');
};

export default Settings;