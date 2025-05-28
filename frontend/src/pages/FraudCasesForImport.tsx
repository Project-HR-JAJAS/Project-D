import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../css/UniversalTableCss.css';

interface FraudCase {
  CDR_ID: string;
  [key: string]: any;
}

const PAGE_SIZE = 15;
const SEARCH_FIELDS = [
  { value: 'CDR_ID', label: 'CDR ID' },
  { value: 'Charge_Point_City', label: 'City' },
  { value: 'Charge_Point_Address', label: 'Address' },
  { value: 'Charge_Point_Country', label: 'Country' },
];

const FraudCasesForImport: React.FC = () => {
  const { filename } = useParams<{ filename: string }>();
  const [fraudCases, setFraudCases] = useState<FraudCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchField, setSearchField] = useState('CDR_ID');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInput, setShowInput] = useState<{left: boolean, right: boolean}>({left: false, right: false});
  const [inputValue, setInputValue] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFraudCases = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:8000/api/fraud-cases-for-import?filename=${encodeURIComponent(filename || '')}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setFraudCases(data);
        } else if (data.error) {
          setError(data.error);
        } else {
          setError('Unknown error');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch fraud cases');
      } finally {
        setLoading(false);
      }
    };
    if (filename) fetchFraudCases();
  }, [filename]);

  // Search and filter
  const filteredCases = fraudCases.filter((fc) => {
    const value = (fc[searchField] || '').toString().toLowerCase();
    return value.includes(searchTerm.toLowerCase());
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCases.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const currentItems = filteredCases.slice(startIndex, endIndex);

  // Pagination helpers (from DataTable.tsx)
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
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

  const handlePageClick = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setShowInput({left: false, right: false});
      setInputValue('');
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

  // Check if city/address/country data is missing for all rows
  const noLocationData = fraudCases.length > 0 && fraudCases.every(fc => !fc.Charge_Point_City && !fc.Charge_Point_Address && !fc.Charge_Point_Country);

  return (
    <div style={{ padding: 32 }}>
      <div className="fraud-header-row">
        <div>
          <h2 style={{ margin: 0 }}>Fraud Cases for Import</h2>
          <p style={{ margin: 0 }}><strong>File:</strong> {filename}</p>
        </div>
        <div className="table-search-wrapper">
          <select
            value={searchField}
            onChange={e => { setSearchField(e.target.value); setCurrentPage(1); }}
            className="table-search-dropdown"
          >
            {SEARCH_FIELDS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder={`Search by ${SEARCH_FIELDS.find(f => f.value === searchField)?.label || ''}...`}
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="table-search"
          />
        </div>
      </div>
      <div style={{ marginTop: 24 }}>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : filteredCases.length === 0 ? (
          <p>No fraud cases found for this import.<br />
            <span style={{fontSize: '0.9em', color: '#888'}}>Make sure the filename matches exactly as stored in the database (including spaces and dashes).</span>
          </p>
        ) : (
          <>
            {noLocationData && (
              <p style={{ color: '#888', fontSize: '0.95em', marginBottom: 8 }}>
                No city, address, or country data available for these fraud cases.
              </p>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table className="table-form">
                <thead>
                  <tr>
                    <th style={{ width: 180 }}>CDR_ID</th>
                    <th style={{ width: 250, whiteSpace: 'normal', wordBreak: 'break-word' }}>Reason</th>
                    <th style={{ width: 120 }}>City</th>
                    <th style={{ width: 220 }}>Address</th>
                    <th style={{ width: 100 }}>Country</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((fc, idx) => {
                    const reasons = [];
                    for (let i = 1; i <= 7; i++) {
                      const val = fc[`Reason${i}`];
                      if (val && val !== 'null') reasons.push(val);
                    }
                    return (
                      <tr
                        key={idx}
                        className="clickable-row"
                        onClick={() => navigate(`/cdr-details/${fc.CDR_ID}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{fc.CDR_ID}</td>
                        <td style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{reasons.join(', ')}</td>
                        <td>{fc.Charge_Point_City || ''}</td>
                        <td>{fc.Charge_Point_Address || ''}</td>
                        <td>{fc.Charge_Point_Country || ''}</td>
                      </tr>
                    );
                  })}
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
          </>
        )}
      </div>
    </div>
  );
};

export default FraudCasesForImport; 