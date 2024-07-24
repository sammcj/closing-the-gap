import React, { useState, useEffect } from 'react';

const DataEntryForm = ({ onNewData, onClose }) => {
  const [date, setDate] = useState('');
  const [modelName, setModelName] = useState('');
  const [benchmarkId, setBenchmarkId] = useState('');
  const [score, setScore] = useState('');
  const [openClosed, setOpenClosed] = useState('');
  const [existingModels, setExistingModels] = useState([]);
  const [existingBenchmarks, setExistingBenchmarks] = useState([]);

  useEffect(() => {
    fetchExistingData();
  }, []);

  const fetchExistingData = async () => {
    try {
      const [modelsResponse, benchmarksResponse, resultsResponse] = await Promise.all([
        fetch('/models.json'),
        fetch('/benchmarks.json'),
        fetch('/results.json')
      ]);

      const models = await modelsResponse.json();
      const benchmarks = await benchmarksResponse.json();
      const results = await resultsResponse.json();

      setExistingModels(models.map(m => m.name));
      setExistingBenchmarks(benchmarks);
    } catch (error) {
      console.error('Error fetching existing data:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newData = {
      date,
      modelName,
      benchmarkId,
      score: parseFloat(score),
      openClosed
    };

    if (!newData.date) {
      newData.date = new Date().toISOString().slice(0, 7);
    }
    // validate the data
    if (!newData.modelName || !newData.benchmarkId || !newData.score || !newData.openClosed) {
      console.error('Invalid data:', newData);
      return;
    }

    localStorage.setItem('lastInputData', JSON.stringify(newData));

    console.log('Submitting new data:', newData);
    onNewData(newData);
  };


  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold mb-4">Add New Benchmark Data</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">Date (YYYY-MM):</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder={JSON.parse(localStorage.getItem('lastInputData'))?.date || new Date().toISOString().slice(0, 7)}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <small className="text-gray-500">Leave empty to use current date</small>
          </div>
          <div className="mb-4">
            <label className="block mb-2">Model:</label>
            <input
              list="existing-models"
              className="w-full p-2 border rounded"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              // pre-fill with last input data
              placeholder={JSON.parse(localStorage.getItem('lastInputData'))?.modelName || ''}
            />
            <datalist id="existing-models">
              {existingModels.map(m => <option key={m} value={m} />)}
            </datalist>
          </div>
          <div className="mb-4">
            <label className="block mb-2">Benchmark:</label>
            <select
              className="w-full p-2 border rounded"
              value={benchmarkId}
              onChange={(e) => setBenchmarkId(e.target.value)}
              required
            >
              <option value="">Select a benchmark</option>
              {existingBenchmarks.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-2">Score:</label>
            <input
              type="number"
              step="0.01"
              className="w-full p-2 border rounded"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Open/Closed:</label>
            <select
              className="w-full p-2 border rounded"
              value={openClosed}
              onChange={(e) => setOpenClosed(e.target.value)}
              placeholder={JSON.parse(localStorage.getItem('lastInputData'))?.openClosed || ''}
              required
            >
              <option value="">Select</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="mr-2 px-4 py-2 bg-gray-300 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DataEntryForm;
