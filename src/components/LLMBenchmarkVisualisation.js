import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import config from '../config';
import chartTrendline from 'chartjs-plugin-trendline';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, annotationPlugin, chartTrendline);

const getLatestActualDate = (data) => {
  return new Date(Math.max(...data.map(d => new Date(d.date))));
};

const LLMBenchmarkVisualisation = ({ data }) => {
  const processedData = useMemo(() => {
    if (!data || !data.benchmarks || data.benchmarks.length === 0) {
      console.error("Data is not in the expected format");
      return { labels: [], openMax: [], closedMax: [], openModels: [], closedModels: [] };
    }

    const sortedData = data.benchmarks[0].data.sort((a, b) => new Date(a.date) - new Date(b.date));
    const latestActualDate = getLatestActualDate(sortedData);
    let openMax = -Infinity;
    let closedMax = -Infinity;

    const result = sortedData.reduce((acc, item) => {
      const itemDate = new Date(item.date);
      if (itemDate <= latestActualDate) {
        if (item.openClosed === 'Open') {
          openMax = Math.max(openMax, item.score);
        } else {
          closedMax = Math.max(closedMax, item.score);
        }
        acc.labels.push(item.date);
        acc.openMax.push(openMax);
        acc.closedMax.push(closedMax);
        acc.openModels.push(item.openClosed === 'Open' ? item.name : null);
        acc.closedModels.push(item.openClosed === 'Closed' ? item.name : null);
      }
      return acc;
    }, { labels: [], openMax: [], closedMax: [], openModels: [], closedModels: [] });

    // Calculate predictions
    const calculatePrediction = (data) => {
      const lastFewPoints = data.slice(-config.trendDataPoints);
      const xValues = Array.from({ length: lastFewPoints.length }, (_, i) => i);
      const yValues = lastFewPoints;

      const n = xValues.length;
      const sumX = xValues.reduce((a, b) => a + b, 0);
      const sumY = yValues.reduce((a, b) => a + b, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
      const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      return [data[data.length - 1], ...Array(config.predictionMonths).fill(null).map((_, i) => {
        const predictedValue = slope * (lastFewPoints.length + i + 1) + intercept;
        return predictedValue;  // Remove the min/max clamping
      })];
    };

    const openPredictions = calculatePrediction(result.openMax);
    const closedPredictions = calculatePrediction(result.closedMax);

    // Generate future dates
    const lastDate = new Date(result.labels[result.labels.length - 1]);
    const predictDates = [lastDate.toISOString().slice(0, 7), ...Array(config.predictionMonths).fill(null).map((_, i) => {
      const date = new Date(lastDate);
      date.setMonth(date.getMonth() + i + 1);
      return date.toISOString().slice(0, 7);
    })];

    // Add predictions to the result
    result.predictLabels = predictDates;
    result.openPredictions = openPredictions;
    result.closedPredictions = closedPredictions;

    return result;
  }, [data]);

  const chartData = {
    labels: [...processedData.labels, ...processedData.predictLabels.slice(1)],
    datasets: [
      {
        label: 'Open Max (Actual)',
        data: processedData.openMax,
        borderColor: config.openColor,
        backgroundColor: config.openColor + '80',
        tension: 0.1,
      },
      {
        label: 'Closed Max (Actual)',
        data: processedData.closedMax,
        borderColor: config.closedColor,
        backgroundColor: config.closedColor + '80',
        tension: 0.1,
      },
      {
        label: 'Open Max (Predicted)',
        data: [...Array(processedData.labels.length - 1).fill(null), ...processedData.openPredictions],
        borderColor: config.openColor,
        backgroundColor: config.openColor + '80',
        borderDash: [5, 5],
        tension: 0.1,
      },
      {
        label: 'Closed Max (Predicted)',
        data: [...Array(processedData.labels.length - 1).fill(null), ...processedData.closedPredictions],
        borderColor: config.closedColor,
        backgroundColor: config.closedColor + '80',
        borderDash: [5, 5],
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    elements: {
      point: {
        radius: 3,
      },
    },
    plugins: {
      legend: {
        position: config.legendPosition,
        lineWidth: 1,
      },
      title: {
        display: true,
        text: `${config.chartTitle} - ${data.benchmarks[0].name}`,
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
              return `${datasetLabel}: ${value.toFixed(2)} `;
            } else if (modelName) {
              return `${datasetLabel}: ${value.toFixed(2)} (${modelName}, ${benchmarkName})`;
            } else {
              return `${datasetLabel}: ${value.toFixed(2)} `;
            }
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,  // Allow the scale to start at a value other than zero
        ticks: {
          callback: function (value) {
            return value.toFixed(1);
          }
        }
      }
    },
  };

  return (
    <div className="w-full h-[400px]">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default LLMBenchmarkVisualisation;
