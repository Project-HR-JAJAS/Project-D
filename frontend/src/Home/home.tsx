import React from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
ChartJS.register(...registerables);

const Home: React.FC = () => {
    const chartRef = React.useRef<HTMLCanvasElement | null>(null);
    const chartInstanceRef = React.useRef<ChartJS | null>(null);

    React.useEffect(() => {
        if (chartRef.current) {
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                // Destroy the existing chart instance if it exists
                if (chartInstanceRef.current) {
                    chartInstanceRef.current.destroy();
                }

                // Create a new chart instance
                chartInstanceRef.current = new ChartJS(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                        datasets: [{
                            label: '# of Votes',
                            data: [12, 19, 3, 5, 2, 3],
                            borderWidth: 1
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

        // Cleanup function to destroy the chart instance when the component unmounts
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, []);

    return (
        <div>
            <div>
                <canvas id="myChart" ref={chartRef}></canvas>
            </div>
        </div>
    );
};

export default Home;