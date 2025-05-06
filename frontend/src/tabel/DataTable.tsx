import React, { useEffect, useState } from 'react';
import { fetchDataTable, PAGE_SIZE } from './DataTable.api';
import './DataTable.css';

type DataTableItem = Parameters<typeof fetchDataTable>[0] extends number ? Awaited<ReturnType<typeof fetchDataTable>>['results'][number] : never;

const DataTable: React.FC = () => {
    const [data, setData] = useState<DataTableItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [showInput, setShowInput] = useState<{left: boolean, right: boolean}>({left: false, right: false});
    const [inputValue, setInputValue] = useState('');
    const [sortConfig, setSortConfig] = useState<{key: 'volume' | 'calculated_cost' | null, direction: 'asc' | 'desc' | null}>({key: null, direction: null});

    const fetchData = async (page: number, sortKey: 'volume' | 'calculated_cost' | null, sortDir: 'asc' | 'desc' | null) => {
        setLoading(true);
        setError(null);
        try {
            const { results, total } = await fetchDataTable(page, sortKey, sortDir);
            setData(results);
            setTotal(total);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(currentPage, sortConfig.key, sortConfig.direction);
    }, [currentPage, sortConfig]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const handlePageClick = (page: number) => {
        if (page !== currentPage && page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            setShowInput({left: false, right: false});
            setInputValue('');
        }
    };

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

    const handleSort = (key: 'volume' | 'calculated_cost') => {
        setSortConfig((prev) => {
            if (prev.key !== key) {
                return { key, direction: 'asc' };
            }
            if (prev.direction === 'asc') {
                return { key, direction: 'desc' };
            }
            if (prev.direction === 'desc') {
                return { key: null, direction: null };
            }
            return { key, direction: 'asc' };
        });
        setCurrentPage(1);
    };

    if (loading) return <div>Laden...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!Array.isArray(data) || data.length === 0) return <div>Geen data gevonden.</div>;

    return (
        <div className="data-table-container">
            <h2>Data Tabel</h2>
            <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>CDR ID</th>
                            <th>Authentication ID</th>
                            <th>Duration</th>
                            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('volume')} className="sortable-header">
                                Volume {sortConfig.key === 'volume' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                            </th>
                            <th>Charge Point ID</th>
                            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('calculated_cost')} className="sortable-header">
                                Calculated Cost {sortConfig.key === 'calculated_cost' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                            </th>
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
            <div className="pagination-container">
                <button 
                    className="pagination-button"
                    onClick={() => handlePageClick(currentPage - 1)} 
                    disabled={currentPage === 1}
                >
                    Vorige
                </button>
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
                                className="pagination-input"
                                autoFocus
                            />
                        ) : (
                            <span 
                                key={idx} 
                                className="pagination-ellipsis" 
                                onClick={() => handleEllipsisClick('left')}
                            >
                                ...
                            </span>
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
                                className="pagination-input"
                                autoFocus
                            />
                        ) : (
                            <span 
                                key={idx} 
                                className="pagination-ellipsis" 
                                onClick={() => handleEllipsisClick('right')}
                            >
                                ...
                            </span>
                        );
                    }
                    return (
                        <button
                            key={page}
                            onClick={() => handlePageClick(Number(page))}
                            className={`pagination-button ${page === currentPage ? 'active' : ''}`}
                        >
                            {page}
                        </button>
                    );
                })}
                <button 
                    className="pagination-button"
                    onClick={() => handlePageClick(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                >
                    Volgende
                </button>
            </div>
        </div>
    );
};

export default DataTable; 