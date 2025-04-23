import React, { useEffect, useRef, useState } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
ChartJS.register(...registerables);

const Home: React.FC = () => {
    const chartRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstanceRef = useRef<ChartJS | null>(null);
    const [usageData, setUsageData] = useState<number[]>([]);
    const navigate = useNavigate();

    <Helmet>
        <title>Usage Overview</title>
    </Helmet>

    useEffect(() => {
        fetch('http://localhost:5000/api/usage-counts')
            .then(res => res.json())
            .then(data => {
                console.log('Received data:', data);  // Add this line
                const timeLabels = ['0000-0900', '0900-1300', '1300-1700', '1700-2100', '2100-0000'];
                const values = timeLabels.map(label => data[label] || 0);
                setUsageData(values);
            })
            .catch(error => console.error('Error fetching data:', error));
    }, []);

    useEffect(() => {
        if (chartRef.current && usageData.length > 0) {
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                if (chartInstanceRef.current) {
                    chartInstanceRef.current.destroy();
                }

                chartInstanceRef.current = new ChartJS(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['0000-0900', '0900-1300', '1300-1700', '1700-2100', '2100-0000'],
                        datasets: [{
                            label: 'Usage Count',
                            data: usageData,
                            backgroundColor: 'rgba(75, 192, 192, 0.6)',
                            borderWidth: 1,
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        },
                        onHover: (event, chartElements) => {
                            if (event.native?.target) {
                                (event.native.target as HTMLElement).style.cursor = chartElements[0] ? 'pointer' : 'default';
                            }
                        },
                        onClick: (event, elements) => {
                            if (elements.length > 0) {
                                const index = elements[0].index;
                                const timeRanges = ['0000-0900', '0900-1300', '1300-1700', '1700-2100', '2100-0000'];
                                const clickedRange = timeRanges[index];
                                navigate(`/usage/${clickedRange}`);
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
    }, [usageData, navigate]);

    return (
        <div style={{ width: '80%', margin: '0 auto' }}>
            <canvas id="myChart" ref={chartRef}></canvas>
        </div>
    );
};

export default Home;