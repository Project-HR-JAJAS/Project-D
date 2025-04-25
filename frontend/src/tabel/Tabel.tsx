import React, { useEffect, useState } from "react";
import './TabelForm.css';
import { getAllTabelData, TabelData } from "./Tabel.api";
import { useNavigate } from "react-router-dom";

export const TabelForm: React.FC = () => {
    const [data, setData] = useState<TabelData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getAllTabelData();
                setData(data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setError("Failed to load data");
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const handleRowClick = (item: TabelData) => {
        navigate(`/details/${item.CDR_ID}`);
    };

    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const visibleData = data.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    if (loading) return <div>Loading data...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="tabel-form">
            <h2>Tabel</h2>
            <div className="pagination-info aligned-right">
                Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, data.length)} of {data.length} records
            </div>
            <table className="tabel-table">
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
                    {visibleData.map((item) => (
                        <tr key={item.CDR_ID} onClick={() => handleRowClick(item)} className="clickable-row">
                            <td>{item.CDR_ID}</td>
                            <td>{item.Authentication_ID ?? 'null'}</td>
                            <td>{item.Duration}</td>
                            <td>{item.Volume}</td>
                            <td>{item.Charge_Point_ID}</td>
                            <td>{item.Calculated_Cost}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="pagination-info">
                Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, data.length)} of {data.length} records
            </div>
            <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                    ))
                    .reduce((acc: (number | "...")[], page, i, arr) => {
                        if (i > 0 && page - (arr[i - 1] as number) > 1) {
                            acc.push("...");
                        }
                        acc.push(page);
                        return acc;
                    }, [])
                    .map((page, index) =>
                        page === "..." ? (
                            <span key={`ellipsis-${index}`} className="page-number-ellipsis">...</span>
                        ) : (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`page-number-button ${page === currentPage ? "active" : ""}`}
                            >
                                {page}
                            </button>
                        )
                    )}
            </div>
        </div>
    );
};
