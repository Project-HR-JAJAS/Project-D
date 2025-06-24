import React, { useEffect, useState } from 'react';
import { PAGE_SIZE, fetchChargePointStats, fetchAllFraudStats, fetchStatsByFraudType } from './ChargePointStatsTable.api';
import TableExportButton from '../exportButton/TableExportButton';
import ChargePointStatsModal from './ChargePointStatsModal';
import '../css/UniversalTableCss.css';
import { useChargePointStats } from './ChargePointStatsContext';

interface ChargePointStat {
    Charge_Point_ID: string;
    Charge_Point_Country: string;
    transaction_count: number;
    total_volume: number;
    total_cost: number;
}

const ChargePointStatsTable: React.FC = () => {
    const { stats, loading, error } = useChargePointStats();
    const [filteredStats, setFilteredStats] = useState<ChargePointStat[]>(stats);
    const [fraudFilter, setFraudFilter] = useState<'all' | 'fraud' | string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchField, setSearchField] = useState<'Charge_Point_ID' | 'Charge_Point_Country'>('Charge_Point_ID');
    const [sortConfig, setSortConfig] = useState<{ key: keyof ChargePointStat | null; direction: 'asc' | 'desc' | null }>({ key: null, direction: null });
    const [currentPage, setCurrentPage] = useState(1);
    const [showInput, setShowInput] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });
    const [inputValue, setInputValue] = useState('');
    const [selectedChargePointId, setSelectedChargePointId] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Load all stats once on mount
    useEffect(() => {
        fetchChargePointStats()
            .then(data => {
                setFilteredStats(data);
            })
            .catch(console.error);
    }, []);

    // Load filtered data when fraudFilter changes
    useEffect(() => {
        if (fraudFilter === 'all') {
            setFilteredStats(stats);
            setCurrentPage(1);
        } else if (fraudFilter === 'fraud') {
            fetchAllFraudStats()
                .then(data => {
                    setFilteredStats(data);
                    setCurrentPage(1);
                })
                .catch(console.error);
        } else if (fraudFilter.startsWith('type:')) {
            const reason = fraudFilter.split(':')[1];
            fetchStatsByFraudType(reason)
                .then(data => {
                    setFilteredStats(data);
                    setCurrentPage(1);
                })
                .catch(console.error);
        }
    }, [fraudFilter, stats]);

    // Filter stats based on fraud filter and search term
    useEffect(() => {
        let filtered = stats;
        if (fraudFilter === 'fraud') {
            filtered = filtered.filter(stat => stat.transaction_count > 0); // Example condition
        } else if (fraudFilter.startsWith('type:')) {
            const reason = fraudFilter.split(':')[1];
            filtered = filtered.filter(stat => stat.transaction_count > 0); // Example condition
        }
        filtered = filtered.filter(stat => {
            const val = stat[searchField] ?? '';
            return val.toLowerCase().includes(searchTerm.toLowerCase());
        });
        setFilteredStats(filtered);
    }, [fraudFilter, searchTerm, searchField, stats]);

    // Sort data
    const sortedData = [...filteredStats];
    if (sortConfig.key && sortConfig.direction) {
    const key = sortConfig.key;  // Now key is guaranteed not null

    sortedData.sort((a, b) => {
        const aVal = a[key] ?? 0;
        const bVal = b[key] ?? 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return 0;
    });
    }

    // Pagination calculations
    const totalPages = Math.ceil(sortedData.length / PAGE_SIZE);
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const currentPageData = sortedData.slice(startIndex, startIndex + PAGE_SIZE);

    // Sorting handler
    const handleSort = (key: keyof ChargePointStat) => {
        setSortConfig(prev => {
            if (prev.key !== key) return { key, direction: 'asc' };
            if (prev.direction === 'asc') return { key, direction: 'desc' };
            if (prev.direction === 'desc') return { key: null, direction: null };
            return { key, direction: 'asc' };
        });
        setCurrentPage(1);
    };

    // Pagination page click
    const handlePageClick = (page: number) => {
        if (page !== currentPage && page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            setShowInput({ left: false, right: false });
            setInputValue('');
        }
    };

    // Ellipsis click toggles input
    const handleEllipsisClick = (side: 'left' | 'right') => {
        setShowInput({ left: side === 'left', right: side === 'right' });
        setInputValue('');
    };

    // Input change only allows digits
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        setInputValue(val);
    };

    // Submit input to jump to page
    const handleInputSubmit = (side: 'left' | 'right') => {
        const page = Number(inputValue);
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            setShowInput({ left: false, right: false });
            setInputValue('');
        }
    };

    // Pagination page numbers with ellipsis
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        } else {
            const firstPages = [1, 2, 3];
            const lastPages = [totalPages - 2, totalPages - 1, totalPages];
            let start = Math.max(4, currentPage - 1);
            let end = Math.min(totalPages - 3, currentPage + 1);
            const middlePages = [];
            for (let i = start; i <= end; i++) middlePages.push(i);
            let allPages: (number | string)[] = [];
            allPages.push(...firstPages);
            if (start > 4) allPages.push('ellipsis1');
            for (const p of middlePages) {
                if (!allPages.includes(p)) allPages.push(p);
            }
            if (end < totalPages - 3) allPages.push('ellipsis2');
            for (const p of lastPages) {
                if (!allPages.includes(p)) allPages.push(p);
            }
            return allPages;
        }
    };

    // Sort indicator arrows
    const getSortIndicator = (key: keyof ChargePointStat) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '';
        }
        return '';
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="table-container">
            <div className="table-search-wrapper">
                <h2>Charge Point Statistics</h2>
                <TableExportButton
                    data={sortedData}
                    columns={[
                        { label: 'Charge Point ID', key: 'Charge_Point_ID' },
                        { label: 'Country', key: 'Charge_Point_Country' },
                        { label: 'Total Transactions', key: 'transaction_count' },
                        { label: 'Total Volume', key: 'total_volume' },
                        { label: 'Total Cost', key: 'total_cost' },
                    ]}
                    filename="charge_point_stats"
                    format="xlsx"
                />
                <div>
                    <select
                        value={searchField}
                        title="Search by Charge Point ID or Country"
                        onChange={e => setSearchField(e.target.value as 'Charge_Point_ID' | 'Charge_Point_Country')}
                        className="table-search-dropdown"
                    >
                        <option value="Charge_Point_ID">Charge Point ID</option>
                        <option value="Charge_Point_Country">Country</option>
                    </select>
                </div>
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
                <div>
                    <label>
                        Filter by: &nbsp;
                        <select
                            value={fraudFilter}
                            onChange={e => {
                                setFraudFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="table-filter-dropdown"
                        >
                            <option value="all">All Charge Points</option>
                            <option value="fraud">Fraudulent Charge Points (Any Reason)</option>
                            <option value="type:Reason1">Fraud: High volume in a short duration</option>
                            <option value="type:Reason2">Fraud: Unusual cost per kWh</option>
                            <option value="type:Reason3">Fraud: Rapid consecutive sessions</option>
                            <option value="type:Reason4">Fraud: Overlapping sessions</option>
                            <option value="type:Reason5">Fraud: Repeating behaviour?</option>
                            <option value="type:Reason6">Fraud: Data integrity violation</option>
                            <option value="type:Reason7">Fraud: Unrealistic movement</option>
                        </select>
                    </label>
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
                        {currentPageData.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="no-data-row">
                                    No results found for: <strong>{searchTerm}</strong>
                                </td>
                            </tr>
                        ) : (
                            currentPageData.map(stat => (
                                <tr
                                    key={stat.Charge_Point_ID}
                                    className="clickable-row"
                                    onClick={() => {
                                        setSelectedChargePointId(stat.Charge_Point_ID);
                                        setShowModal(true);
                                    }}
                                >
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

            {/* Pagination controls */}
            {totalPages > 1 && (
                <div className="pagination-container">
                    <button
                        className="pagination-button"
                        onClick={() => handlePageClick(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    {(getPageNumbers() ?? []).map(page => {
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
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleInputSubmit(side);
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        <span
                                            onClick={() => handleEllipsisClick(side)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            ...
                                        </span>
                                    )}
                                </span>
                            );
                        }
                        return null;
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

            {/* Modal for details */}
            {showModal && selectedChargePointId && (
                <ChargePointStatsModal
                    ChargeID={selectedChargePointId}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedChargePointId(null);
                    }}
                />
            )}
        </div>
    );
};

export default ChargePointStatsTable;
