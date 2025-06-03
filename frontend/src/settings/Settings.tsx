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
        setTimeout(() => console.log('Fraud detection should be complete now'), 5000);
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

  return (
    <div className="settings-container">
      <h1>Fraud Detection Settings</h1>

      <form onSubmit={handleSubmit} className="threshold-form">
        {Object.entries(thresholds).map(([key, value]) => (
          <div className="form-group" key={key}>
            <label>{formatLabel(key)}</label>
            <input
              type="number"
              name={key}
              value={value}
              onChange={handleChange}
              step={key.includes('Volume') || key.includes('Distance') || key.includes('Cost') ? '0.1' : '1'}
              min="0"
            />
          </div>
        ))}

        <button type="submit" disabled={isSaving} className="save-button">
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>

        {saveStatus && <div className="status-message">{saveStatus}</div>}
      </form>
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
