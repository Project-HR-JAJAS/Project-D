import React, { useEffect, useRef, useState } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import DataTablePreview from '../tabel/DataTablePreview';
import { fetchChargeData, ChargeData, fetchFraudReasons, FraudReasonData } from './Home.api';
import './Home.css';
import { Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(...registerables);
ChartJS.register(ChartDataLabels);

const Home: React.FC = () => {
    const chartRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstanceRef = useRef<ChartJS | null>(null);
    const [chargeData, setChargeData] = useState<ChargeData[]>([]);
    const [fraudReasons, setFraudReasons] = useState<FraudReasonData[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchChargeData().then(setChargeData);
    }, []);

    useEffect(() => {
        fetchFraudReasons('Reason1').then(setFraudReasons);
    }, []);

    useEffect(() => {
        if (chartRef.current && fraudReasons.length > 0) {
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                if (chartInstanceRef.current) {
                    chartInstanceRef.current.destroy();
                }

                const labels = Object.keys(fraudReasons[0].reason_percentages || {});
                const percentages = Object.values(fraudReasons[0].reason_percentages || {});
                const counts = Object.values(fraudReasons[0].reason_counts || {});

                const backgroundColors = [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(199, 199, 199, 0.7)'
                ];

                chartInstanceRef.current = new ChartJS(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Fraud Case Percentage',
                            data: percentages,
                            backgroundColor: backgroundColors,
                            borderWidth: 1,
                            minBarLength: 5,
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Distribution of Fraud Cases by Reason (%)',
                                font: { size: 16 }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context: any) {
                                        const count = counts[context.dataIndex];
                                        const percent = context.parsed;
                                        return `${count} cases`;
                                    }
                                }
                            },
                            legend: { display: false },
                            datalabels: {
                                anchor: 'end',
                                align: 'end',
                                formatter: function(value, context) {
                                    return `${counts[context.dataIndex]} (${value}%)`;
                                },
                                font: { weight: 'bold' }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Percentage of Total Fraud Cases'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Fraud Case Type'
                                }
                            }
                        },
                        onClick: (event, elements) => {
                            if (elements && elements.length > 0) {
                                const index = elements[0].index;
                                const reasonKey = labels[index];
                                navigate(`/charge-details/reason/${reasonKey}`);
                            }
                        },
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
    }, [fraudReasons, navigate]);

    // Use real data for donut chart
    // const donutLabels = chargeData.map(item => item.TimeRange);
    // const donutCounts = chargeData.map(item => item.TotalCharges);
    // const total = donutCounts.reduce((sum, val) => sum + val, 0);
    // const donutPercentages = donutCounts.map(count => total > 0 ? +(count / total * 100).toFixed(1) : 0);
    // const donutColors = [
    //     'rgba(54, 162, 235, 0.7)',
    //     'rgba(75, 192, 192, 0.7)',
    //     'rgba(255, 206, 86, 0.7)',
    //     'rgba(153, 102, 255, 0.7)',
    //     'rgba(255, 159, 64, 0.7)'
    // ];
    // const donutData = {
    //     labels: donutLabels,
    //     datasets: [
    //         {
    //             data: donutCounts,
    //             backgroundColor: donutColors,
    //             borderWidth: 1,
    //         },
    //     ],
    // };
    // const donutOptions = {
    //     cutout: '70%',
    //     plugins: {
    //         legend: {
    //             display: false,
    //         },
    //         tooltip: {
    //             callbacks: {
    //                 label: function(context: any) {
    //                     const count = context.parsed;
    //                     const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
    //                     return `${count} fraudulent (${percent}%)`;
    //                 },
    //                 title: function(context: any) {
    //                     return context[0].label;
    //                 }
    //             }
    //         }
    //     }
    // };

    return (
        <div className="dashboard-outer-container">
            <h2 className="dashboard-main-title">Dashboard</h2>
            <div className="charts-combined-container">
                <div className="chart-container" style={{ width: '60%', minWidth: 350 }}>
                    <canvas id="chargeChart" ref={chartRef}></canvas>
                </div>
                {/* <div className="charts-divider"></div> */}
                {/* <div className="donut-container">
                    <Doughnut data={donutData} options={donutOptions} />
                    <div className="donut-legend">
                        {donutLabels.map((label, i) => (
                            <div key={label} className="donut-legend-item">
                                <span className="donut-legend-color" style={{ background: donutColors[i] }}></span>
                                <span className="donut-legend-label">{label}</span>
                                <span className="donut-legend-value">{donutPercentages[i]}%</span>
                                <span className="donut-legend-count">({donutCounts[i]})</span>
                            </div>
                        ))}
                    </div>
                </div> */}
            </div>
            <div className="dashboard-table-card">
                <DataTablePreview />
            </div>
        </div>
    );
};

export default Home;
