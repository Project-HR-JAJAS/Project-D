import React, { useState } from 'react';
import FraudMap from './FraudMap';
import './FraudMapPage.css';

const FraudMapPage: React.FC = () => {
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
        start: '',
        end: ''
    });
    const [timeRange, setTimeRange] = useState<{ start: string; end: string }>({
        start: '',
        end: ''
    });
    const [batchCount, setBatchCount] = useState(20);
    const [batchLoading, setBatchLoading] = useState(false);
    const [batchMessage, setBatchMessage] = useState('');
    const [refreshCounter, setRefreshCounter] = useState(0);

    const handleResetFilters = () => {
        setSelectedCity('');
        setDateRange({ start: '', end: '' });
        setTimeRange({ start: '', end: '' });
    };

    const handleBatchGeocode = async () => {
        setBatchLoading(true);
        setBatchMessage('');
        try {
            const res = await fetch(`http://localhost:8000/api/geocode-batch?count=${batchCount}`, { method: 'POST' });
            const data = await res.json();
            setBatchMessage(data.message || 'Batch geocoding complete!');
            setRefreshCounter(prev => prev + 1);
        } catch (err) {
            setBatchMessage('Error during batch geocoding.');
        } finally {
            setBatchLoading(false);
        }
    };

    return (
        <div className="fraud-map-page">
            <h1>Fraud Locations Map</h1>
            <p>This map shows all charge points where fraud has been detected.</p>
            
            <div className="filter-container">
                <div className="filter-group">
                    <label htmlFor="city-filter">Filter by City:</label>
                    <input
                        id="city-filter"
                        type="text"
                        placeholder="Search city..."
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="filter-input"
                    />
                </div>
                
                <div className="filter-group">
                    <label htmlFor="date-start">Date Range:</label>
                    <div className="date-range-inputs">
                        <input
                            id="date-start"
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="filter-input"
                        />
                        <span>to</span>
                        <input
                            id="date-end"
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="filter-input"
                        />
                    </div>
                </div>

                <div className="filter-group">
                    <label htmlFor="time-start">Time Range:</label>
                    <div className="time-range-inputs">
                        <input
                            id="time-start"
                            type="time"
                            value={timeRange.start}
                            onChange={(e) => setTimeRange(prev => ({ ...prev, start: e.target.value }))}
                            className="filter-input"
                        />
                        <span>to</span>
                        <input
                            id="time-end"
                            type="time"
                            value={timeRange.end}
                            onChange={(e) => setTimeRange(prev => ({ ...prev, end: e.target.value }))}
                            className="filter-input"
                        />
                    </div>
                </div>

                <button 
                    className="reset-button"
                    onClick={handleResetFilters}
                    disabled={!selectedCity && !dateRange.start && !dateRange.end && !timeRange.start && !timeRange.end}
                >
                    Reset Filters
                </button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '24px 0' }}>
                <input
                    type="number"
                    min={1}
                    max={100}
                    value={batchCount}
                    onChange={e => setBatchCount(Number(e.target.value))}
                    style={{ width: 60, marginRight: 12 }}
                    disabled={batchLoading}
                />
                <button onClick={handleBatchGeocode} disabled={batchLoading} style={{ padding: '8px 18px', borderRadius: 6, background: '#3498db', color: '#fff', border: 'none', fontWeight: 500, fontSize: '1rem', cursor: 'pointer' }}>
                    {batchLoading ? 'Processing...' : `Geocode ${batchCount} New Locations`}
                </button>
                {batchMessage && <span style={{ marginLeft: 16 }}>{batchMessage}</span>}
            </div>
            
            <FraudMap 
                cityFilter={selectedCity}
                dateRange={dateRange}
                timeRange={timeRange}
                refreshTrigger={refreshCounter}
            />
        </div>
    );
};

export default FraudMapPage; 