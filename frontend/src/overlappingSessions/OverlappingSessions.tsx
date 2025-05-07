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

  const itemsPerPage = 50;

  const formatDate = (value: string) => new Date(value).toLocaleString();

  const filteredData = overlappingSessions.filter(item =>
    (item.Authentication_ID ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

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

  return (
    <div className="overlap-container">
      <div className="overlap-search-wrapper">
        <h2 className="overlap-title">Overlapping Sessions per Charge Card</h2>
        <input
          type="text"
          placeholder="Zoek op Authentication ID..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="overlap-search"
        />
      </div>

      {loading.overlappingSessions ? (
        <div className="overlap-loading">Loading...</div>
      ) : error.overlappingSessions ? (
        <div className="overlap-empty">Error: {error.overlappingSessions}</div>
      ) : filteredData.length === 0 ? (
        <div className="overlap-empty">Geen resultaten gevonden</div>
      ) : (
        <>
          <div className="overlap-pagination-info">
            <div>
              Toont sessies {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredData.length)} van {filteredData.length}
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
                  <th>Volume (kWh)</th>
                  <th>Overlaps</th>
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

            {getPageNumbers().map((page, idx) => {
              if (page === 'left-ellipsis') {
                return showInput.left ? (
                  <input
                    key={idx}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={() => setShowInput({ left: false, right: false })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleInputSubmit('left');
                    }}
                    className="page-number-input"
                    autoFocus
                  />
                ) : (
                  <span key={idx} className="page-number-ellipsis" onClick={() => handleEllipsisClick('left')}>
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
                    onBlur={() => setShowInput({ left: false, right: false })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleInputSubmit('right');
                    }}
                    className="page-number-input"
                    autoFocus
                  />
                ) : (
                  <span key={idx} className="page-number-ellipsis" onClick={() => handleEllipsisClick('right')}>
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={page}
                  onClick={() => goToPage(Number(page))}
                  className={`page-number-button ${page === currentPage ? 'active' : ''}`}
                >
                  {page}
                </button>
              );
            })}

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
