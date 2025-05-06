import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDataTable } from './DataTable.api';
import './DataTable.css';

const DataTablePreview: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPreview = async () => {
            setLoading(true);
            setError(null);
            try {
                const { results } = await fetchDataTable(1, null, null, 6); // page 1, 6 items
                setData(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };
        fetchPreview();
    }, []);

    if (loading) return <div>Laden...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!Array.isArray(data) || data.length === 0) return <div>Geen data gevonden.</div>;

    return (
        <div className="data-table-container" style={{ maxWidth: 900, margin: '0 auto', padding: 0 }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: 10 }}>Laatste transacties</h2>
            <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>CDR ID</th>
                            <th>Authentication ID</th>
                            <th>Duration</th>
                            <th>Volume</th>
                            <th>Charge Point ID</th>
                            <th>Calculated Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => (
                            <tr key={item.id}>
                                <td>{item.id}</td>
                                <td>{item.authentication_id}</td>
                                <td>{item.duration}</td>
                                <td className="text-right">{Number(item.volume).toFixed(3)}</td>
                                <td>{item.charge_point_id}</td>
                                <td className="text-right">{Number(item.calculated_cost).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{ textAlign: 'right', marginTop: 10 }}>
                <button className="pagination-button" onClick={() => navigate('/data-table')}>
                    Zie meer
                </button>
            </div>
        </div>
    );
};

export default DataTablePreview; 