import React, { useEffect, useRef, useState } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { TabelForm } from '../tabel/Tabel';
import { SuspCharges } from './SuspCharges';

ChartJS.register(...registerables);

interface ChargeData {
    TimeRange: string;
    TotalCharges: number;
}

const Home: React.FC = () => {
    const chartRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstanceRef = useRef<ChartJS | null>(null);
    const [chargeData, setChargeData] = useState<ChargeData[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:8000/api/charge-counts')
            .then(res => res.json())
            .then(data => {
                const timeRanges = ['0000-0900', '0900-1300', '1300-1700', '1700-2100', '2100-0000'];
                const completeData = timeRanges.map(tr => 
                    data.find((item: ChargeData) => item.TimeRange === tr) || 
                    { TimeRange: tr, TotalCharges: 0 }
                );
                setChargeData(completeData);
            })
            .catch(error => console.error('Error fetching charge data:', error));
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
                            label: 'Total Charges',
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
                                text: 'Charging Sessions by Time of Day',
                                font: {
                                    size: 16
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    afterLabel: function(context) {
                                        const timeRange = labels[context.dataIndex];
                                        return `Click to view details for ${timeRange}`;
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
                                    text: 'Number of Charging Sessions'
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

    return (
        <div className="dashboard-container">
            <Helmet>
                <title>Charging Sessions Dashboard</title>
            </Helmet>
            
            <div>
                <SuspCharges />
            </div>
    
            <h1 className="dashboard-title">Charging Sessions by Time of Day</h1>
    
            <div className="chart-container">
                <canvas id="chargeChart" ref={chartRef} height="400"></canvas>
            </div>
    
            <div className="tabel-wrapper">
                <TabelForm />
            </div>
        </div>
    );
};

export default Home;