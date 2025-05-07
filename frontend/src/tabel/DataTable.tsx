import React, { useState } from 'react';
import { PAGE_SIZE } from './DataTable.api';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import './DataTable.css';

interface DataTableItem {
    id: number;
    authentication_id: string;
    duration: string;
    volume: number;
    charge_point_id: string;
    calculated_cost: number;
}

const DataTable: React.FC = () => {
    const { dataTableItems, loading, error } = useData();
    const [currentPage, setCurrentPage] = useState(1);
    const [showInput, setShowInput] = useState<{left: boolean, right: boolean}>({left: false, right: false});
    const [inputValue, setInputValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{key: 'volume' | 'calculated_cost' | null, direction: 'asc' | 'desc' | null}>({key: null, direction: null});
    const navigate = useNavigate();

    // Client-side filtering
    const filteredData = dataTableItems.filter(item =>
        (item.authentication_id ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Client-side sorting
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

    const totalPages = Math.ceil(sortedData.length / PAGE_SIZE);
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const currentItems = sortedData.slice(startIndex, endIndex);

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

    if (loading.dataTable) return <div>Laden...</div>;
    if (error.dataTable) return <div>Error: {error.dataTable}</div>;

    return (
        <div className="data-table-container">
            <div className="userstats-search-wrapper">
                <h2>Data Tabel</h2>
                <input
                    type="text"
                    placeholder="Zoek op Authentication ID..."
                    value={searchTerm}
                    onChange={e => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
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
                                    Geen data gevonden voor de zoekterm: <strong>{searchTerm}</strong>
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
                {(getPageNumbers() ?? []).map((page) => (
                    typeof page === 'number' ? (
                        <button
                            key={page}
                            onClick={() => handlePageClick(page)}
                            className={`pagination-button ${page === currentPage ? 'active' : ''}`}
                        >
                            {page}
                        </button>
                    ) : (
                        <span key={page} className="pagination-ellipsis">...</span>
                    )
                ))}
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
