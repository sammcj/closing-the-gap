import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const LLMBenchmarkVisualization = ({ data }) => {
  const processedData = useMemo(() => {
    const sortedData = data.benchmarks[0].data.sort((a, b) => new Date(a.date) - new Date(b.date));

    const movingMaximum = (arr, key, openClosed) => {
      let max = -Infinity;
      return arr.map(item => {
        if (item.openClosed === openClosed) {
          max = Math.max(max, item[key]);
        }
        return max;
      });
    };

    const openMax = movingMaximum(sortedData, 'score', 'Open');
    const closedMax = movingMaximum(sortedData, 'score', 'Closed');

    return sortedData.map((item, index) => ({
      date: item.date,
      openMax: openMax[index],
      closedMax: closedMax[index],
      openModel: item.openClosed === 'Open' ? item.name : null,
      closedModel: item.openClosed === 'Closed' ? item.name : null,
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-300 rounded shadow-lg">
          <p className="font-bold">{`Date: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(2)}
              {entry.name === 'Open Max' && entry.payload.openModel && (
                <span className="ml-2">({entry.payload.openModel})</span>
              )}
              {entry.name === 'Closed Max' && entry.payload.closedModel && (
                <span className="ml-2">({entry.payload.closedModel})</span>
              )}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[600px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={processedData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0.5, 1]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line type="monotone" dataKey="openMax" stroke="#8884d8" name="Open Max" connectNulls={true} />
          <Line type="monotone" dataKey="closedMax" stroke="#82ca9d" name="Closed Max" connectNulls={true} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LLMBenchmarkVisualization;
