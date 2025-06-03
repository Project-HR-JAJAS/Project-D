import React, { useState } from 'react';
import OverlappingModal from './OverlappingModal';
import { OverlappingSession, useData } from '../context/DataContext';
import '../css/UniversalTableCss.css';
import TableExportButton from '../exportButton/TableExportButton';

const OverlappingSessions: React.FC = () => {
  const { overlappingSessions, loading, error } = useData();
  const [currentPage, setCurrentPage] = useState(1);
  const [showInput, setShowInput] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });
  const [selectedCdrId, setSelectedCdrId] = useState<string | null>(null);
  const [selectedAuthId, setSelectedAuthId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState<'Authentication_ID'>('Authentication_ID');
  const [sortConfig, setSortConfig] = useState<{ key: keyof OverlappingSession | null; direction: 'asc' | 'desc' | null }>({ key: null, direction: null });

  const itemsPerPage = 50;

  // Geen backend data opnieuw groeperen; direct gebruiken
  const filteredStats = overlappingSessions.filter(stat =>
    (stat.Authentication_ID ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const totalPages = Math.ceil(filteredStats.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
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
      const firstPages = [1, 2, 3];
      const lastPages = [totalPages - 2, totalPages - 1, totalPages];
      let start = Math.max(4, currentPage - 1);
      let end = Math.min(totalPages - 3, currentPage + 1);
      const middlePages = [];
      for (let i = start; i <= end; i++) {
        middlePages.push(i);
      }
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

  const handleSort = (key: keyof OverlappingSession) => {
    setSortConfig(prev => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      if (prev.direction === 'desc') return { key: null, direction: null };
      return { key, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  const getSortIndicator = (key: keyof OverlappingSession) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '';
    }
    return '';
  };

  const exportColumns = [
    { label: 'Authentication ID', key: 'Authentication_ID' },
    { label: 'Volume (kWh)', key: 'Volume' },
    { label: 'Total Cost (€)', key: 'Calculated_Cost' },
    { label: 'Overlapping Sessions', key: 'OverlappingCount' },
  ];

  return (
    <div className="table-container">
      <div className="table-search-wrapper">
        <h2>Overlapping Sessions per Charge Card</h2>
        <TableExportButton
          data={currentItems}
          columns={exportColumns}
          filename="overlapping_sessions"
          format="xlsx"
        />
        <div>
          <select
            value={searchField}
            onChange={e => setSearchField(e.target.value as 'Authentication_ID')}
            className="table-search-dropdown"
          >
            <option value="Authentication_ID">Authentication ID</option>
          </select>
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
      </div>

      {loading.overlappingSessions ? (
        <div>Loading...</div>
      ) : error.overlappingSessions ? (
        <div className="no-data-row">Error: {error.overlappingSessions}</div>
      ) : filteredStats.length === 0 ? (
        <div className="no-data-row">No Overlapping Sessions Found</div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="table-form">
              <thead>
                <tr>
                  <th>Authentication ID</th>
                  <th className="sortable-header" onClick={() => handleSort('Volume')}>
                    Total Volume (kWh){getSortIndicator('Volume')}
                  </th>
                  <th className="sortable-header" onClick={() => handleSort('Calculated_Cost')}>
                    Total Cost (€){getSortIndicator('Calculated_Cost')}
                  </th>
                  <th className="sortable-header" onClick={() => handleSort('OverlappingCount')}>
                    Overlaps{getSortIndicator('OverlappingCount')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((row, i) => (
                  <tr
                    key={i}
                    className="clickable-row"
                    onClick={() => {
                      console.log("Clicked row:", row);
                      // setSelectedCdrId(row.CDR_ID);
                      setSelectedAuthId(row.Authentication_ID);
                      setShowModal(true);
                    }}
                  >
                    <td>{row.Authentication_ID}</td>
                    <td>{row.Volume}</td>
                    <td>{row.Calculated_Cost?.toFixed(2)}</td>
                    <td>{row.OverlappingCount ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-container">
            <button
              className="pagination-button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {(getPageNumbers() ?? []).map(page =>
              typeof page === 'number' ? (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`pagination-button ${page === currentPage ? 'active' : ''}`}
                >
                  {page}
                </button>
              ) : (
                <span key={page} className="pagination-ellipsis">
                  {showInput[page === 'ellipsis1' ? 'left' : 'right'] ? (
                    <input
                      type="text"
                      className="pagination-input"
                      value={inputValue}
                      onChange={handleInputChange}
                      onBlur={() => handleInputSubmit(page === 'ellipsis1' ? 'left' : 'right')}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleInputSubmit(page === 'ellipsis1' ? 'left' : 'right');
                      }}
                      autoFocus
                    />
                  ) : (
                    <span onClick={() => handleEllipsisClick(page === 'ellipsis1' ? 'left' : 'right')} style={{ cursor: 'pointer' }}>...</span>
                  )}
                </span>
              )
            )}
            <button
              className="pagination-button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
          {showModal && selectedAuthId && (
            <OverlappingModal
              authId={selectedAuthId}
              onClose={() => setShowModal(false)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default OverlappingSessions;
