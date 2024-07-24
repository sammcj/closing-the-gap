import React from 'react';
import LLMBenchmarkVisualisation from './LLMBenchmarkVisualisation';

const LLMBenchmarkDashboard = ({ data }) => {
  console.log('LLMBenchmarkDashboard is rendering with data:', data);

  if (!data || !data.benchmarks || data.benchmarks.length === 0) {
    console.log('No data available for LLMBenchmarkDashboard');
    return <div>No data available</div>;
  }

  // Process data to get normalised average across all benchmarks
  const averageData = {
    benchmarks: [{
      name: "Normalised Average Across All Benchmarks",
      data: data.benchmarks.reduce((acc, benchmark) => {
        benchmark.data.forEach(item => {
          const existingItem = acc.find(accItem => accItem.date === item.date && accItem.openClosed === item.openClosed);
          if (existingItem) {
            existingItem.normalisedScores.push(item.normalisedScore);
          } else {
            acc.push({
              date: item.date,
              openClosed: item.openClosed,
              normalisedScores: [item.normalisedScore]
            });
          }
        });
        return acc;
      }, []).map(item => ({
        date: item.date,
        openClosed: item.openClosed,
        score: (item.normalisedScores.reduce((a, b) => a + b, 0) / item.normalisedScores.length) * 100 // Scale to 0-100
      }))
    }]
  };

  console.log('Processed averageData:', averageData);

  return (
    <div className="flex flex-col space-y-4">
      <div id="average-graph">
        <LLMBenchmarkVisualisation data={averageData} />
      </div>
      <div className="flex flex-wrap">
        {data.benchmarks.map((benchmark, index) => (
          <div key={index} className="w-1/2 p-1">
            <LLMBenchmarkVisualisation
              data={{ benchmarks: [benchmark] }}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap">
        {data.benchmarks.map((benchmark, index) => (
          <div key={index} className="w-1/2 p-1">
            <LLMBenchmarkVisualisation
              data={{ benchmarks: [{ ...benchmark, data: benchmark.data.map(d => ({ ...d, score: null })) }] }} // Passing empty scores for predictions
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LLMBenchmarkDashboard;
