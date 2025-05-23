import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchDataTable } from '../tabel/DataTable.api';
import { fetchChargePointStats } from '../chargepointstats/ChargePointStatsTable.api';

interface DataTableItem {
    id: string;
    authentication_id: string;
    duration: string;
    volume: number;
    charge_point_id: string;
    calculated_cost: number;
}

interface ChargePointStat {
    Charge_Point_ID: string;
    Charge_Point_Country: string;
    transaction_count: number;
    total_volume: number;
    total_cost: number;
}

interface UserStat {
    Authentication_ID: string;
    TransactionCount: number;
    TotalVolume: number;
    TotalCost: number;
}

export interface OverlappingSession {
    CDR_ID: string;
    Authentication_ID: string;
    Start_datetime: string;
    End_datetime: string;
    Charge_Point_City: string;
    Volume: number;
    OverlappingCount?: number;
    Calculated_Cost: number;
}

interface DataContextType {
    dataTableItems: DataTableItem[];
    chargePointStats: ChargePointStat[];
    userStats: UserStat[];
    overlappingSessions: OverlappingSession[];
    loading: {
        dataTable: boolean;
        chargePoints: boolean;
        userStats: boolean;
        overlappingSessions: boolean;
    };
    error: {
        dataTable: string | null;
        chargePoints: string | null;
        userStats: string | null;
        overlappingSessions?: string;
    };
    refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [dataTableItems, setDataTableItems] = useState<DataTableItem[]>([]);
    const [chargePointStats, setChargePointStats] = useState<ChargePointStat[]>([]);
    const [userStats, setUserStats] = useState<UserStat[]>([]);
    const [overlappingSessions, setOverlappingSessions] = useState<OverlappingSession[]>([]);
    const [loading, setLoading] = useState({
        dataTable: true,
        chargePoints: true,
        userStats: true,
        overlappingSessions: false,
    });
    const [error, setError] = useState({
        dataTable: null as string | null,
        chargePoints: null as string | null,
        userStats: null as string | null,
        overlappingSessions: undefined as string | undefined,
    });

    const loadData = async () => {
        // Load DataTable data
        setLoading(prev => ({ ...prev, dataTable: true }));
        try {
            const data = await fetchDataTable();

            const cleanedData = data.map(item => ({
                ...item,
                volume: parseFloat((item.volume ?? '0').toString().replace(',', '.')),
                calculated_cost: parseFloat((item.calculated_cost ?? '0').toString().replace(',', '.')),
            }));

            setDataTableItems(cleanedData);
            setError(prev => ({ ...prev, dataTable: null }));
        } catch (err) {
            setError(prev => ({ 
                ...prev, 
                dataTable: err instanceof Error ? err.message : 'An error occurred' 
            }));
        } finally {
            setLoading(prev => ({ ...prev, dataTable: false }));
        }

        // Load ChargePoint stats
        setLoading(prev => ({ ...prev, chargePoints: true }));
        try {
            const stats = await fetchChargePointStats();
            setChargePointStats(stats);
            setError(prev => ({ ...prev, chargePoints: null }));
        } catch (err) {
            setError(prev => ({ 
                ...prev, 
                chargePoints: err instanceof Error ? err.message : 'An error occurred' 
            }));
        } finally {
            setLoading(prev => ({ ...prev, chargePoints: false }));
        }

        // Load User stats
        setLoading(prev => ({ ...prev, userStats: true }));
        try {
            const response = await fetch('http://localhost:8000/api/user-stats');
            if (!response.ok) {
                throw new Error('Failed to fetch user stats');
            }
            const stats = await response.json();
            setUserStats(stats);
            setError(prev => ({ ...prev, userStats: null }));
        } catch (err) {
            setError(prev => ({ 
                ...prev, 
                userStats: err instanceof Error ? err.message : 'An error occurred' 
            }));
        } finally {
            setLoading(prev => ({ ...prev, userStats: false }));
        }

        // Load Overlapping Sessions
        setLoading(prev => ({ ...prev, overlappingSessions: true }));
        try {
            const response = await fetch('http://localhost:8000/api/overlapping-sessions');
            if (!response.ok) {
                throw new Error('Failed to fetch overlapping sessions');
            }
            const data = await response.json();

            const cleanedData: OverlappingSession[] = data.map((item: OverlappingSession) => ({
                ...item,
                Volume: parseFloat((item.Volume ?? '0').toString().replace(',', '.')),
                OverlappingCount: item.OverlappingCount !== undefined ? Number(item.OverlappingCount) : undefined,
                Calculated_Cost: parseFloat((item.Calculated_Cost ?? '0').toString().replace(',', '.')),
            }));

            setOverlappingSessions(Array.isArray(cleanedData) ? cleanedData : []);
            setError(prev => ({ ...prev, overlappingSessions: undefined }));
        } catch (err) {
            setError(prev => ({
                ...prev,
                overlappingSessions: err instanceof Error ? err.message : 'An error occurred'
            }));
        } finally {
            setLoading(prev => ({ ...prev, overlappingSessions: false }));
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const value = {
        dataTableItems,
        chargePointStats,
        userStats,
        overlappingSessions,
        loading,
        error,
        refreshData: loadData
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}; 