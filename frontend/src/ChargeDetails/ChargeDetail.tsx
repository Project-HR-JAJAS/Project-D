import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import './ChargeDetail.css';

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
    const { timeRange } = useParams<{ timeRange: string }>();
    const [data, setData] = useState<ChargeDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [inputValue, setInputValue] = useState('');
    const [showInput, setShowInput] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });
    const [searchTerm, setSearchTerm] = useState('');
    const [searchField, setSearchField] = useState<keyof ChargeDetail>('Charge_Point_ID');
    const [sortConfig, setSortConfig] = useState<{ key: 'Volume' | 'Calculated_Cost' | null; direction: 'asc' | 'desc' | null }>({ key: null, direction: null });
    const itemsPerPage = 50;
    const navigate = useNavigate();

    const columnsToShow: (keyof ChargeDetail)[] = [
        'CDR_ID',
        'Start_datetime',
        'End_datetime',
        'Duration',
        'Volume',
        'Charge_Point_Address',
        'Charge_Point_ZIP',
        'Charge_Point_City',
        'Charge_Point_Country',
        'Charge_Point_Type',
        'Charge_Point_ID',
        'Calculated_Cost'
    ];

    useEffect(() => {
        if (timeRange) {
            setIsLoading(true);
            fetch(`http://localhost:8000/api/charge-details/${timeRange}`, {
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
                .then(data => {
                    const processedData = data.map((item: any) => ({
                        ...item,
                        Calculated_Cost: typeof item.Calculated_Cost === 'string' ?
                            parseFloat(item.Calculated_Cost) :
                            item.Calculated_Cost
                    }));
                    setData(processedData);
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error('Error fetching charge details:', error);
                    setIsLoading(false);
                });
        }
    }, [timeRange]);

    // Filter data based on search term
    const filteredData = data.filter(item => {
        const value = item[searchField];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Sort data based on sortConfig
    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortConfig.key || !sortConfig.direction) return 0;
        
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return 0;
    });

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);

    const formatColumnName = (name: string) => {
        const nameMap: Record<string, string> = {
            'CDR_ID': 'ID',
            'Charge_Point_Address': 'Address',
            'Charge_Point_ZIP': 'ZIP',
            'Charge_Point_City': 'City',
            'Charge_Point_Country': 'Country',
            'Charge_Point_Type': 'Type',
            'Charge_Point_ID': 'Charge Point ID',
            'Calculated_Cost': 'Cost'
        };
        return nameMap[name] || name.replace(/_/g, ' ');
    };

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
        return String(value);
    };

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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

    const handleSort = (key: 'Volume' | 'Calculated_Cost') => {
        setSortConfig(prev => {
            if (prev.key !== key) return { key, direction: 'asc' };
            if (prev.direction === 'asc') return { key, direction: 'desc' };
            if (prev.direction === 'desc') return { key: null, direction: null };
            return { key, direction: 'asc' };
        });
        setCurrentPage(1);
    };

    const getSortIndicator = (key: 'Volume' | 'Calculated_Cost') => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '';
        }
        return '';
    };

    return (
        <div className="charge-details-container">
            <Helmet>
                <title>Charge Details - {timeRange}</title>
            </Helmet>

            <button className="back-button" onClick={() => navigate(-1)}>
                Back to Dashboard
            </button>

            <div className="userstats-search-wrapper">
                <h2 className="time-range-title">Charging Sessions for {getTimeRangeLabel(timeRange || '')}</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                    <select
                        value={searchField}
                        onChange={e => setSearchField(e.target.value as keyof ChargeDetail)}
                        className="userstats-search-dropdown"
                        title="Kies zoekveld"
                    >
                        <option value="Charge_Point_ID">Charge Point ID</option>
                        <option value="Charge_Point_Address">Address</option>
                        <option value="Charge_Point_City">City</option>
                        <option value="Charge_Point_Country">Country</option>
                        <option value="CDR_ID">ID</option>
                    </select>
                    <input
                        type="text"
                        placeholder={`Zoek op ${formatColumnName(searchField)}...`}
                        value={searchTerm}
                        onChange={e => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="userstats-search"
                    />
                </div>
            </div>

            <div className="pagination-info">
                <div>
                    Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedData.length)} of {sortedData.length} records
                </div>
            </div>

            {isLoading ? (
                <div className="loading-message">Loading data...</div>
            ) : data.length === 0 ? (
                <div className="no-data-message">No charging sessions recorded for this time range</div>
            ) : (
                <>
                    <div className="table-container">
                        <table className="charge-details-table">
                            <colgroup>
                                {columnsToShow.map(column => (
                                    <col key={column} className={`column-${column}`} />
                                ))}
                            </colgroup>
                            <thead>
                                <tr className="table-header">
                                    {columnsToShow.map((column) => (
                                        <th 
                                            key={column} 
                                            className={`table-header-cell ${column === 'Volume' || column === 'Calculated_Cost' ? 'sortable-header' : ''}`}
                                            onClick={() => {
                                                if (column === 'Volume' || column === 'Calculated_Cost') {
                                                    handleSort(column);
                                                }
                                            }}
                                            style={column === 'Volume' || column === 'Calculated_Cost' ? { cursor: 'pointer' } : {}}
                                        >
                                            {formatColumnName(column)}
                                            {(column === 'Volume' || column === 'Calculated_Cost') && getSortIndicator(column)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={columnsToShow.length} className="no-data-row">
                                            Geen data gevonden voor de zoekterm: <strong>{searchTerm}</strong>
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((item, index) => (
                                        <tr key={index} className={`table-row ${index % 2 === 0 ? 'even' : 'odd'}`}>
                                            {columnsToShow.map((column) => (
                                                <td
                                                    key={column}
                                                    className="table-cell"
                                                    title={String(item[column as keyof ChargeDetail])}
                                                >
                                                    {formatCellValue(column, item[column as keyof ChargeDetail])}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="page-numbers">
                        <button
                            className="page-number-button"
                            onClick={() => paginate(currentPage - 1)}
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
                                        onBlur={() => setShowInput({ left: false, right: false })}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleInputSubmit('left');
                                        }}
                                        className="page-number-input"
                                        autoFocus
                                    />
                                ) : (
                                    <span
                                        key={idx}
                                        className="page-number-ellipsis"
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
                                        onBlur={() => setShowInput({ left: false, right: false })}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleInputSubmit('right');
                                        }}
                                        className="page-number-input"
                                        autoFocus
                                    />
                                ) : (
                                    <span
                                        key={idx}
                                        className="page-number-ellipsis"
                                        onClick={() => handleEllipsisClick('right')}
                                    >
                                        ...
                                    </span>
                                );
                            }

                            return (
                                <button
                                    key={page}
                                    onClick={() => paginate(Number(page))}
                                    className={`page-number-button ${page === currentPage ? 'active' : ''}`}
                                >
                                    {page}
                                </button>
                            );
                        })}

                        <button
                            className="page-number-button"
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Volgende
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ChargeDetails;
