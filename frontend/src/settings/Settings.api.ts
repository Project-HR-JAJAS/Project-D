export interface FraudThresholds {
  maxVolumeKwh: number;
  maxDurationMinutes: number;
  minCostThreshold: number;
  minTimeGapMinutes: number;
  behaviorThreshold: number;
  minDistanceKm: number;
  minTravelTimeMinutes: number;
}

const API_URL = 'http://localhost:8000/api/settings/fraud-thresholds';

export const getFraudThresholds = async (): Promise<FraudThresholds> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch thresholds');
  }
  return response.json();
};

export const saveFraudThresholds = async (thresholds: FraudThresholds): Promise<boolean> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(thresholds),
  });

  return response.ok;
};
