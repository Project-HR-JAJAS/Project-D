import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../css/UniversalTableCss.css';
import TableExportButton from '../exportButton/TableExportButton';


interface ChargeDetail {
    CDR_ID: string;
    Start_datetime: string;
    End_datetime: string;
    Duration: number;
    Volume: number;
    Charge_Point_Address: string;
    Charge_Point_ZIP: string;
    Charge_Point_City: string;
    Charge_Point_Country: string;
    Charge_Point_Type: string;
    Charge_Point_ID: string;
    Calculated_Cost: number;
}

const ChargeDetails: React.FC = () => {
    const { timeRange, reasonKey } = useParams<{ timeRange: string; reasonKey: string }>();
    const [data, setData] = useState<ChargeDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [inputValue, setInputValue] = useState('');
    const [showInput, setShowInput] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });
    const [searchTerm, setSearchTerm] = useState('');
    const [searchField, setSearchField] = useState<'CDR_ID' | 'Address' | 'City' | 'Country' | 'Charge_Point_ID'>('CDR_ID');
    const [sortConfig, setSortConfig] = useState<{ key: keyof ChargeDetail | null; direction: 'asc' | 'desc' | null }>({ key: null, direction: null });
    const navigate = useNavigate();
    const itemsPerPage = 15;
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    // Map reason keys to human-readable names (matching Fraude_detectie.py)
    const reasonNameMap: { [key: string]: string } = {
        Reason1: 'High volume in short duration',
        Reason2: 'Unusual cost per kWh',
        Reason3: 'Rapid consecutive sessions',
        Reason4: 'Overlapping sessions',
        Reason5: 'Repeated behavior',
        Reason6: 'Data integrity violation',
        Reason7: 'Impossible travel',
    };

    const filteredStats = data.filter((stat: ChargeDetail) => {
        const fieldMap: Record<typeof searchField, keyof ChargeDetail> = {
            CDR_ID: 'CDR_ID',
            Address: 'Charge_Point_Address',
            City: 'Charge_Point_City',
            Country: 'Charge_Point_Country',
            Charge_Point_ID: 'Charge_Point_ID',
        };
        const value = stat[fieldMap[searchField]] ?? '';
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });

    const sortedData = [...filteredStats];
    if (sortConfig.key && sortConfig.direction) {
        sortedData.sort((a, b) => {
        const aVal = sortConfig.key ? a[sortConfig.key] ?? 0 : 0;
        const bVal = sortConfig.key ? b[sortConfig.key] ?? 0 : 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return 0;
        });
    }

    useEffect(() => {
        if (reasonKey) {
            setIsLoading(true);
            fetch(`http://localhost:8000/api/charge-details/reason/${reasonKey}`, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            })
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then((data: any[]) => {
                    const processedData: ChargeDetail[] = data.map((item): ChargeDetail => ({
                        ...item,
                        Volume: parseFloat((item.Volume ?? '0').toString().replace(',', '.')),
                        Calculated_Cost: parseFloat((item.Calculated_Cost ?? '0').toString().replace(',', '.')),
                    }));
                    setData(processedData);
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error('Error fetching charge details:', error);
                    setIsLoading(false);
                });
        }
    }, [reasonKey]);

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);

    const getTimeRangeLabel = (range: string) => {
        const labels: Record<string, string> = {
            '0000-0900': 'Night (00:00-09:00)',
            '0900-1300': 'Morning (09:00-13:00)',
            '1300-1700': 'Afternoon (13:00-17:00)',
            '1700-2100': 'Evening (17:00-21:00)',
            '2100-0000': 'Late Night (21:00-00:00)'
        };
        return labels[range] || range;
    };

    const formatCellValue = (column: string, value: any) => {
        if (value === null || value === undefined) return 'N/A';
        if (column === 'Calculated_Cost') return typeof value === 'number' ? `€${value.toFixed(2)}` : String(value);
        if (column === 'Duration') return typeof value === 'number' ? `${value} minutes` : String(value);
        if (column === 'Start_datetime' || column === 'End_datetime') return new Date(value).toLocaleString();
        return value;
    };

    const handlePageClick = (page: number) => {
        if (page !== currentPage && page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            setShowInput({left: false, right: false});
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
            return pages;
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

    const handleSort = (key: keyof ChargeDetail) => {
        setSortConfig(prev => {
            if (prev.key !== key) return { key, direction: 'asc' };
            if (prev.direction === 'asc') return { key, direction: 'desc' };
            if (prev.direction === 'desc') return { key: null, direction: null };
            return { key, direction: 'asc' };
        });
        setCurrentPage(1);
    };

    const getSortIndicator = (key: keyof ChargeDetail) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '';
        }
        return '';
    };

    if (isLoading) return <div>Loading...</div>;
    if (data.length === 0) return <h3>No charging sessions recorded for this time range</h3>;

    const exportColumns = [
    { label: 'CDR ID', key: 'CDR_ID' },
    { label: 'Start DateTime', key: 'Start_datetime' },
    { label: 'End DateTime', key: 'End_datetime' },
    { label: 'Duration', key: 'Duration' },
    { label: 'Volume (kWh)', key: 'Volume' },
    { label: 'Address', key: 'Charge_Point_Address' },
    { label: 'ZIP', key: 'Charge_Point_ZIP' },
    { label: 'City', key: 'Charge_Point_City' },
    { label: 'Country', key: 'Charge_Point_Country' },
    // { label: 'Type', key: 'Charge_Point_Type' },
    { label: 'Charge Point ID', key: 'Charge_Point_ID' },
    { label: 'Cost (€)', key: 'Calculated_Cost' },
    ];

    return (
        <div className="table-container">
            <div className= 'table-search-wrapper'>
                <h2>Fraud Cases for {reasonNameMap[reasonKey as keyof typeof reasonNameMap] || reasonKey}</h2>
                <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <label>From:</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                <label>To:</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                </div>
                <TableExportButton
                    data={sortedData}
                    columns={exportColumns}
                    filename={`charge_details_${timeRange}`}
                    format="xlsx"
                    dateKey="Start_datetime"
                    fromDate={fromDate}
                    toDate={toDate}
                />
                    <select
                        value={searchField}
                        title="Search by"
                        onChange={e => setSearchField(e.target.value as 'CDR_ID' | 'Address' | 'City' | 'Country' | 'Charge_Point_ID')}
                        className="table-search-dropdown"
                    >
                        <option value="CDR_ID">CDR ID</option>
                        <option value="Address">Address</option>
                        <option value="City">City</option>
                        <option value="Country">Country</option>
                        <option value="Charge_Point_ID">Charge Point ID</option>
                    </select>
                    <input
                        type="text"
                        placeholder={
                            searchField === 'CDR_ID'
                                ? 'Search by CDR ID...'
                                : searchField === 'Address'
                                ? 'Search by Address...'
                                : searchField === 'City'
                                ? 'Search by City...'
                                : searchField === 'Country'
                                ? 'Search by Country...'
                                : 'Search by Charge Point ID...'
                        }
                        value={searchTerm}
                        onChange={e => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="table-search"
                    />
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="table-form">
                    <thead>
                        <tr>
                            <th> CDR ID</th>
                            <th>Start DateTime</th>
                            <th>End DateTime</th>
                            <th>Duration </th>
                            <th className="sortable-header" onClick={() => handleSort('Volume')}>
                                Volume {getSortIndicator('Volume')}
                            </th>
                            <th>Address</th>
                            <th>ZIP</th>
                            <th>City</th>
                            <th>Country</th>
                            {/* <th>Type</th> */}
                            <th>Charge Point ID </th>
                            <th className="sortable-header" onClick={() => handleSort('Calculated_Cost')}>
                                Cost {getSortIndicator('Calculated_Cost')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="no-data-row">
                                    Geen data gevonden voor de zoekterm: <strong>{searchTerm}</strong>
                                </td>
                            </tr>
                        ) : (
                            currentItems.map((item) => (
                                <tr
                                    key={item.CDR_ID}
                                    onClick={() => navigate(`/cdr-details/${item.CDR_ID}`)}
                                    className="clickable-row"
                                >
                                    <td>{formatCellValue('CDR_ID', item.CDR_ID)}</td>
                                    <td>{formatCellValue('Start_datetime', item.Start_datetime)}</td>
                                    <td>{formatCellValue('End_datetime', item.End_datetime)}</td>
                                    <td>{formatCellValue('Duration', item.Duration)}</td>
                                    <td className="text-right">{formatCellValue('Volume', item.Volume)}</td>
                                    <td>{formatCellValue('Charge_Point_Address', item.Charge_Point_Address)}</td>
                                    <td>{formatCellValue('Charge_Point_ZIP', item.Charge_Point_ZIP)}</td>
                                    <td>{formatCellValue('Charge_Point_City', item.Charge_Point_City)}</td>
                                    <td>{formatCellValue('Charge_Point_Country', item.Charge_Point_Country)}</td>
                                    {/* <td>{formatCellValue('Charge_Point_Type', item.Charge_Point_Type)}</td> */}
                                    <td>{formatCellValue('Charge_Point_ID', item.Charge_Point_ID)}</td>
                                    <td className="text-right">{formatCellValue('Calculated_Cost', item.Calculated_Cost)}</td>
                                </tr>
                            ))
                        )}
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
                                        placeholder={'-'}
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
        </div>
    );
};

export default ChargeDetails;
