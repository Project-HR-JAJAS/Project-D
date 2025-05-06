import React, { useEffect, useState } from 'react';
import { fetchChargePointStats, PAGE_SIZE } from './ChargePointStatsTable.api';
import './ChargePointStatsTable.css';

type ChargePointStat = Parameters<typeof fetchChargePointStats>[0] extends number ? Awaited<ReturnType<typeof fetchChargePointStats>>['results'][number] : never;

const ChargePointStatsTable: React.FC = () => {
    const [stats, setStats] = useState<ChargePointStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [showInput, setShowInput] = useState<{left: boolean, right: boolean}>({left: false, right: false});
    const [inputValue, setInputValue] = useState('');

    const fetchStats = async (page: number) => {
        setLoading(true);
        setError(null);
        try {
            const { results, total } = await fetchChargePointStats(page);
            setStats(results);
            setTotal(total);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats(currentPage);
    }, [currentPage]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const handlePageClick = (page: number) => {
        if (page !== currentPage && page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            setShowInput({left: false, right: false});
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

    if (loading) return <div>Laden...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!Array.isArray(stats) || stats.length === 0) return <div>Geen data gevonden.</div>;

    return (
        <div className="charge-point-stats-container">
            <h2>Statistieken per laadpunt (ID)</h2>
            <div style={{ overflowX: 'auto' }}>
                <table className="charge-point-stats-table">
                    <thead>
                        <tr>
                            <th>Charge Point ID</th>
                            <th>Land</th>
                            <th>Aantal transacties</th>
                            <th>Totaal volume (kWh)</th>
                            <th>Totale kosten (€)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.map((stat) => (
                            <tr key={stat.Charge_Point_ID + stat.Charge_Point_Country}>
                                <td>{stat.Charge_Point_ID}</td>
                                <td>{stat.Charge_Point_Country}</td>
                                <td className="text-right">{stat.transaction_count}</td>
                                <td className="text-right">{stat.total_volume.toFixed(2)}</td>
                                <td className="text-right">€ {stat.total_cost.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="pagination-container">
                <button 
                    className="pagination-button"
                    onClick={() => handlePageClick(currentPage - 1)} 
                    disabled={currentPage === 1}
                >
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
                                onBlur={() => setShowInput({left: false, right: false})}
                                onKeyDown={e => { if (e.key === 'Enter') handleInputSubmit('left'); }}
                                className="pagination-input"
                                autoFocus
                            />
                        ) : (
                            <span 
                                key={idx} 
                                className="pagination-ellipsis" 
                                onClick={() => handleEllipsisClick('left')}
                            >
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
                                onBlur={() => setShowInput({left: false, right: false})}
                                onKeyDown={e => { if (e.key === 'Enter') handleInputSubmit('right'); }}
                                className="pagination-input"
                                autoFocus
                            />
                        ) : (
                            <span 
                                key={idx} 
                                className="pagination-ellipsis" 
                                onClick={() => handleEllipsisClick('right')}
                            >
                                ...
                            </span>
                        );
                    }
                    return (
                        <button
                            key={page}
                            onClick={() => handlePageClick(Number(page))}
                            className={`pagination-button ${page === currentPage ? 'active' : ''}`}
                        >
                            {page}
                        </button>
                    );
                })}
                <button 
                    className="pagination-button"
                    onClick={() => handlePageClick(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                >
                    Volgende
                </button>
            </div>
        </div>
    );
};

export default ChargePointStatsTable;