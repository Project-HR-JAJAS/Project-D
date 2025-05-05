import React, { useEffect, useState } from 'react';
import './OverlappingSessions.css';
import OverlappingModal from './OverlappingModal';

interface OverlappingSession {
  CDR_ID: string;
  Authentication_ID: string;
  Start_datetime: string;
  End_datetime: string;
  Charge_Point_City: string;
  Volume: number;
  OverlappingCount?: number;
}

const OverlappingSessions: React.FC = () => {
  const [data, setData] = useState<OverlappingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCdrId, setSelectedCdrId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const itemsPerPage = 50;

  useEffect(() => {
    fetch("http://localhost:8000/api/overlapping-sessions")
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (value: string) => new Date(value).toLocaleString();

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="overlap-container">
      <h2 className="overlap-title">Overlapping Sessions per Charge Card</h2>

      {loading ? (
        <div className="overlap-loading">Loading...</div>
      ) : data.length === 0 ? (
        <div className="overlap-empty">No overlapping sessions found</div>
      ) : (
        <>
          <div className="pagination-info">
            <div>
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, data.length)} of {data.length} records
            </div>
            <div className="pagination-controls">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
              >
                Previous
              </button>
              <span className="page-indicator">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`pagination-button ${currentPage === totalPages ? 'disabled' : ''}`}
              >
                Next
              </button>
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
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber: number;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => goToPage(pageNumber)}
                  className={`page-number-button ${currentPage === pageNumber ? 'active' : ''}`}
                >
                  {pageNumber}
                </button>
              );
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span className="page-number-ellipsis">...</span>
            )}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <button
                onClick={() => goToPage(totalPages)}
                className={`page-number-button ${currentPage === totalPages ? 'active' : ''}`}
              >
                {totalPages}
              </button>
            )}
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