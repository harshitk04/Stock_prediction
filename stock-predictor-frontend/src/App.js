import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StockSelector from './components/StockSelector';
import StockChart from './components/StockChart';
import './App.css';

const App = () => {
  const [stocks] = useState(['^NSEI', 'GOOG', 'TSLA']);
  const [selectedStock, setSelectedStock] = useState('');
  const [historicalData, setHistoricalData] = useState([]);
  const [predictedData, setPredictedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState({
    actual: [],
    pastPredictions: [],
    futurePredictions: []
  });
  const [error,setError] = useState('')

  useEffect(() => {
    if (selectedStock) {
      fetchStockData();
    }
  }, [selectedStock]);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://127.0.0.1:5000/predict?symbol=${selectedStock}`
      );
  
      // Process all data
      const actualData = response.data.actual.dates.map((date, index) => ({
        date: date,
        price: response.data.actual.prices[index],
        type: 'actual'
      }));
  
      const pastPredictions = response.data.past_predictions.dates.map((date, index) => ({
        date: date,
        price: response.data.past_predictions.prices[index],
        type: 'past_prediction'
      }));
  
      const futurePredictions = response.data.future_predictions.dates.map((date, index) => ({
        date: date,
        price: response.data.future_predictions.prices[index],
        type: 'future_prediction'
      }));
  
      setChartData({
        actual: actualData,
        pastPredictions: pastPredictions,
        futurePredictions: futurePredictions
      });
  
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch stock data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Stock Price Predictor</h1>
      </header>
  
      <div className="selector-container">
        <StockSelector
          stocks={stocks}
          selectedStock={selectedStock}
          onStockChange={setSelectedStock}
        />
      </div>
  
      {loading && <div className="loading">Loading stock data...</div>}
      {error && <div className="error">{error}</div>}
  
      {!loading && !error && chartData.actual.length > 0 && (
        <>
          <div className="chart-container">
            <StockChart chartData={chartData} />
          </div>
  
          <div className="predictions-container">
            <div className="prediction-section">
              <h3>Past Predictions vs Actual</h3>
              <ul className="prediction-list">
                {chartData.pastPredictions.map((pred, index) => {
                  const actual = chartData.actual[index + (chartData.actual.length - chartData.pastPredictions.length)];
                  return (
                    <li key={index}>
                      <span className="prediction-date">{pred.date}</span>
                      <div>
                        <span className="prediction-value" style={{background: '#fef3c7'}}>
                          Actual: {actual.price.toFixed(2)}
                        </span>
                        <span className="prediction-value">
                          Predicted: {pred.price.toFixed(2)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
  
            <div className="prediction-section">
              <h3>Future Predictions</h3>
              <ul className="prediction-list">
                {chartData.futurePredictions.map((pred, index) => (
                  <li key={index}>
                    <span className="prediction-date">{pred.date}</span>
                    <span className="prediction-value">
                      {pred.price.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;