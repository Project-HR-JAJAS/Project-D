import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import '../css/UniversalTableCss.css';

interface UserStat {
  Authentication_ID: string;
  TransactionCount: number;
  TotalVolume: number;
  TotalCost: number;
}

const UserStats: React.FC = () => {
  const { userStats, loading, error } = useData();
  const [currentPage, setCurrentPage] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });
  const [sortConfig, setSortConfig] = useState<{ key: keyof UserStat | null; direction: 'asc' | 'desc' | null }>({
    key: null,
    direction: null,
  });
  const [searchTerm, setSearchTerm] = useState('');

  const itemsPerPage = 50;

  const filteredData = userStats.filter(item =>
    (item.Authentication_ID ?? '').toLowerCase().includes(searchTerm.toLowerCase())
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

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);

  const handleSort = (key: keyof UserStat) => {
    setSortConfig(prev => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      if (prev.direction === 'desc') return { key: null, direction: null };
      return { key, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  const handlePageClick = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setShowInput({ left: false, right: false });
      setInputValue('');
    }
  };

  const handleEllipsisClick = (side: 'left' | 'right') => {
    setShowInput({ left: side === 'left', right: side === 'right' });
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
      setShowInput({ left: false, right: false });
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

  const getSortIndicator = (key: keyof UserStat) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '';
    }
    return '';
  };

  if (loading.userStats) return <div> Loading...</div>;
  if (error.userStats) return <div> Error: {error.userStats}</div>;

  return (
    <div className="table-container">
      <div className="table-search-wrapper">
        <h2 >User Statistics by Authentication ID</h2>
        <input
          type="text"
          placeholder="Search by Authentication ID..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="table-search"
        />
      </div>
          <div className="userstats-table-wrapper">
            <table className="table-form">
              <thead>
                <tr>
                  <th>Authentication ID</th>
                  <th className="sortable-header" onClick={() => handleSort('TransactionCount')}>
                    Total Transactions{getSortIndicator('TransactionCount')}
                  </th>
                  <th className="sortable-header" onClick={() => handleSort('TotalVolume')}>
                    Total Volume (kWh){getSortIndicator('TotalVolume')}
                  </th>
                  <th className="sortable-header" onClick={() => handleSort('TotalCost')}>
                    Total Cost (€){getSortIndicator('TotalCost')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="no-data-row">
                                    No results found for: <strong>{searchTerm}</strong>
                                </td>
                            </tr>
                        ) : (
                currentItems.map((row, i) => (
                  <tr key={i}> {/*className={i % 2 === 0 ? 'even' : 'odd'}>*/}
                    <td>{row.Authentication_ID}</td>
                    <td>{row.TransactionCount}</td>
                    <td>{row.TotalVolume.toFixed(2)}</td>
                    <td>{row.TotalCost.toFixed(2)}</td>
                  </tr>
                )))}
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

export default UserStats;
