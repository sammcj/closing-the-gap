import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const LLMBenchmarkVisualization = ({ data }) => {
  const processedData = useMemo(() => {
    if (!data || !data.benchmarks || !data.benchmarks[0] || !data.benchmarks[0].data) {
      console.error("Data is not in the expected format");
      return { labels: [], openMax: [], closedMax: [] };
    }

    const sortedData = data.benchmarks[0].data.sort((a, b) => new Date(a.date) - new Date(b.date));

    let openMax = -Infinity;
    let closedMax = -Infinity;

    return sortedData.reduce((acc, item) => {
      if (item.openClosed === 'Open' && item.score > openMax) {
        openMax = item.score;
      }
      if (item.openClosed === 'Closed' && item.score > closedMax) {
        closedMax = item.score;
      }
      acc.labels.push(item.date);
      acc.openMax.push(openMax);
      acc.closedMax.push(closedMax);
      return acc;
    }, { labels: [], openMax: [], closedMax: [] });
  }, [data]);

  console.log("Processed data for visualization:", processedData);

  const chartData = {
    labels: processedData.labels,
    datasets: [
      {
        label: 'Open Max',
        data: processedData.openMax,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      },
      {
        label: 'Closed Max',
        data: processedData.closedMax,
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'LLM Benchmark Progress'
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        min: 0.5,
        max: 1
      }
    }
  };

  if (processedData.labels.length === 0) {
    return <div>No data available for visualization</div>;
  }

  return (
    <div className="w-full h-[600px]">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default LLMBenchmarkVisualization;
