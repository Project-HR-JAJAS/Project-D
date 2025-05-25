import React, { useEffect, useState } from 'react';
import { fetchDataTable } from './DataTable.api';
import { useNavigate } from 'react-router-dom';
import '../css/UniversalTableCss.css';

interface DataTableItem {
    id: string;
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
    const navigate = useNavigate();

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

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="table-preview-outer">
            <div className="table-search-wrapper">
                <h2 className="table-preview-title">Recent Suspicious Transactions</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table className="table-form table-preview-table">
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
                                    No suspicious transactions found.
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr 
                                    key={item.id} 
                                    onClick={() => navigate(`/cdr-details/${item.id}`)} 
                                    className="clickable-row"
                                >
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