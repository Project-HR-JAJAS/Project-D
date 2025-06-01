import React, { useState, useEffect } from 'react';
import './Settings.css';

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
    minTravelTimeMinutes: 15
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/settings/fraud-thresholds');
        const data = await response.json();
        if (response.ok) {
          setThresholds(data);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    fetchThresholds();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setThresholds(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const response = await fetch('http://localhost:8000/api/settings/fraud-thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(thresholds)
      });

      if (response.ok) {
        setSaveStatus('Settings saved successfully! Fraud detection running...');

        // Optional: Wait a moment then refresh fraud data
        setTimeout(() => {
          // Add your fraud data refresh logic here
          console.log('Fraud detection should be complete now');
        }, 5000);
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
        <div className="form-group">
          <label>Max Volume (kWh)</label>
          <input
            type="number"
            name="maxVolumeKwh"
            value={thresholds.maxVolumeKwh}
            onChange={handleChange}
            step="0.1"
            min="0"
          />
        </div>

        <div className="form-group">
          <label>Max Duration (minutes)</label>
          <input
            type="number"
            name="maxDurationMinutes"
            value={thresholds.maxDurationMinutes}
            onChange={handleChange}
            min="0"
          />
        </div>

        <div className="form-group">
          <label>Min Cost Threshold (€)</label>
          <input
            type="number"
            name="minCostThreshold"
            value={thresholds.minCostThreshold}
            onChange={handleChange}
            step="0.1"
            min="0"
          />
        </div>

        <div className="form-group">
          <label>Min Time Gap (minutes)</label>
          <input
            type="number"
            name="minTimeGapMinutes"
            value={thresholds.minTimeGapMinutes}
            onChange={handleChange}
            min="0"
          />
        </div>

        <div className="form-group">
          <label>Behavior Threshold (count)</label>
          <input
            type="number"
            name="behaviorThreshold"
            value={thresholds.behaviorThreshold}
            onChange={handleChange}
            min="1"
          />
        </div>

        <div className="form-group">
          <label>Min Distance (km)</label>
          <input
            type="number"
            name="minDistanceKm"
            value={thresholds.minDistanceKm}
            onChange={handleChange}
            step="0.1"
            min="0"
          />
        </div>

        <div className="form-group">
          <label>Min Travel Time (minutes)</label>
          <input
            type="number"
            name="minTravelTimeMinutes"
            value={thresholds.minTravelTimeMinutes}
            onChange={handleChange}
            min="0"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="save-button"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>

        {saveStatus && <div className="status-message">{saveStatus}</div>}
      </form>
    </div>
  );
};

export default Settings;