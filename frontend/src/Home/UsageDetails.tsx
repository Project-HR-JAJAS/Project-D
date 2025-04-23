import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';

interface CDRData {
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
    Product_Type: string;
    Tariff_Type: string;
    Authentication_ID: string;
    Contract_ID: string;
    Meter_ID: string;
    OBIS_Code: string;
    Charge_Point_ID: string;
    Service_Provider_ID: string;
    Infra_Provider_ID: string;
    Calculated_Cost: number;
    [key: string]: any; // Index signature for additional properties
}

const UsageDetails: React.FC = () => {
    const { timeRange } = useParams<{ timeRange: string }>();
    const [data, setData] = useState<CDRData[]>([]);
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);

    <Helmet>
        <title>Usage Details - {timeRange}</title>
    </Helmet>

    useEffect(() => {
        if (timeRange) {
            setIsLoading(true);
            fetch(`http://localhost:5000/api/usage-data/${timeRange}`)
                .then(res => res.json())
                .then(data => {
                    setData(data);
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error('Error fetching detailed data:', error);
                    setIsLoading(false);
                });
        }
    }, [timeRange]);

    // Function to format the column names for display
    const formatColumnName = (name: string) => {
        return name.replace(/_/g, ' ');
    };

    // Get all column names from the first record (if available)
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
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
                Back to Chart
            </button>
            <h2 style={{ marginBottom: '20px' }}>Usage Details for {timeRange}</h2>
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    Loading data...
                </div>
            ) : data.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    No data available for this time range
                </div>
            ) : (
                <div style={{ overflowX: 'auto', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '14px',
                        tableLayout: 'fixed'
                    }}>
                        <colgroup>
                            {columns.map(column => (
                                <col key={column} style={{
                                    width: column === 'Charge_Point_Address' ? '250px' :
                                        column === 'CDR_ID' ? '150px' : 'auto'
                                }} />
                            ))}
                        </colgroup>
                        <thead>
                            <tr style={{ backgroundColor: '#f2f2f2' }}>
                                {columns.map((column) => (
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
                            {data.map((item, index) => (
                                <tr
                                    key={index}
                                    style={{
                                        border: '1px solid #ddd',
                                        backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9'
                                    }}
                                >
                                    {columns.map((column) => (
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
                                            title={String(item[column])}
                                        >
                                            {String(item[column])}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {data.length === 0 && (
                <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#666'
                }}>
                    No data available for this time range
                </div>
            )}
        </div>
    );
};

export default UsageDetails;