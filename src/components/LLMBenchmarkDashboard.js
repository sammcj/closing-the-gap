import React from 'react';
import LLMBenchmarkVisualisation from './LLMBenchmarkVisualisation';

const LLMBenchmarkDashboard = ({ data }) => {
  console.log('LLMBenchmarkDashboard is rendering with data:', data);

  if (!data || !data.benchmarks || data.benchmarks.length === 0) {
    console.log('No data available for LLMBenchmarkDashboard');
    return <div>No data available</div>;
  }

  // Process data to get normalized average across all benchmarks
  const averageData = {
    benchmarks: [{
      name: "Normalized Average Across All Benchmarks",
      data: data.benchmarks.reduce((acc, benchmark) => {
        benchmark.data.forEach(item => {
          const existingItem = acc.find(accItem => accItem.date === item.date && accItem.openClosed === item.openClosed);
          if (existingItem) {
            existingItem.normalizedScores.push(item.normalizedScore);
          } else {
            acc.push({
              date: item.date,
              openClosed: item.openClosed,
              normalizedScores: [item.normalizedScore]
            });
          }
        });
        return acc;
      }, []).map(item => ({
        date: item.date,
        openClosed: item.openClosed,
        score: (item.normalizedScores.reduce((a, b) => a + b, 0) / item.normalizedScores.length) * 100 // Scale to 0-100
      }))
    }]
  };

  console.log('Processed averageData:', averageData);

  return (
    <div className="flex flex-col space-y-8">
      <div id="average-graph">
        <LLMBenchmarkVisualisation data={averageData} />
      </div>
      {data.benchmarks.map((benchmark, index) => (
        <div id={`graph-${index}`} key={index}>
          <LLMBenchmarkVisualisation
            data={{ benchmarks: [benchmark] }}
          />
        </div>
      ))}
    </div>
  );
};

export default LLMBenchmarkDashboard;
