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

    const handleResetFilters = () => {
        setSelectedCity('');
        setDateRange({ start: '', end: '' });
        setTimeRange({ start: '', end: '' });
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
            
            <FraudMap 
                cityFilter={selectedCity}
                dateRange={dateRange}
                timeRange={timeRange}
            />
        </div>
    );
};

export default FraudMapPage; 