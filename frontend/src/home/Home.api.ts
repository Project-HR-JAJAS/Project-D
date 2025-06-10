export interface ChargeData {
    TimeRange: string;
    TotalCharges: number;
}

export async function fetchChargeData(): Promise<ChargeData[]> {
    try {
        const res = await fetch('http://localhost:8000/api/charge-counts');
        const data = await res.json();

        const timeRanges = ['0000-0900', '0900-1300', '1300-1700', '1700-2100', '2100-0000'];
        const completeData = timeRanges.map(tr =>
            data.find((item: ChargeData) => item.TimeRange === tr) || 
            { TimeRange: tr, TotalCharges: 0 }
        );

        return completeData;
    } catch (error) {
        console.error('Error fetching charge data:', error);
        return [];
    }
}


export interface FraudReasonData {
    total_cases: number;
    reason_counts: Record<string, number>;
    reason_percentages: Record<string, number>;
}

export async function fetchFraudReasons(reason: string): Promise<FraudReasonData[]> {
    try {
        const res = await fetch(`http://localhost:8000/api/fraud-reasons%?reason=${reason}`);
        const data = await res.json();
        return [data];
    } catch (error) {
        console.error('Error fetching fraud reasons:', error);
        return [];
    }
}