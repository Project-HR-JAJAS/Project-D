import React from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
ChartJS.register(...registerables);

const Home: React.FC = () => {
    const chartRef = React.useRef<HTMLCanvasElement | null>(null);

    React.useEffect(() => {
        if (chartRef.current) {
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                new ChartJS(ctx, {
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