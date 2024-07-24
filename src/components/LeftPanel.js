import React, { useState, useEffect, useCallback } from 'react';
import DataEntryForm from './DataEntryForm';
import config from '../config';

const LeftPanel = ({ data, onNewData, onDeleteData, onAddBenchmark, onDeleteBenchmark, onBackup, isAdmin, onGraphSelect }) => {
  const [showDataForm, setShowDataForm] = useState(false);
  const [selectedModels, setSelectedModels] = useState([]);
  const [sortedModels, setSortedModels] = useState([]);
  const [sortOption, setSortOption] = useState('averageScore');
  const [selectedBenchmark, setSelectedBenchmark] = useState('');
  const [newBenchmarkName, setNewBenchmarkName] = useState('');

  const explanationText = `Using ${config.trendDataPoints} data points to calculate the trend a linear regression is performed on these points to determine the slope and intercept.
The trend is then projected forward for ${config.predictionMonths} months.
Predictions are capped between 0 and 1 to ensure realistic values.

Limitations (many):

- I am bad at math.
- I am bad at Javascript.
- I hacked this up late at night.
- Past performance doesn't guarantee future results.
- The AI field is rapidly evolving and may not follow linear trends.
- Breakthroughs or setbacks can significantly alter the trajectory.
- This simple linear projection doesn't account for potential breakthroughs (and there are many) or plateaus (people keep talking of these but I'm yet to see one).

Interpretation:
- Use these projections as a general indication of potential progress if current trends continue.
- Consider them alongside expert analysis and industry developments for a more comprehensive view.
`;

  const calculateAverageScores = useCallback(() => {
    if (!data || !data.benchmarks) return [];
    const modelScores = {};
    data.benchmarks.forEach(benchmark => {
      benchmark.data.forEach(item => {
        if (!modelScores[item.name]) {
          modelScores[item.name] = [];
        }
        modelScores[item.name].push(item.score);
      });
    });

    return Object.entries(modelScores).map(([name, scores]) => ({
      name,
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length
    }));
  }, [data]);

  const calculateMostRecent = useCallback(() => {
    if (!data || !data.benchmarks) return [];
    const modelDates = {};
    data.benchmarks.forEach(benchmark => {
      benchmark.data.forEach(item => {
        if (!modelDates[item.name] || new Date(item.date) > new Date(modelDates[item.name])) {
          modelDates[item.name] = item.date;
        }
      });
    });

    return Object.entries(modelDates).map(([name, date]) => ({
      name,
      mostRecent: date
    }));
  }, [data]);

  const sortModels = useCallback((option) => {
    let sorted;
    switch (option) {
      case 'averageScore':
        sorted = calculateAverageScores().sort((a, b) => b.averageScore - a.averageScore);
        break;
      case 'mostRecent':
        sorted = calculateMostRecent().sort((a, b) => new Date(b.mostRecent) - new Date(a.mostRecent));
        break;
      case 'alphabetical':
        sorted = (data && data.benchmarks && data.benchmarks[0] && data.benchmarks[0].data)
          ? data.benchmarks[0].data.map(item => ({ name: item.name })).sort((a, b) => a.name.localeCompare(b.name))
          : [];
        break;
      default:
        sorted = calculateAverageScores().sort((a, b) => b.averageScore - a.averageScore);
    }
    setSortedModels(sorted);
  }, [calculateAverageScores, calculateMostRecent, data]);

  useEffect(() => {
    sortModels(sortOption);
  }, [sortOption, sortModels]);

  const handleModelSelect = (modelName) => {
    setSelectedModels(prevSelected =>
      prevSelected.includes(modelName)
        ? prevSelected.filter(name => name !== modelName)
        : [...prevSelected, modelName]
    );
  };

  const handleDeleteConfirmation = () => {
    if (window.confirm(`Are you sure you want to delete data for the following models: ${selectedModels.join(', ')}?`)) {
      onDeleteData(selectedModels);
      setSelectedModels([]);
    }
  };

  const handleDeleteBenchmarkConfirmation = () => {
    if (window.confirm(`Are you sure you want to delete all data for the benchmark: ${selectedBenchmark}?`)) {
      onDeleteBenchmark(selectedBenchmark);
      setSelectedBenchmark('');
    }
  };

  const handleAddBenchmark = () => {
    if (newBenchmarkName.trim()) {
      onAddBenchmark(newBenchmarkName.trim());
      setNewBenchmarkName('');
    }
  };



  return (
    <div className="bg-gray-100 p-4 rounded-lg overflow-y-auto h-screen">
      {/* add a link to github */}
      <div className="bg-blue-100 p-4 rounded-lg mb-8">
        <p className="text-blue-800">
          <a href="https://github.com/sammcj/closing-the-gap" target="_blank" rel="noreferrer">
            <b>View source or open a PR on GitHub</b>
          </a>
        </p>
      </div>

      {isAdmin && (
        <>
          <h2 className="text-xl font-bold mt-8 mb-4">Admin Settings</h2>
          <button
            onClick={onBackup}
            className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded"
          >
            Backup Data
          </button>
          <span className="mr-2"></span>
          <button
            onClick={() => setShowDataForm(true)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Add New Data
          </button>
          {showDataForm && (
            <DataEntryForm
              onNewData={onNewData}
              onClose={() => setShowDataForm(false)}
            />
          )}
          <hr className="my-4" />
          <div className="mt-4">
            <input
              type="text"
              value={newBenchmarkName}
              onChange={(e) => setNewBenchmarkName(e.target.value)}
              placeholder="New benchmark name"
              className="p-2 border rounded mr-2"
            />
            <button
              onClick={handleAddBenchmark}
              className="px-4 py-2 bg-green-500 text-white rounded"
              disabled={!newBenchmarkName.trim()}
            >
              Add New Benchmark
            </button>
          </div>
          <hr className="my-4" />
          {/* danger zone heading */}
          <h2 className="text-xl font-bold mb-4">Danger Zone</h2>
          <button
            onClick={handleDeleteConfirmation}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
            disabled={selectedModels.length === 0}
          >
            Delete Selected Model Data
          </button>
          <div className="mt-4">
            <select
              value={selectedBenchmark}
              onChange={(e) => setSelectedBenchmark(e.target.value)}
              className="p-2 border rounded mr-2"
            >
              <option value="">Select a benchmark</option>
              {data && data.benchmarks && data.benchmarks.map(benchmark => (
                <option key={benchmark.name} value={benchmark.name}>{benchmark.name}</option>
              ))}
            </select>
            <button
              onClick={handleDeleteBenchmarkConfirmation}
              className="px-4 py-2 bg-red-500 text-white rounded"
              disabled={!selectedBenchmark}
            >
              Delete Benchmark Data
            </button>
          </div>
          <hr className="my-4" />
        </>
      )}
      <h2 className="text-xl font-bold mb-4">Graphs</h2>
      <ul className="mb-4">
        <li>
          <button onClick={() => onGraphSelect('average-graph')} className="text-blue-500 hover:underline">
            Average Across All Benchmarks
          </button>
        </li>
        {data && data.benchmarks && data.benchmarks.map((benchmark, index) => (
          <li key={index}>
            <button onClick={() => onGraphSelect(`graph-${index}`)} className="text-blue-500 hover:underline">
              {benchmark.name}
            </button>
          </li>
        ))}
      </ul>
      <hr className="my-4" />
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Prediction Explanation</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="whitespace-pre-wrap text-sm">{explanationText}</p>
        </div>
      </div>
      <hr className="my-4" />
      <h2 className="text-xl font-bold mb-4">Models</h2>
      <div className="mb-4">
        <label className="mr-2">Sort by:</label>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="averageScore">Highest average score</option>
          <option value="mostRecent">Most recent</option>
          <option value="alphabetical">Alphabetically</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              {isAdmin && <th className="px-4 py-2">Select</th>}
              <th className="px-4 py-2">Model Name</th>
              <th className="px-4 py-2">
                {sortOption === 'averageScore' ? 'Average Score' :
                  sortOption === 'mostRecent' ? 'Most Recent Date' : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedModels.map((model) => (
              <tr key={model.name}>
                {isAdmin && (
                  <td className="border px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selectedModels.includes(model.name)}
                      onChange={() => handleModelSelect(model.name)}
                    />
                  </td>
                )}
                <td className="border px-4 py-2">{model.name}</td>
                <td className="border px-4 py-2">
                  {sortOption === 'averageScore' ? model.averageScore.toFixed(2) :
                    sortOption === 'mostRecent' ? model.mostRecent : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeftPanel;
