import React, { useState, useEffect } from 'react';

const LLMBenchmarkPrediction = ({ data }) => {
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    // Calculate predictions
    const calculatePredictions = () => {
      const sortedData = data.benchmarks[0].data.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Simple linear regression
      const linearRegression = (data, openClosed) => {
        const filteredData = data.filter(item => item.openClosed === openClosed);
        const x = filteredData.map((_, i) => i);
        const y = filteredData.map(item => item.score);

        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return (x) => slope * x + intercept;
      };

      const openPredictor = linearRegression(sortedData, 'Open');
      const closedPredictor = linearRegression(sortedData, 'Closed');

      const lastDate = new Date(sortedData[sortedData.length - 1].date);
      const predictedDates = [3, 6, 9, 12].map(months => {
        const date = new Date(lastDate);
        date.setMonth(date.getMonth() + months);
        return date.toISOString().slice(0, 7); // YYYY-MM format
      });

      const newPredictions = predictedDates.map((date, index) => ({
        date,
        openPrediction: Math.min(Math.max(openPredictor(sortedData.length + index), 0), 1),
        closedPrediction: Math.min(Math.max(closedPredictor(sortedData.length + index), 0), 1),
      }));

      setPredictions(newPredictions);
    };

    calculatePredictions();
  }, [data]);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Predictions for the Next Year</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">Date</th>
            <th className="border border-gray-300 p-2">Open Model Prediction</th>
            <th className="border border-gray-300 p-2">Closed Model Prediction</th>
          </tr>
        </thead>
        <tbody>
          {predictions.map((pred, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
              <td className="border border-gray-300 p-2">{pred.date}</td>
              <td className="border border-gray-300 p-2">{pred.openPrediction.toFixed(2)}</td>
              <td className="border border-gray-300 p-2">{pred.closedPrediction.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LLMBenchmarkPrediction;
