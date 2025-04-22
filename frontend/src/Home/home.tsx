import React, { useEffect, useRef, useState } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
ChartJS.register(...registerables);

const Home: React.FC = () => {
    const chartRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstanceRef = useRef<ChartJS | null>(null);
    const [usageData, setUsageData] = useState<number[]>([]);

    useEffect(() => {
        fetch('http://localhost:5000/api/usage-counts')
            .then(res => res.json())
            .then(data => {
                const timeLabels = ['0000-0900', '0900-1300', '1300-1700', '1700-2100', '2100-0000'];
                const values = timeLabels.map(label => data[label] || 0);
                setUsageData(values);
            });
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
                        scales: {
                            y: {
                                beginAtZero: true
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
    }, [usageData]);

    return (
        <div>
            <canvas id="myChart" ref={chartRef}></canvas>
        </div>
    );
};

export default Home;
