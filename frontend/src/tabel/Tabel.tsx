import React, { useEffect, useState } from "react";
import './TabelForm.css';
import { getAllTabelData, TabelData } from "./Tabel.api";
import { useNavigate } from "react-router-dom";

export const TabelForm: React.FC = () => {
    const [data, setData] = useState<TabelData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<keyof TabelData | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [showInput, setShowInput] = useState<{left: boolean, right: boolean}>({left: false, right: false});
    const [inputValue, setInputValue] = useState('');
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

    const handleSort = (field: keyof TabelData) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const sortedData = [...data].sort((a, b) => {
        if (!sortField) return 0;
        const valA = a[sortField] ?? 0;
        const valB = b[sortField] ?? 0;

        if (typeof valA === "number" && typeof valB === "number") {
            return sortDirection === "asc" ? valA - valB : valB - valA;
        }
        return 0;
    });

    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const visibleData = sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Google-like advanced pagination logic
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 9) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1, 2, 3);
            if (currentPage > 5) pages.push('left-ellipsis');
            let start = Math.max(4, currentPage - 1);
            let end = Math.min(totalPages - 3, currentPage + 1);
            for (let i = start; i <= end; i++) {
                if (i > 3 && i < totalPages - 2) pages.push(i);
            }
            if (currentPage < totalPages - 4) pages.push('right-ellipsis');
            pages.push(totalPages - 2, totalPages - 1, totalPages);
        }
        return pages;
    };

    const handleEllipsisClick = (side: 'left' | 'right') => {
        setShowInput({left: side === 'left', right: side === 'right'});
        setInputValue('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        setInputValue(val);
    };

    const handleInputSubmit = (side: 'left' | 'right') => {
        const page = Number(inputValue);
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            setShowInput({left: false, right: false});
            setInputValue('');
        }
    };

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
                        <th> Duration</th>
                        <th onClick={() => handleSort("Volume")} className="sortable-header">
                            Volume {sortField === "Volume" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                        </th>
                        <th>Charge Point ID</th>
                        <th onClick={() => handleSort("Calculated_Cost")} className="sortable-header">
                            Calculated Cost {sortField === "Calculated_Cost" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {visibleData.map((item) => (
                        <tr key={item.CDR_ID} onClick={() => handleRowClick(item)} className="clickable-row">
                            <td>{item.CDR_ID}</td>
                            <td>{item.Authentication_ID ?? ''}</td>
                            <td>{item.Duration}</td>
                            <td>{item.Volume}</td>
                            <td>{item.Charge_Point_ID}</td>
                            <td>{item.Calculated_Cost}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="pagination-info aligned-right">
                Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, data.length)} of {data.length} records
            </div>
            <div className="pagination">
                <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="page-number-button">Vorige</button>
                {getPageNumbers().map((page, idx) => {
                    if (page === 'left-ellipsis') {
                        return showInput.left ? (
                            <input
                                key={idx}
                                type="text"
                                value={inputValue}
                                onChange={handleInputChange}
                                onBlur={() => setShowInput({left: false, right: false})}
                                onKeyDown={e => { if (e.key === 'Enter') handleInputSubmit('left'); }}
                                style={{ width: 40, textAlign: 'center', border: '1px solid #1976d2', borderRadius: 4 }}
                                autoFocus
                            />
                        ) : (
                            <span key={idx} className="page-number-ellipsis" style={{ cursor: 'pointer' }} onClick={() => handleEllipsisClick('left')}>...</span>
                        );
                    }
                    if (page === 'right-ellipsis') {
                        return showInput.right ? (
                            <input
                                key={idx}
                                type="text"
                                value={inputValue}
                                onChange={handleInputChange}
                                onBlur={() => setShowInput({left: false, right: false})}
                                onKeyDown={e => { if (e.key === 'Enter') handleInputSubmit('right'); }}
                                style={{ width: 40, textAlign: 'center', border: '1px solid #1976d2', borderRadius: 4 }}
                                autoFocus
                            />
                        ) : (
                            <span key={idx} className="page-number-ellipsis" style={{ cursor: 'pointer' }} onClick={() => handleEllipsisClick('right')}>...</span>
                        );
                    }
                    return (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(Number(page))}
                            className={`page-number-button ${page === currentPage ? "active" : ""}`}
                            style={page === currentPage ? {
                                fontWeight: 'bold',
                                background: '#1976d2',
                                color: 'white',
                                border: '1px solid #1976d2',
                                borderRadius: '4px',
                                margin: '0 2px',
                                cursor: 'default',
                                pointerEvents: 'none',
                            } : {}}
                        >{page}</button>
                    );
                })}
                <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="page-number-button">Volgende</button>
            </div>
        </div>
    );
};
