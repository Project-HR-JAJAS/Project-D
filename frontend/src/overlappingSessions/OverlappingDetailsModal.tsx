import React, { useEffect, useState } from 'react';
import './OverlappingDetailsModal.css';
import '../css/UniversalTableCss.css';

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

interface OverlappingDetailsModalProps {
  cdrId: string;
  onClose: () => void;
}

const OverlappingDetailsModal: React.FC<OverlappingDetailsModalProps> = ({ cdrId, onClose }) => {
  const [details, setDetails] = useState<OverlappingSession[]>([]);
  const [loading, setLoading] = useState(true);

  /* Pagination state */
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [showInput, setShowInput] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:8000/api/overlapping-details/${cdrId}`)
      .then(res => res.json())
      .then(data => {
        const cleaned = data.map((item: any) => ({
          ...item,
          Volume: parseFloat((item.Volume ?? '0').toString().replace(',', '.')),
          Calculated_Cost: typeof item.Calculated_Cost === 'string'
            ? parseFloat(item.Calculated_Cost.replace(',', '.'))
            : item.Calculated_Cost,
        }));
        setDetails(cleaned);
        setCurrentPage(1); // reset page when new data arrives
      })
      .finally(() => setLoading(false));
  }, [cdrId]);

  const formatDate = (value: string) => new Date(value).toLocaleString();

  /* Pagination helpers */
  const totalPages = Math.ceil(details.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = details.slice(indexOfFirstItem, indexOfLastItem);

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
    for (let i = start; i <= end; i++) middlePages.push(i);
    const allPages: (number | string)[] = [...firstPages];
    if (start > 4) allPages.push('ellipsis1');
    for (const p of middlePages) if (!allPages.includes(p)) allPages.push(p);
    if (end < totalPages - 3) allPages.push('ellipsis2');
    for (const p of lastPages) if (!allPages.includes(p)) allPages.push(p);
    return allPages;
  };

  return (
    <div className="details-modal-overlay">
      <div className="details-modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2 className="details-modal-title">Details for CDR: {cdrId}</h2>
        {loading ? (
          <p className="modal-loading">Loading...</p>
        ) : details.length === 0 ? (
          <p className="modal-empty">No details found.</p>
        ) : (
          <>
            <table className="modal-table">
              <thead>
                <tr>
                  <th>CDR ID</th>
                  <th>Authentication ID</th>
                  <th>Charge Point ID</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>City</th>
                  <th>Country</th>
                  <th>Volume (kWh)</th>
                  <th>Cost (€)</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(detail => (
                  <tr key={detail.CDR_ID} className={detail.CDR_ID === cdrId ? 'highlight-bold-row' : ''}>
                    <td>{detail.CDR_ID}</td>
                    <td>{detail.Authentication_ID}</td>
                    <td>{detail.Charge_Point_ID}</td>
                    <td>{formatDate(detail.Start_datetime)}</td>
                    <td>{formatDate(detail.End_datetime)}</td>
                    <td>{detail.Charge_Point_City}</td>
                    <td>{detail.Charge_Point_Country}</td>
                    <td>{detail.Volume}</td>
                    <td>{detail.Calculated_Cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination controls */}
            <div className="pagination-container">
              <button
                className="pagination-button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
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
                        placeholder="..."
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
              <button
                className="pagination-button"
                onClick={() => goToPage(currentPage + 1)}
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

export default OverlappingDetailsModal;
