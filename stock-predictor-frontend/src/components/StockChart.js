import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';

const StockChart = ({ chartData }) => {
    const { actual, pastPredictions, futurePredictions } = chartData;
  
    const data = {
      labels: [
        ...actual.map(d => d.date),
        ...futurePredictions.map(d => d.date)
      ],
      datasets: [
        {
          label: 'Actual Prices',
          data: [
            ...actual.map(d => d.price),
            ...Array(futurePredictions.length).fill(null)
          ],
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: 'Past Predictions',
          data: [
            ...Array(actual.length - pastPredictions.length).fill(null),
            ...pastPredictions.map(d => d.price),
            ...Array(futurePredictions.length).fill(null)
          ],
          borderColor: 'rgb(255, 159, 64)',
          tension: 0.1,
          borderDash: [5, 5]
        },
        {
          label: 'Future Predictions',
          data: [
            ...Array(actual.length).fill(null),
            ...futurePredictions.map(d => d.price)
          ],
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1,
          borderDash: [5, 5]
        }
      ]
    };
  
    const options = {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Price (USD)'
          }
        }
      }
    };
  
    return <Line data={data} options={options} />;
  };

export default StockChart;