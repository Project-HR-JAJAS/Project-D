import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';

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
    const itemsPerPage = 50;
    const navigate = useNavigate();

    // Define the columns we want to display
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
                    // Convert string numbers to actual numbers if needed
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

    // Calculate pagination values
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

    const formatColumnName = (name: string) => {
        // Custom formatting for some column names
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
        if (value === null || value === undefined) {
            return 'N/A';
        }

        if (column === 'Calculated_Cost') {
            return typeof value === 'number' ? `€${value.toFixed(2)}` : String(value);
        }

        if (column === 'Duration') {
            return typeof value === 'number' ? `${value} minutes` : String(value);
        }

        if (column === 'Start_datetime' || column === 'End_datetime') {
            // Format date/time if needed
            return new Date(value).toLocaleString();
        }

        return String(value);
    };

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <Helmet>
                <title>Charge Details - {timeRange}</title>
            </Helmet>

            <button
                onClick={() => navigate(-1)}
                style={{
                    marginBottom: '20px',
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Back to Dashboard
            </button>

            <h2 style={{ marginBottom: '20px' }}>Charging Sessions for {getTimeRangeLabel(timeRange || '')}</h2>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    Loading data...
                </div>
            ) : data.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    No charging sessions recorded for this time range
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, data.length)} of {data.length} records
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                style={{
                                    padding: '5px 10px',
                                    backgroundColor: currentPage === 1 ? '#cccccc' : '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Previous
                            </button>
                            <span style={{ padding: '5px 10px' }}>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                style={{
                                    padding: '5px 10px',
                                    backgroundColor: currentPage === totalPages ? '#cccccc' : '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '14px',
                            tableLayout: 'fixed'
                        }}>
                            <colgroup>
                                {columnsToShow.map(column => (
                                    <col key={column} style={{
                                        width: column === 'Charge_Point_Address' ? '250px' :
                                            column === 'CDR_ID' ? '150px' : 'auto'
                                    }} />
                                ))}
                            </colgroup>
                            <thead>
                                <tr style={{ backgroundColor: '#f2f2f2' }}>
                                    {columnsToShow.map((column) => (
                                        <th
                                            key={column}
                                            style={{
                                                padding: '12px',
                                                border: '1px solid #ddd',
                                                textAlign: 'left',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {formatColumnName(column)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((item, index) => (
                                    <tr
                                        key={index}
                                        style={{
                                            border: '1px solid #ddd',
                                            backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9'
                                        }}
                                    >
                                        {columnsToShow.map((column) => (
                                            <td
                                                key={column}
                                                style={{
                                                    padding: '10px',
                                                    border: '1px solid #ddd',
                                                    maxWidth: '200px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                                title={String(item[column as keyof ChargeDetail])}
                                            >
                                                {formatCellValue(column, item[column as keyof ChargeDetail])}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '5px' }}>
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
                                    onClick={() => paginate(pageNumber)}
                                    style={{
                                        padding: '5px 10px',
                                        backgroundColor: currentPage === pageNumber ? '#007bff' : '#f2f2f2',
                                        color: currentPage === pageNumber ? 'white' : '#333',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {pageNumber}
                                </button>
                            );
                        })}
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                            <span style={{ padding: '5px' }}>...</span>
                        )}
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                            <button
                                onClick={() => paginate(totalPages)}
                                style={{
                                    padding: '5px 10px',
                                    backgroundColor: currentPage === totalPages ? '#007bff' : '#f2f2f2',
                                    color: currentPage === totalPages ? 'white' : '#333',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
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

export default ChargeDetails; 