import React, { useEffect, useState } from 'react';
import './OverlappingModal.css';
import '../css/UniversalTableCss.css'; // Reuse global pagination & table styles
import TableExportButton from '../exportButton/TableExportButton';
import OverlappingDetailsModal from './OverlappingDetailsModal';

interface OverlappingSession {
  CDR_ID: string;
  Authentication_ID: string;
  Start_datetime: string;
  End_datetime: string;
  Charge_Point_City: string;
  Volume: number;
  Charge_Point_ID: string;
  Charge_Point_Country: string;
  Calculated_Cost: number;
}

interface OverlappingModalProps {
  cdrId?: string;
  authId: string;
  onClose: () => void;
}

const OverlappingModal: React.FC<OverlappingModalProps> = ({ cdrId, authId, onClose }) => {
  const [sessions, setSessions] = useState<OverlappingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof OverlappingSession | null; direction: 'asc' | 'desc' | null }>({ key: null, direction: null });

  const [selectedCdrForDetails, setSelectedCdrForDetails] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  /* Pagination state */
  const itemsPerPage = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const [showInput, setShowInput] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:8000/api/overlapping-sessions/${authId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // Check if data is an array before calling map
        if (!Array.isArray(data)) {
          console.error('Expected array but received:', data);
          setSessions([]);
          return;
        }
        
        const cleaned = data.map((item: any) => ({
          ...item,
          Volume: parseFloat((item.Volume ?? '0').toString().replace(',', '.')),
          Calculated_Cost: typeof item.Calculated_Cost === 'string' ? parseFloat(item.Calculated_Cost.replace(',', '.')) : item.Calculated_Cost,
        }));
        setSessions(cleaned);
      })
      .catch(error => {
        console.error('Error fetching overlapping sessions:', error);
        setSessions([]);
      })
      .finally(() => setLoading(false));
  }, [authId]);

  const formatDate = (value: string) => new Date(value).toLocaleString();

  /* Sorting helpers */
  const handleSort = (key: keyof OverlappingSession) => {
    setSortConfig(prev => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      if (prev.direction === 'desc') return { key: null, direction: null };
      return { key, direction: 'asc' };
    });
    setCurrentPage(1); // reset to first page on sort change
  };

  const getSortIndicator = (key: keyof OverlappingSession) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '';
    }
    return '';
  };

  /* Apply sorting */
  const sortedSessions = React.useMemo(() => {
    const arr = [...sessions];
    if (sortConfig.key && sortConfig.direction) {
      arr.sort((a, b) => {
        const aVal = a[sortConfig.key!] ?? '';
        const bVal = b[sortConfig.key!] ?? '';
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return sortConfig.direction === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
      });
    }
    return arr;
  }, [sessions, sortConfig]);

  /* Pagination helpers */
  const totalPages = Math.ceil(sortedSessions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedSessions.slice(indexOfFirstItem, indexOfLastItem);

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

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    const firstPages = [1, 2, 3];
    const lastPages = [totalPages - 2, totalPages - 1, totalPages];
    let start = Math.max(4, currentPage - 1);
    let end = Math.min(totalPages - 3, currentPage + 1);
    const middlePages: number[] = [];
    for (let i = start; i <= end; i++) {
      middlePages.push(i);
    }
    const allPages: (number | string)[] = [...firstPages];
    if (start > 4) allPages.push('ellipsis1');
    for (const p of middlePages) {
      if (!allPages.includes(p)) allPages.push(p);
    }
    if (end < totalPages - 3) allPages.push('ellipsis2');
    for (const p of lastPages) {
      if (!allPages.includes(p)) allPages.push(p);
    }
    return allPages;
  };

  const exportColumns = [
    { label: 'CDR ID', key: 'CDR_ID' },
    { label: 'Charge Point ID', key: 'Charge_Point_ID' },
    { label: 'Start Time', key: 'Start_datetime' },
    { label: 'End Time', key: 'End_datetime' },
    { label: 'City', key: 'Charge_Point_City' },
    { label: 'Country', key: 'Charge_Point_Country' },
    { label: 'Volume (kWh)', key: 'Volume' },
    { label: 'Cost (€)', key: 'Calculated_Cost' },
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2 className="modal-title">Overlapping Sessions for Authentication ID: {authId}</h2>
        {loading ? (
          <p className="modal-loading">Loading...</p>
        ) : sessions.length === 0 ? (
          <p className="modal-empty">No overlapping sessions found.</p>
        ) : (
          <>
            <TableExportButton
              data={sortedSessions}
              columns={exportColumns}
              filename={`overlapping_sessions_${cdrId}`}
              format="xlsx"
            />
            <table className="modal-table">
              <thead>
                <tr>
                  <th>CDR ID</th>
                  <th>Charge Point ID</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>City</th>
                  <th>Country</th>
                  <th className="sortable-header" onClick={() => handleSort('Volume')}>
                    Volume (kWh){getSortIndicator('Volume')}
                  </th>
                  <th className="sortable-header" onClick={() => handleSort('Calculated_Cost')}>
                    Cost (€){getSortIndicator('Calculated_Cost')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(session => (
                  <tr
                    key={session.CDR_ID}
                    className={session.CDR_ID === cdrId ? 'highlight-row' : ''}
                    onClick={() => {
                      setSelectedCdrForDetails(session.CDR_ID);
                      setShowDetailsModal(true);
                    }}
                  >
                    <td>{session.CDR_ID}</td>
                    <td>{session.Charge_Point_ID}</td>
                    <td>{formatDate(session.Start_datetime)}</td>
                    <td>{formatDate(session.End_datetime)}</td>
                    <td>{session.Charge_Point_City}</td>
                    <td>{session.Charge_Point_Country}</td>
                    <td>{session.Volume}</td>
                    <td>{session.Calculated_Cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination controls */}
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
                        placeholder={`${page}`}
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
              <button className="pagination-button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
            {/* Details modal */}
            {showDetailsModal && selectedCdrForDetails && (
              <OverlappingDetailsModal cdrId={selectedCdrForDetails} onClose={() => setShowDetailsModal(false)} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OverlappingModal;
