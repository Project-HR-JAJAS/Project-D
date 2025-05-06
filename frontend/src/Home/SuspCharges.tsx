import React, { useEffect, useState } from 'react';
import { getDataTotal } from './SuspCharges.api';
import './SuspCharges.css';  // Make sure this is imported to apply styles.

export const SuspCharges: React.FC = () => {
    const [total, setTotal] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getDataTotal()
            .then(setTotal)
            .catch(() => setError('Failed to load suspicious total'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="susp-charges-box">Loading suspicious charges...</div>;
    if (error) return <div className="susp-charges-box">{error}</div>;

    return (
        <div className="susp-charges-box">
            <h3>Total Suspicious Charges</h3>
            <p className="total-number">{total}</p>
        </div>
    );
};
