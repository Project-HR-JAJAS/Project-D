import React, { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import '../css/UniversalTableCss.css';
import UserDetailsModal from './UserDetailsModal';
import TableExportButton from '../exportButton/TableExportButton';
import { fetchAllFraudStats, fetchStatsByFraudType } from './UserStats.api';

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
  const [selectedAuthId, setSelectedAuthId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [fraudFilter, setFraudFilter] = useState<'all' | 'fraud' | string>('all');
  const [filteredStats, setFilteredStats] = useState<UserStat[]>([]);

  const itemsPerPage = 50;
  
  const dataToDisplay = filteredStats ?? [];

  const filteredData = dataToDisplay.filter(item =>
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

  useEffect(() => {
  if (fraudFilter === 'all') {
    setFilteredStats(userStats);
  } else if (fraudFilter === 'fraud') {
    fetchAllFraudStats()
      .then(data => setFilteredStats(data))
      .catch(err => console.error('Error fetching fraud stats:', err));
  } else if (fraudFilter.startsWith('type:')) {
    const reason = fraudFilter.split(':')[1];
    fetchStatsByFraudType(reason)
      .then(data => setFilteredStats(data))
      .catch(err => console.error('Error fetching stats by reason:', err));
  }
}, [fraudFilter, userStats]);

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

  const exportColumns = [
    { label: 'Authentication ID', key: 'Authentication_ID' },
    { label: 'Total Transactions', key: 'TransactionCount' },
    { label: 'Total Volume (kWh)', key: 'TotalVolume' },
    { label: 'Total Cost (€)', key: 'TotalCost' },
  ];

  return (
    <div className="table-container">
      <div className="table-search-wrapper">
        <h2 >User Statistics by Authentication ID</h2>
        <TableExportButton
          data={sortedData}
          columns={exportColumns}
          filename="user_statistics"
          format="xlsx"
        />
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
      <div>
        <label>
          Filter by: &nbsp;
          <select
            value={fraudFilter}
            onChange={(e) => {
              setFraudFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="table-filter-dropdown"
          >
            <option value="all">All Users</option>
            <option value="fraud">Fraudulent Users (Any Reason)</option>
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
                  <tr
                    key={i}
                    className="clickable-row"
                    onClick={() => {
                      setSelectedAuthId(row.Authentication_ID);
                      setShowModal(true);
                    }}
                  >
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
      <div>
        {showModal && selectedAuthId && (
          <UserDetailsModal
            authId={selectedAuthId}
            onClose={() => {
              setShowModal(false);
              setSelectedAuthId(null);
            }}
          />
        )}
      </div>
    </div>

  );
};

export default UserStats;
