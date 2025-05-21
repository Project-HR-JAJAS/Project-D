import React, { useState } from 'react';
import { PAGE_SIZE } from './ChargePointStatsTable.api';
import { useData } from '../context/DataContext';
import '../css/UniversalTableCss.css';


interface ChargePointStat {
    Charge_Point_ID: string;
    Charge_Point_Country: string;
    transaction_count: number;
    total_volume: number;
    total_cost: number;
}

const ChargePointStatsTable: React.FC = () => {
    const { chargePointStats, loading, error } = useData();
    const [currentPage, setCurrentPage] = useState(1);
    const [showInput, setShowInput] = useState<{left: boolean, right: boolean}>({left: false, right: false});
    const [inputValue, setInputValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchField, setSearchField] = useState<'Charge_Point_ID' | 'Charge_Point_Country'>('Charge_Point_ID');
    const [sortConfig, setSortConfig] = useState<{ key: keyof ChargePointStat | null; direction: 'asc' | 'desc' | null }>({ key: null, direction: null });

    // Client-side filtering
    const filteredStats = chargePointStats.filter((stat: ChargePointStat) => {
        const value = stat[searchField] ?? '';
        return value.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Client-side sorting
    const sortedStats = [...filteredStats];
    if (sortConfig.key && sortConfig.direction) {
        sortedStats.sort((a, b) => {
            const aVal = sortConfig.key ? a[sortConfig.key] ?? 0 : 0;
            const bVal = sortConfig.key ? b[sortConfig.key] ?? 0 : 0;
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
            }
            return 0;
        });
    }

    const totalPages = Math.ceil(sortedStats.length / PAGE_SIZE);
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const currentStats = sortedStats.slice(startIndex, endIndex);

    const handleSort = (key: keyof ChargePointStat) => {
        setSortConfig(prev => {
            if (prev.key !== key) return { key, direction: 'asc' };
            if (prev.direction === 'asc') return { key, direction: 'desc' };
            if (prev.direction === 'desc') return { key: null, direction: null };
            return { key, direction: 'asc' };
        });
        setCurrentPage(1);
    };

    const getSortIndicator = (key: keyof ChargePointStat) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '';
        }
        return '';
    };

    const handlePageClick = (page: number) => {
        if (page !== currentPage && page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            setShowInput({left: false, right: false});
            setInputValue('');
        }
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        } else {
            // Always show first 3
            const firstPages = [1, 2, 3];
            // Always show last 3
            const lastPages = [totalPages - 2, totalPages - 1, totalPages];
            // Sliding window
            let start = Math.max(4, currentPage - 1);
            let end = Math.min(totalPages - 3, currentPage + 1);
            const middlePages = [];
            for (let i = start; i <= end; i++) {
                middlePages.push(i);
            }
            let allPages: (number | string)[] = [];
            // Add first 3
            allPages.push(...firstPages);
            // Add ellipsis if gap between first 3 and middle
            if (start > 4) allPages.push('ellipsis1');
            // Add middle pages
            for (const p of middlePages) {
                if (!allPages.includes(p)) allPages.push(p);
            }
            // Add ellipsis if gap between middle and last 3
            if (end < totalPages - 3) allPages.push('ellipsis2');
            // Add last 3
            for (const p of lastPages) {
                if (!allPages.includes(p)) allPages.push(p);
            }
            return allPages;
        }
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

    if (loading.chargePoints) return <div>Loading...</div>;
    if (error.chargePoints) return <div>Error: {error.chargePoints}</div>;

    return (
        <div className="table-container">
            <div className="table-search-wrapper">
                <h2>Charge Point Statistics</h2>
                <div>
                    <select
                        value={searchField}
                        onChange={e => setSearchField(e.target.value as 'Charge_Point_ID' | 'Charge_Point_Country')}
                        className="table-search-dropdown"
                    >
                        <option value="Charge_Point_ID">Charge Point ID</option>
                        <option value="Charge_Point_Country">Country</option>
                    </select>
                    <input
                        type="text"
                        placeholder={searchField === 'Charge_Point_ID' ? 'Search by Charge Point ID...' : 'Search by Country...'}
                        value={searchTerm}
                        onChange={e => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="table-search"
                    />
                </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table className="table-form">
                    <thead>
                        <tr>
                            <th>Charge Point ID</th>
                            <th>Country</th>
                            <th className="sortable-header" onClick={() => handleSort('transaction_count')}>
                                Total Transactions{getSortIndicator('transaction_count')}
                            </th>
                            <th className="sortable-header" onClick={() => handleSort('total_volume')}>
                                Total Volume{getSortIndicator('total_volume')}
                            </th>
                            <th className="sortable-header" onClick={() => handleSort('total_cost')}>
                                Total Cost{getSortIndicator('total_cost')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentStats.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="no-data-row">
                                    No results found for: <strong>{searchTerm}</strong>
                                </td>
                            </tr>
                        ) : (
                            currentStats.map((stat: ChargePointStat) => (
                                <tr key={stat.Charge_Point_ID}>
                                    <td>{stat.Charge_Point_ID}</td>
                                    <td>{stat.Charge_Point_Country}</td>
                                    <td>{stat.transaction_count}</td>
                                    <td>{stat.total_volume}</td>
                                    <td>{stat.total_cost}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {currentStats.length > 0 && (
                <div className="pagination-container">
                    <button 
                        className="pagination-button"
                        onClick={() => handlePageClick(currentPage - 1)} 
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    {(getPageNumbers() ?? []).map((page) => {
                        if (typeof page === 'number') {
                            return (
                                <button
                                    key={page}
                                    onClick={() => handlePageClick(page)}
                                    className={`pagination-button ${page === currentPage ? 'active' : ''}`}
                                >
                                    {page}
                                </button>
                            );
                        } else if (page === 'ellipsis1' || page === 'ellipsis2') {
                            const side = page === 'ellipsis1' ? 'left' : 'right';
                            return (
                                <span key={page} className="pagination-ellipsis">
                                    {showInput[side] ? (
                                        <input
                                            type="text"
                                            className="pagination-input"
                                            value={inputValue}
                                            onChange={handleInputChange}
                                            onBlur={() => handleInputSubmit(side)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleInputSubmit(side);
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        <span onClick={() => handleEllipsisClick(side)} style={{ cursor: 'pointer' }}>...</span>
                                    )}
                                </span>
                            );
                        }
                    })}
                    <button 
                        className="pagination-button" 
                        onClick={() => handlePageClick(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                        >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default ChargePointStatsTable;