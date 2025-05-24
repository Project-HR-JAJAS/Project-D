import React, { useEffect, useRef, useState } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { SuspCharges } from './SuspCharges';
import DataTablePreview from '../tabel/DataTablePreview';
import { fetchChargeData, ChargeData } from './Home.api';
import './Home.css';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(...registerables);

const Home: React.FC = () => {
    const chartRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstanceRef = useRef<ChartJS | null>(null);
    const [chargeData, setChargeData] = useState<ChargeData[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchChargeData().then(setChargeData);
    }, []);


    useEffect(() => {
        if (chartRef.current && chargeData.length > 0) {
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                if (chartInstanceRef.current) {
                    chartInstanceRef.current.destroy();
                }

                const labels = chargeData.map(item => item.TimeRange);
                const chargeCounts = chargeData.map(item => item.TotalCharges);

                const backgroundColors = [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)'
                ];

                chartInstanceRef.current = new ChartJS(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Fraudulent Charges',
                            data: chargeCounts,
                            backgroundColor: backgroundColors,
                            borderWidth: 1,
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Fraudulent Charging Sessions by Time of Day',
                                font: {
                                    size: 16
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    afterLabel: function (context) {
                                        const timeRange = labels[context.dataIndex];
                                        return `Click to view fraud details for ${timeRange}`;
                                    }
                                }
                            },
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Number of Fraudulent Charging Sessions'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Time Range'
                                }
                            }
                        },
                        onClick: (event, elements) => {
                            if (elements && elements.length > 0) {
                                const index = elements[0].index;
                                const clickedRange = labels[index];
                                navigate(`/charges/${clickedRange}`);
                            }
                        }
                    }
                });
            }
        }

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, [chargeData, navigate]);

    // Donut chart data (mocked for now, replace with real data if available)
    const donutData = {
        labels: ['0000-0900', '0900-1300', '1300-1700', '1700-2100', '2100-0000'],
        datasets: [
            {
                data: [23.4, 29.2, 29.6, 17.2, 0.6],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)'
                ],
                borderWidth: 1,
            },
        ],
    };
    const donutOptions = {
        cutout: '70%',
        plugins: {
            legend: {
                display: true,
                position: 'right' as const,
                labels: {
                    color: '#333',
                    font: { size: 14 }
                }
            }
        }
    };

    return (
        <div className="dashboard-outer-container">
            <h2 className="dashboard-main-title">Dashboard</h2>
            <div className="dashboard-charts-row">
                <div className="chart-container" style={{ width: '60%', minWidth: 350 }}>
                    <canvas id="chargeChart" ref={chartRef}></canvas>
                </div>
                <div className="donut-container" style={{ width: '40%', minWidth: 250, background: '#fff', borderRadius: 8, boxShadow: '0 0 10px rgba(0,0,0,0.07)', padding: 20, marginLeft: 24 }}>
                    <Doughnut data={donutData} options={donutOptions} />
                </div>
            </div>
            <div className="dashboard-table-card">
                <DataTablePreview />
            </div>
        </div>
    );
};

export default Home;
