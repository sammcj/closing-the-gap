import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import config from '../config';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const LLMBenchmarkVisualization = ({ data }) => {
  const processedData = useMemo(() => {
    if (!data || !data.benchmarks || !data.benchmarks[0] || !data.benchmarks[0].data) {
      console.error("Data is not in the expected format");
      return { labels: [], openMax: [], closedMax: [], openModels: [], closedModels: [] };
    }

    const sortedData = data.benchmarks[0].data.sort((a, b) => new Date(a.date) - new Date(b.date));
    let openMax = -Infinity;
    let closedMax = -Infinity;

    const result = sortedData.reduce((acc, item) => {
      if (item.openClosed === 'Open') {
        openMax = Math.max(openMax, item.score);
        acc.openModels.push(item.name);
      } else {
        acc.openModels.push(null);
      }
      if (item.openClosed === 'Closed') {
        closedMax = Math.max(closedMax, item.score);
        acc.closedModels.push(item.name);
      } else {
        acc.closedModels.push(null);
      }
      acc.labels.push(item.date);
      acc.openMax.push(openMax);
      acc.closedMax.push(closedMax);
      return acc;
    }, { labels: [], openMax: [], closedMax: [], openModels: [], closedModels: [] });

    // Calculate predictions based on the trend of the last few data points
    const calculatePrediction = (data) => {
      const lastFewPoints = data.slice(-config.trendDataPoints);
      const xValues = Array.from({ length: lastFewPoints.length }, (_, i) => i);
      const yValues = lastFewPoints;

      // Calculate the slope and intercept for the linear regression
      const n = xValues.length;
      const sumX = xValues.reduce((a, b) => a + b, 0);
      const sumY = yValues.reduce((a, b) => a + b, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
      const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Generate predictions
      return Array(config.predictionMonths).fill().map((_, i) => {
        const predictedValue = slope * (lastFewPoints.length + i) + intercept;
        return Math.min(Math.max(predictedValue, 0), 1); // Clamp between 0 and 1
      });
    };

    const openPredictions = calculatePrediction(result.openMax);
    const closedPredictions = calculatePrediction(result.closedMax);

    // Add predictions to result
    const lastDate = new Date(result.labels[result.labels.length - 1]);
    const predictDates = Array(config.predictionMonths).fill().map((_, i) => {
      const date = new Date(lastDate);
      date.setMonth(date.getMonth() + i + 1);
      return date.toISOString().slice(0, 7);
    });

    result.labels = result.labels.concat(predictDates);
    result.openMax = result.openMax.concat(openPredictions);
    result.closedMax = result.closedMax.concat(closedPredictions);

    return result;
  }, [data]);

  const actualDataLength = processedData.labels.length - config.predictionMonths;

  const chartData = {
    labels: processedData.labels,
    datasets: [
      {
        label: 'Open Max (Actual)',
        data: processedData.openMax.slice(0, actualDataLength),
        borderColor: config.openColor,
        backgroundColor: config.openColor + '80',
        tension: 0.1
      },
      {
        label: 'Closed Max (Actual)',
        data: processedData.closedMax.slice(0, actualDataLength),
        borderColor: config.closedColor,
        backgroundColor: config.closedColor + '80',
        tension: 0.1
      },
      {
        label: 'Open Max (Predicted)',
        data: Array(actualDataLength - 1).fill(null).concat(processedData.openMax.slice(actualDataLength - 1)),
        borderColor: config.openColor,
        backgroundColor: config.openColor + '80',
        borderDash: [5, 5],
        tension: 0.1
      },
      {
        label: 'Closed Max (Predicted)',
        data: Array(actualDataLength - 1).fill(null).concat(processedData.closedMax.slice(actualDataLength - 1)),
        borderColor: config.closedColor,
        backgroundColor: config.closedColor + '80',
        borderDash: [5, 5],
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: config.legendPosition,
      },
      title: {
        display: true,
        text: config.chartTitle
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const datasetLabel = context.dataset.label || '';
            const value = context.parsed.y;
            const index = context.dataIndex;
            const modelName = datasetLabel.includes('Open') ? processedData.openModels[index] : processedData.closedModels[index];
            const benchmarkName = data.benchmarks[0].name;

            if (datasetLabel.includes('Predicted')) {
              return `${datasetLabel}: ${value.toFixed(2)}`;
            } else if (modelName) {
              return `${datasetLabel}: ${value.toFixed(2)} (${modelName}, ${benchmarkName})`;
            } else {
              return `${datasetLabel}: ${value.toFixed(2)}`;
            }
          }
        }
      }
    },
    scales: {
      y: {
        min: config.yAxisMin,
        max: config.yAxisMax
      }
    }
  };

  return (
    <div className="w-full h-[600px]">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default LLMBenchmarkVisualization;
