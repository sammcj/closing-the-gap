import React, { useState, useEffect } from 'react';
import LLMBenchmarkVisualization from './components/LLMBenchmarkVisualization';

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/data.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => setData(data))
      .catch(error => {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
      });
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
    </div>
  );
}

export default App;
