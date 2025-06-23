interface ChargePointStat {
    Charge_Point_ID: string;
    Charge_Point_Country: string;
    transaction_count: number;
    total_volume: number;
    total_cost: number;
}

const PAGE_SIZE = 20;

export const fetchChargePointStats = async (): Promise<ChargePointStat[]> => {
    const response = await fetch('http://localhost:8000/api/charge-point-stats-all');
    if (!response.ok) {
        throw new Error('Failed to fetch data');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
};

export const fetchAllFraudStats = async () => {
  const res = await fetch('http://localhost:8000/api/all-charge-point-ids-with-fraud');
  if (!res.ok) throw new Error('Failed to fetch fraud stats');
  return await res.json();
};

export const fetchStatsByFraudType = async (reason: string) => {
  const encodedReason = encodeURIComponent(reason);
  const res = await fetch(`http://localhost:8000/api/all-charge-point-ids-with-specific-fraud/${encodedReason}`);
  if (!res.ok) throw new Error(`Failed to fetch stats for reason: ${reason}`);
  return await res.json();
};

export { PAGE_SIZE };