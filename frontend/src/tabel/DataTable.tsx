import React, { useEffect, useState } from 'react';
import { fetchDataTable, PAGE_SIZE } from './DataTable.api';
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

    // Debounce logic
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 1000); // Adjust debounce delay as needed

        return () => clearTimeout(handler);
    }, [searchTerm]);

    const fetchData = async (
        page: number,
        sortKey: 'volume' | 'calculated_cost' | null,
        sortDir: 'asc' | 'desc' | null
    ) => {
        setLoading(true);
        setError(null);
        try {
            const { results, total } = await fetchDataTable(page, sortKey, sortDir, PAGE_SIZE, debouncedSearchTerm); // Use debounced search term
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
    }, [currentPage, sortConfig, debouncedSearchTerm]); // Use debouncedSearchTerm here

    const filteredData = data.filter(item =>
        (item.authentication_id ?? '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) // Use debounced search term
    );

    const sortedData = [...filteredData];
    if (sortConfig.key && sortConfig.direction) {
        sortedData.sort((a, b) => {
            const aVal = sortConfig.key ? a[sortConfig.key] ?? 0 : 0;
            const bVal = sortConfig.key ? b[sortConfig.key] ?? 0 : 0;
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
            }
            return 0;
        });
    }

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const currentItems = sortedData;

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
    // if (!Array.isArray(data) || data.length === 0) return <div>Geen data gevonden.</div>;
    

    return (
        <div className="data-table-container">
            <div className="userstats-search-wrapper">
                <h2>Data Tabel</h2>
                <input
                    type="text"
                    placeholder="Zoek op Authentication ID..."
                    value={searchTerm}
                    onChange={e => {
                        setSearchTerm(e.target.value); // Set search term here
                        setCurrentPage(1); // Reset to page 1 on new search
                    }}
                    className="userstats-search"
                />
            </div>
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
                        {currentItems.length === 0 ? (
                            <tr>
                            <td colSpan={6} className="no-data-row">
                                Geen data gevonden voor de zoekterm: <strong>{debouncedSearchTerm}</strong>
                            </td>
                            </tr>
                        ) : (
                            currentItems.map((item) => (
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
