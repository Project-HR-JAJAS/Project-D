import React, { useEffect, useMemo, useState } from 'react';
import './UserDetailsModal.css';
import '../css/UniversalTableCss.css';
import TableExportButton from '../exportButton/TableExportButton';

/* ──────────────── Types ──────────────── */
interface CdrDetail {
  CDR_ID: string;
  Start_datetime: string;
  End_datetime: string;
  Duration: number;
  Volume: number;
  Charge_Point_ID: string;
  Charge_Point_City: string;
  Charge_Point_Country: string;
  Calculated_Cost: number;
}

interface UserDetailsModalProps {
  authId: string;
  onClose: () => void;
}

/* ──────────────── Component ──────────────── */
const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ authId, onClose }) => {
  /* Data */
  const [details, setDetails] = useState<CdrDetail[]>([]);
  const [loading, setLoading] = useState(true);

  /* Sorting */
  const [sortConfig, setSortConfig] = useState<{ key: keyof CdrDetail | null; direction: 'asc' | 'desc' | null }>({
    key: null,
    direction: null,
  });

  /* Pagination */
  const itemsPerPage = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const [showInput, setShowInput] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });
  const [inputValue, setInputValue] = useState('');

  /* Fetch */
  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:8000/api/user-details/${authId}`)
      .then(res => res.json())
      .then(data => {
        const cleaned = data.map((item: any) => ({
          ...item,
          Volume: parseFloat((item.Volume ?? '0').toString().replace(',', '.')),
          Calculated_Cost: parseFloat((item.Calculated_Cost ?? '0').toString().replace(',', '.')),
        }));
        setDetails(cleaned);
      })
      .finally(() => setLoading(false));
  }, [authId]);

  /* Helpers */
  const formatDate = (val: string) => new Date(val).toLocaleString();

  const handleSort = (key: keyof CdrDetail) => {
    setSortConfig(prev => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      if (prev.direction === 'desc') return { key: null, direction: null };
      return { key, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  const getSortIndicator = (key: keyof CdrDetail) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '';
    }
    return '';
  };

  const sortedDetails = useMemo(() => {
    const arr = [...details];
    if (sortConfig.key && sortConfig.direction) {
      arr.sort((a, b) => {
        const aVal = a[sortConfig.key!] ?? 0;
        const bVal = b[sortConfig.key!] ?? 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
    }
    return arr;
  }, [details, sortConfig]);

  /* Pagination logic */
  const totalPages = Math.ceil(sortedDetails.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedDetails.slice(indexOfFirstItem, indexOfLastItem);

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
    if (page >= 1 && page <= totalPages) goToPage(page);
  };

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    const first = [1, 2, 3];
    const last = [totalPages - 2, totalPages - 1, totalPages];
    let start = Math.max(4, currentPage - 1);
    let end = Math.min(totalPages - 3, currentPage + 1);
    const middle: number[] = [];
    for (let i = start; i <= end; i++) middle.push(i);

    const all: (number | string)[] = [...first];
    if (start > 4) all.push('ellipsis1');
    for (const p of middle) if (!all.includes(p)) all.push(p);
    if (end < totalPages - 3) all.push('ellipsis2');
    for (const p of last) if (!all.includes(p)) all.push(p);
    return all;
  };

  /* Export definition */
  const exportColumns = [
    { label: 'CDR ID', key: 'CDR_ID' },
    { label: 'Charge Point ID', key: 'Charge_Point_ID' },
    { label: 'Start Time', key: 'Start_datetime' },
    { label: 'End Time', key: 'End_datetime' },
    { label: 'Duration (min)', key: 'Duration' },
    { label: 'Volume (kWh)', key: 'Volume' },
    { label: 'Cost (€)', key: 'Calculated_Cost' },
    { label: 'City', key: 'Charge_Point_City' },
    { label: 'Country', key: 'Charge_Point_Country' },
  ];

  /* Render */
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <h2 className="modal-title">CDR Details for Authentication ID: {authId}</h2>

        {loading ? (
          <p className="modal-loading">Loading...</p>
        ) : details.length === 0 ? (
          <p className="modal-empty">No records found.</p>
        ) : (
          <>
            <TableExportButton data={sortedDetails} columns={exportColumns} filename={`cdr_details_${authId}`} format="xlsx" />

            <table className="modal-table">
              <thead>
                <tr>
                  <th>CDR ID</th>
                  <th>Charge Point ID</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Duration (min)</th>
                  <th className="sortable-header" onClick={() => handleSort('Volume')}>
                    Volume (kWh)
                    {getSortIndicator('Volume')}
                  </th>
                  <th className="sortable-header" onClick={() => handleSort('Calculated_Cost')}>
                    Cost (€)
                    {getSortIndicator('Calculated_Cost')}
                  </th>
                  <th>City</th>
                  <th>Country</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(row => (
                  <tr key={row.CDR_ID}>
                    <td>{row.CDR_ID}</td>
                    <td>{row.Charge_Point_ID}</td>
                    <td>{formatDate(row.Start_datetime)}</td>
                    <td>{formatDate(row.End_datetime)}</td>
                    <td>{row.Duration}</td>
                    <td>{row.Volume.toFixed(2)}</td>
                    <td>{row.Calculated_Cost.toFixed(2)}</td>
                    <td>{row.Charge_Point_City}</td>
                    <td>{row.Charge_Point_Country}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination-container">
              <button className="pagination-button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                Previous
              </button>

              {getPageNumbers().map(page =>
                typeof page === 'number' ? (
                  <button
                    key={page}
                    title={`${page}`}
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
                        onKeyDown={e => e.key === 'Enter' && handleInputSubmit(page === 'ellipsis1' ? 'left' : 'right')}
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => handleEllipsisClick(page === 'ellipsis1' ? 'left' : 'right')}
                        style={{ cursor: 'pointer' }}
                      >
                        ...
                      </span>
                    )}
                  </span>
                )
              )}

              <button className="pagination-button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserDetailsModal;