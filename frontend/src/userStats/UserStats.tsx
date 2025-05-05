import React, { useEffect, useState } from 'react';
import './UserStats.css';

interface UserStat {
  Authentication_ID: string;
  TransactionCount: number;
  TotalVolume: number;
  TotalCost: number;
}

const UserStats: React.FC = () => {
  const [data, setData] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    fetch("http://localhost:8000/api/user-stats")
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

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
    <div className="userstats-container">
      <h2 className="userstats-title">Gebruiker Statistieken per PasID</h2>

      {loading ? (
        <div className="userstats-loading">Loading...</div>
      ) : data.length === 0 ? (
        <div className="userstats-empty">Geen gegevens gevonden</div>
      ) : (
        <>
          <div className="userstats-table-wrapper">
            <table className="userstats-table">
              <thead>
                <tr>
                  <th>Authentication ID</th>
                  <th>Aantal Transacties</th>
                  <th>Totaal Volume (kWh)</th>
                  <th>Totaal Kosten (€)</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'even' : 'odd'}>
                    <td>{row.Authentication_ID}</td>
                    <td>{row.TransactionCount}</td>
                    <td>{row.TotalVolume.toFixed(2)}</td>
                    <td>{row.TotalCost.toFixed(2)}</td>
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
        </>
      )}
    </div>
  );
};

export default UserStats;
