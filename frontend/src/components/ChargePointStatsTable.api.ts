interface ChargePointStat {
    Charge_Point_ID: string;
    Charge_Point_Country: string;
    transaction_count: number;
    total_volume: number;
    total_cost: number;
}

const PAGE_SIZE = 20;

export const fetchChargePointStats = async (page: number): Promise<{ results: ChargePointStat[], total: number }> => {
    const response = await fetch(`http://localhost:8000/api/charge-point-stats?page=${page}&page_size=${PAGE_SIZE}`);
    if (!response.ok) {
        throw new Error('Failed to fetch statistics');
    }
    const data = await response.json();
    return {
        results: Array.isArray(data.results) ? data.results : [],
        total: typeof data.total === 'number' ? data.total : 0
    };
};

export { PAGE_SIZE };