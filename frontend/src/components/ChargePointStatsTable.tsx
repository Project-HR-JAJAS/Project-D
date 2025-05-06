import React, { useEffect, useState } from 'react';

interface ChargePointStat {
    Charge_Point_ID: string;
    Charge_Point_Country: string;
    transaction_count: number;
    total_volume: number;
    total_cost: number;
}

const PAGE_SIZE = 20;

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
            const response = await fetch(`http://localhost:8000/api/charge-point-stats?page=${page}&page_size=${PAGE_SIZE}`);
            if (!response.ok) {
                throw new Error('Failed to fetch statistics');
            }
            const data = await response.json();
            setStats(Array.isArray(data.results) ? data.results : []);
            setTotal(typeof data.total === 'number' ? data.total : 0);
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

    // Google-like advanced pagination logic
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 9) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            // Always show first 3
            pages.push(1, 2, 3);
            // Show left ... if needed
            if (currentPage > 5) pages.push('left-ellipsis');
            // Show currentPage-1, currentPage, currentPage+1 if in the middle
            let start = Math.max(4, currentPage - 1);
            let end = Math.min(totalPages - 3, currentPage + 1);
            for (let i = start; i <= end; i++) {
                if (i > 3 && i < totalPages - 2) pages.push(i);
            }
            // Show right ... if needed
            if (currentPage < totalPages - 4) pages.push('right-ellipsis');
            // Always show last 3
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
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h2>Statistieken per laadpunt (ID)</h2>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Charge Point ID</th>
                            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Land</th>
                            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Aantal transacties</th>
                            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Totaal volume (kWh)</th>
                            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Totale kosten (€)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.map((stat) => (
                            <tr key={stat.Charge_Point_ID + stat.Charge_Point_Country}>
                                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{stat.Charge_Point_ID}</td>
                                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{stat.Charge_Point_Country}</td>
                                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{stat.transaction_count}</td>
                                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{stat.total_volume.toFixed(2)}</td>
                                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>€ {stat.total_cost.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => handlePageClick(currentPage - 1)} disabled={currentPage === 1} style={{ padding: '6px 12px' }}>Vorige</button>
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
                                style={{ width: 40, textAlign: 'center', border: '1px solid #1976d2', borderRadius: 4 }}
                                autoFocus
                            />
                        ) : (
                            <span key={idx} style={{ padding: '6px 12px', color: '#888', cursor: 'pointer' }} onClick={() => handleEllipsisClick('left')}>...</span>
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
                                style={{ width: 40, textAlign: 'center', border: '1px solid #1976d2', borderRadius: 4 }}
                                autoFocus
                            />
                        ) : (
                            <span key={idx} style={{ padding: '6px 12px', color: '#888', cursor: 'pointer' }} onClick={() => handleEllipsisClick('right')}>...</span>
                        );
                    }
                    return (
                        <button
                            key={page}
                            onClick={() => handlePageClick(Number(page))}
                            style={{
                                padding: '6px 12px',
                                fontWeight: page === currentPage ? 'bold' : 'normal',
                                background: page === currentPage ? '#1976d2' : 'white',
                                color: page === currentPage ? 'white' : '#1976d2',
                                border: '1px solid #1976d2',
                                borderRadius: '4px',
                                margin: '0 2px',
                                cursor: page === currentPage ? 'default' : 'pointer',
                                pointerEvents: page === currentPage ? 'none' : 'auto',
                            }}
                        >{page}</button>
                    );
                })}
                <button onClick={() => handlePageClick(currentPage + 1)} disabled={currentPage === totalPages} style={{ padding: '6px 12px' }}>Volgende</button>
            </div>
        </div>
    );
};

export default ChargePointStatsTable; 