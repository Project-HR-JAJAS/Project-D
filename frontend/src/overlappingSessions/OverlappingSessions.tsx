import React, { useState } from 'react';
import OverlappingModal from './OverlappingModal';
import { OverlappingSession, useData } from '../context/DataContext';
import '../css/UniversalTableCss.css';

const OverlappingSessions: React.FC = () => {
  const { overlappingSessions, loading, error } = useData();
  const [currentPage, setCurrentPage] = useState(1);
  const [showInput, setShowInput] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });
  const [selectedCdrId, setSelectedCdrId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState<'Authentication_ID'>('Authentication_ID');
  const [sortConfig, setSortConfig] = useState<{ key: keyof OverlappingSession | null; direction: 'asc' | 'desc' | null }>({ key: null, direction: null });
  

  const itemsPerPage = 50;

  const formatDate = (value: string) => new Date(value).toLocaleString();

  const filteredStats = overlappingSessions.filter((stat: OverlappingSession) => {
        const value = stat[searchField] ?? '';
        return value.toLowerCase().includes(searchTerm.toLowerCase());
    });
  
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

  return (
    <div className="table-container">
      <div className="table-search-wrapper">
        <h2>Overlapping Sessions per Charge Card</h2>
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
              placeholder="Search based on Authentication ID..."
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
        <div> Loading...</div>
      ) : error.overlappingSessions ? (
        <div className="no-data-row">Error: {error.overlappingSessions}</div>
      ) : filteredStats.length === 0 ? (
        <div className="no-data-row">Geen resultaten gevonden</div>
      ) : (
        <>
          {/* <div className="overlap-pagination-info">
            <div>
              Toont sessies {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredStats.length)} van {filteredStats.length}
            </div>
          </div> */}

          <div style={{ overflowX: 'auto' }}>
            <table className="table-form">
              <thead>
                <tr>
                  <th>Authentication ID</th>
                  <th className="sortable-header" onClick={() => handleSort('Volume')}>
                      Volume (kWh){getSortIndicator('Volume')}
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
                {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="no-data-row">
                          Geen data gevonden voor de zoekterm: <strong>{searchTerm}</strong>
                      </td>
                  </tr>
                ) : (
                    currentItems.map((row, i) => (
                      <tr
                        key={i}
                        className="clickable-row"
                        //className={i % 2 === 0 ? 'even' : 'odd'}
                        onClick={() => {
                          setSelectedCdrId(row.CDR_ID);
                          setShowModal(true);
                        }}
                  >
                    <td>{row.Authentication_ID}</td>
                    <td>{row.Volume}</td>
                    <td>{row.Calculated_Cost?.toFixed(2)}</td>
                    <td>{row.OverlappingCount ?? '-'}</td>
                  </tr>
                ))
              )}
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
            {(getPageNumbers() ?? []).map((page) => {
              if (typeof page === 'number') {
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
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
              onClick={() => goToPage(currentPage + 1)} 
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
          {showModal && selectedCdrId && (
            <OverlappingModal
              cdrId={selectedCdrId}
              onClose={() => {
                setShowModal(false);
                setSelectedCdrId(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default OverlappingSessions;
