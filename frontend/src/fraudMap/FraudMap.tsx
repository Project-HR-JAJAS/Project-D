import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './FraudMap.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Link } from 'react-router-dom';
import { useFraudMapContext } from './FraudMapContext';

// Fix for default marker icons in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom marker icons based on fraud count
const createCustomIcon = (fraudCount: number) => {
    let color = '#2ecc71'; // Green for low fraud
    if (fraudCount > 10) {
        color = '#e74c3c'; // Red for high fraud
    } else if (fraudCount > 5) {
        color = '#f1c40f'; // Yellow for medium fraud
    }

    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 100%; height: 100%; border-radius: 50%; border: 2px solid white;"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });
};

interface FraudLocation {
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

const MapController: React.FC<{ center: [number, number] }> = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
};

interface FraudMapProps {
    cityFilter: string;
    dateRange: {
        start: string;
        end: string;
    };
    timeRange: {
        start: string;
        end: string;
    };
    refreshTrigger?: number;
}

const FraudMap: React.FC<FraudMapProps> = ({ cityFilter, dateRange, timeRange, refreshTrigger = 0 }) => {
    const { locations, loading, error, lastUpdated, refresh } = useFraudMapContext();

    // Filter locations based on city, date range, and time range
    const filteredLocations = locations.filter(location => {
        const matchesCity = !cityFilter || 
            location.City.toLowerCase().includes(cityFilter.toLowerCase());
        
        const lastDetectedDate = new Date(location.Last_Detected_Date);
        const matchesDateRange = (!dateRange.start || !dateRange.end) || 
            (lastDetectedDate >= new Date(dateRange.start) && 
             lastDetectedDate <= new Date(dateRange.end));
        
        const matchesTimeRange = (!timeRange.start || !timeRange.end) || 
            (lastDetectedDate.getHours() >= parseInt(timeRange.start.split(':')[0]) && 
             lastDetectedDate.getHours() <= parseInt(timeRange.end.split(':')[0]));
        
        return matchesCity && matchesDateRange && matchesTimeRange;
    });

    // Calculate center point of filtered markers
    const center = filteredLocations.length > 0
        ? {
            lat: filteredLocations.reduce((sum, loc) => sum + loc.Latitude, 0) / filteredLocations.length,
            lng: filteredLocations.reduce((sum, loc) => sum + loc.Longitude, 0) / filteredLocations.length,
        }
        : { lat: 52.3676, lng: 4.9041 }; // Default to Amsterdam if no locations

    const totalFraudCount = filteredLocations.reduce((sum, loc) => sum + loc.Fraud_Count, 0);

    return (
        <div className="fraud-map-container">
            <div className="fraud-map-header">
                <div className="fraud-map-stats">
                    <h2>Fraud Locations Map</h2>
                    <p>Total Locations: {filteredLocations.length}</p>
                    <p>Total Fraud Incidents: {totalFraudCount}</p>
                    {lastUpdated && (
                        <p className="last-updated">
                            Last updated: {lastUpdated.toLocaleString()}
                        </p>
                    )}
                </div>
                <div className="fraud-map-legend">
                    <div className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: '#2ecc71' }}></div>
                        <span>Low Fraud (1-5)</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: '#f1c40f' }}></div>
                        <span>Medium Fraud (6-10)</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: '#e74c3c' }}></div>
                        <span>High Fraud (10+)</span>
                    </div>
                </div>
                <button 
                    className="refresh-button"
                    onClick={refresh}
                    disabled={loading}
                >
                    {loading ? 'Refreshing...' : 'Refresh Data'}
                </button>
            </div>

            {loading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Loading fraud locations...</p>
                </div>
            )}

            {error && (
                <div className="error-overlay">
                    <p>Error: {error}</p>
                    <button onClick={refresh}>Retry</button>
                </div>
            )}

            <div className="map-container">
                <MapContainer
                    center={[center.lat, center.lng]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <MapController center={[center.lat, center.lng]} />
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MarkerClusterGroup>
                        {filteredLocations.map((location) => (
                            <Marker
                                key={location.Location_ID}
                                position={[location.Latitude, location.Longitude]}
                                icon={createCustomIcon(location.Fraud_Count)}
                            >
                                <Popup>
                                    <div className="popup-content">
                                        <h3>Fraud Location Details</h3>
                                        <p><strong>Charge Point ID:</strong> {location.Charge_Point_ID}</p>
                                        {location.CDR_ID && (
                                            <p><strong>CDR ID:</strong> <Link to={`/cdr-details/${location.CDR_ID}`}>{location.CDR_ID}</Link></p>
                                        )}
                                        <p><strong>Address:</strong> {location.Address}</p>
                                        <p><strong>City:</strong> {location.City}</p>
                                        <p><strong>Country:</strong> {location.Country}</p>
                                        <p><strong>Fraud Count:</strong> {location.Fraud_Count}</p>
                                        <p><strong>Last Detected:</strong> {new Date(location.Last_Detected_Date).toLocaleString()}</p>
                                        <p><strong>Fraud Reasons:</strong> {location.reasons || 'N/A'}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MarkerClusterGroup>
                </MapContainer>
            </div>
        </div>
    );
};

export default FraudMap; 