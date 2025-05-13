import React, { useState } from 'react';
import './OverlappingSessions.css';
import OverlappingModal from './OverlappingModal';
import { useData } from '../context/DataContext';

const OverlappingSessions: React.FC = () => {
  const { overlappingSessions, loading, error } = useData();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCdrId, setSelectedCdrId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState<'Authentication_ID' | 'Charge_Point_City'>('Authentication_ID');
  const [sortConfig, setSortConfig] = useState<{ key: 'Volume' | 'OverlappingCount' | null; direction: 'asc' | 'desc' | null }>({ key: null, direction: null });

  const itemsPerPage = 50;

  const formatDate = (value: string) => new Date(value).toLocaleString();

  const filteredData = overlappingSessions.filter(item => {
    const value = item[searchField] ?? '';
    return value.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    const aVal = a[sortConfig.key] ?? 0;
    const bVal = b[sortConfig.key] ?? 0;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);

  const handleSort = (key: 'Volume' | 'OverlappingCount') => {
    setSortConfig(prev => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      if (prev.direction === 'desc') return { key: null, direction: null };
      return { key, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  const getSortIndicator = (key: 'Volume' | 'OverlappingCount') => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '';
    }
    return '';
  };

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

  return (
    <div className="overlap-container">
      <div className="overlap-search-wrapper">
        <h2 className="overlap-title">Overlapping Sessions per Charge Card</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={searchField}
            onChange={e => {
              setSearchField(e.target.value as 'Authentication_ID' | 'Charge_Point_City');
              setSearchTerm('');
              setCurrentPage(1);
            }}
            className="userstats-search-dropdown"
            title="Kies zoekveld"
          >
            <option value="Authentication_ID">Authentication ID</option>
            <option value="Charge_Point_City">City</option>
          </select>
          <input
            type="text"
            placeholder={searchField === 'Authentication_ID' ? 'Zoek op Authentication ID...' : 'Zoek op stad...'}
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="userstats-search"
          />
        </div>
      </div>

      {loading.overlappingSessions ? (
        <div className="overlap-loading">Loading...</div>
      ) : error.overlappingSessions ? (
        <div className="overlap-empty">Error: {error.overlappingSessions}</div>
      ) : sortedData.length === 0 ? (
        <div className="overlap-empty">Geen resultaten gevonden</div>
      ) : (
        <>
          <div className="overlap-pagination-info">
            <div>
              Toont sessies {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, sortedData.length)} van {sortedData.length}
            </div>
          </div>

          <div className="overlap-table-wrapper">
            <table className="overlap-table">
              <thead>
                <tr>
                  <th>Authentication ID</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>City</th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('Volume')}
                  >
                    Volume (kWh){getSortIndicator('Volume')}
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('OverlappingCount')}
                  >
                    Overlaps{getSortIndicator('OverlappingCount')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((row, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? 'even' : 'odd'}
                    onClick={() => {
                      setSelectedCdrId(row.CDR_ID);
                      setShowModal(true);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{row.Authentication_ID}</td>
                    <td>{formatDate(row.Start_datetime)}</td>
                    <td>{formatDate(row.End_datetime)}</td>
                    <td>{row.Charge_Point_City}</td>
                    <td>{row.Volume}</td>
                    <td>{row.OverlappingCount ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="page-numbers">
            <button className="page-number-button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
              Vorige
            </button>
            {(getPageNumbers() ?? []).map((page) => (
              typeof page === 'number' ? (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`page-number-button ${page === currentPage ? 'active' : ''}`}
                >
                  {page}
                </button>
              ) : (
                <span key={page} className="pagination-ellipsis">...</span>
              )
            ))}
            <button className="page-number-button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
              Volgende
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
