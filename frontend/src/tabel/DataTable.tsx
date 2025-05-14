import React, { useState } from 'react';
import { PAGE_SIZE } from './DataTable.api';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import '../css/UniversalTableCss.css';

interface DataTableItem {
    id: string;
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
    const [searchField, setSearchField] = useState<'id' | 'authentication_id' | 'charge_point_id'>('id');
    const [sortConfig, setSortConfig] = useState<{ key: keyof DataTableItem | null; direction: 'asc' | 'desc' | null }>({ key: null, direction: null });
    const navigate = useNavigate();

    // Client-side filtering
    const filteredStats = dataTableItems.filter((stat: DataTableItem) => {
        const value = stat[searchField] ?? '';
        return value.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Client-side sorting
    const sortedData = [...filteredStats];
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

    const handleSort = (key: keyof DataTableItem) => {
        setSortConfig(prev => {
            if (prev.key !== key) return { key, direction: 'asc' };
            if (prev.direction === 'asc') return { key, direction: 'desc' };
            if (prev.direction === 'desc') return { key: null, direction: null };
            return { key, direction: 'asc' };
        });
        setCurrentPage(1);
    };

    const getSortIndicator = (key: keyof DataTableItem) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '';
        }
        return '';
    };

    if (loading.dataTable) return <div>Loading...</div>;
    if (error.dataTable) return <div>Error: {error.dataTable}</div>;

    return (
        <div className="table-container">
            <div className="table-search-wrapper">
                <h2>Data Tabel</h2>
                <div>
                    <select
                        value={searchField}
                        onChange={e => setSearchField(e.target.value as 'id' | 'authentication_id' | 'charge_point_id')}
                        className="table-search-dropdown"
                    >
                        <option value="id">CDR ID</option>
                        <option value="authentication_id">Authentication ID</option>
                        <option value="charge_point_id">Charge Point ID</option>
                    </select>
                    <input
                        type="text"
                        placeholder={
                            searchField === 'id'
                                ? 'Zoek op CDR ID...'
                                : searchField === 'authentication_id'
                                ? 'Zoek op Authentication ID...'
                                : 'Zoek op Charge Point ID...'
                        }
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
                            <th>CDR ID</th>
                            <th>Authentication ID</th>
                            <th>Duration</th>
                            <th className="sortable-header" onClick={() => handleSort('volume')}>
                                Volume{getSortIndicator('volume')}
                            </th>
                            <th>Charge Point ID</th>
                            <th className="sortable-header" onClick={() => handleSort('calculated_cost')}>
                                Calculated Cost {getSortIndicator('calculated_cost')}
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
                                <tr 
                                    key={item.id} 
                                    onClick={() => navigate(`/details/${item.id}`)}
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
        </div>
    );
};

export default DataTable;
