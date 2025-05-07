import React, { useEffect, useState } from 'react';
import { fetchDataTable } from './DataTable.api';
import './DataTable.css';

interface DataTableItem {
    id: number;
    authentication_id: string;
    duration: string;
    volume: number;
    charge_point_id: string;
    calculated_cost: number;
}

const DataTablePreview: React.FC = () => {
    const [data, setData] = useState<DataTableItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const allData = await fetchDataTable();
                // Take only the first 6 items for preview
                setData(allData.slice(0, 6));
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <div>Laden...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="data-table-container">
            <div className="userstats-search-wrapper">
                <h2>Data Tabel Preview</h2>
            </div>
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
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="no-data-row">
                                    Geen data gevonden
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr key={item.id} className="clickable-row">
                                    <td>{item.id}</td>
                                    <td>{item.authentication_id}</td>
                                    <td>{item.duration}</td>
                                    <td className="text-right">{item.volume}</td>
                                    <td>{item.charge_point_id}</td>
                                    <td className="text-right">{item.calculated_cost}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataTablePreview; 