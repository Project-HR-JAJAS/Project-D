import React from 'react';
import FraudMap from './FraudMap';
import './FraudMapPage.css';

const FraudMapPage: React.FC = () => {
    return (
        <div className="fraud-map-page">
            <h1>Fraud Locations Map</h1>
            <p>This map shows all charge points where fraud has been detected.</p>
            <FraudMap />
        </div>
    );
};

export default FraudMapPage; 