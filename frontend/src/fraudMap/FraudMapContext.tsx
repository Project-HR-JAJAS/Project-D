import React, { createContext, useContext, useState, useCallback } from 'react';

export interface FraudLocation {
    Location_ID: string;
    Charge_Point_ID: string;
    Latitude: number;
    Longitude: number;
    Address: string;
    City: string;
    Country: string;
    Fraud_Count: number;
    Last_Detected_Date: string;
    CDR_ID?: string;
    reasons?: string;
}

interface FraudMapContextType {
    locations: FraudLocation[];
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;
    refresh: () => void;
}

const FraudMapContext = createContext<FraudMapContextType | undefined>(undefined);

const STORAGE_KEY = 'fraudMapLocations';
const STORAGE_DATE_KEY = 'fraudMapLocationsLastUpdated';

export const FraudMapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [locations, setLocations] = useState<FraudLocation[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
        const saved = localStorage.getItem(STORAGE_DATE_KEY);
        return saved ? new Date(saved) : null;
    });
    const [hasFetched, setHasFetched] = useState(!!localStorage.getItem(STORAGE_KEY));

    const fetchLocations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/api/fraud-locations');
            if (!response.ok) {
                throw new Error('Failed to fetch fraud locations');
            }
            const data = await response.json();
            setLocations(Array.isArray(data) ? data : []);
            setLastUpdated(new Date());
            setHasFetched(true);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            localStorage.setItem(STORAGE_DATE_KEY, new Date().toISOString());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, []);

    // Only fetch on first mount if not already in storage
    React.useEffect(() => {
        if (!hasFetched) {
            fetchLocations();
        }
    }, [hasFetched, fetchLocations]);

    const refresh = useCallback(() => {
        fetchLocations();
    }, [fetchLocations]);

    return (
        <FraudMapContext.Provider value={{ locations, loading, error, lastUpdated, refresh }}>
            {children}
        </FraudMapContext.Provider>
    );
};

export const useFraudMapContext = () => {
    const ctx = useContext(FraudMapContext);
    if (!ctx) throw new Error('useFraudMapContext must be used within a FraudMapProvider');
    return ctx;
}; 