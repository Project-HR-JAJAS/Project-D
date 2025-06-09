export const fetchAllFraudStats = async () => {
  const res = await fetch('http://localhost:8000/api/all-authentication-ids-with-fraud');
  if (!res.ok) throw new Error('Failed to fetch fraud stats');
  return await res.json();
};

export const fetchStatsByFraudType = async (reason: string) => {
  const encodedReason = encodeURIComponent(reason);
  const res = await fetch(`http://localhost:8000/api/all-authentication-ids-with-specific-fraud/${encodedReason}`);
  if (!res.ok) throw new Error(`Failed to fetch stats for reason: ${reason}`);
  return await res.json();
};