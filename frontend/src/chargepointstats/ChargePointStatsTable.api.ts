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

export { PAGE_SIZE };