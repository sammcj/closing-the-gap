import React, { useState, useEffect } from 'react';
import LLMBenchmarkVisualization from './components/LLMBenchmarkVisualization';
import LLMBenchmarkPrediction from './components/LLMBenchmarkPrediction';

const LLMBenchmarkApp = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
      }
    };

    fetchData();
  }, []);

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  if (!data) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">LLM Benchmark Visualization</h1>
      <LLMBenchmarkVisualization data={data} />
      <LLMBenchmarkPrediction data={data} />
    </div>
  );
};

export default LLMBenchmarkApp;
