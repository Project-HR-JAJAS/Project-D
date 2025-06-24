import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchChargePointStats } from './ChargePointStatsTable.api';

interface ChargePointStat {
    Charge_Point_ID: string;
    Charge_Point_Country: string;
    transaction_count: number;
    total_volume: number;
    total_cost: number;
}

interface ChargePointStatsContextType {
    stats: ChargePointStat[];
    loading: boolean;
    error: string | null;
}

const ChargePointStatsContext = createContext<ChargePointStatsContextType | undefined>(undefined);

export const ChargePointStatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [stats, setStats] = useState<ChargePointStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchChargePointStats()
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to load charge point stats');
                setLoading(false);
            });
    }, []);

    return (
        <ChargePointStatsContext.Provider value={{ stats, loading, error }}>
            {children}
        </ChargePointStatsContext.Provider>
    );
};

export const useChargePointStats = () => {
    const context = useContext(ChargePointStatsContext);
    if (!context) {
        throw new Error('useChargePointStats must be used within a ChargePointStatsProvider');
    }
    return context;
};