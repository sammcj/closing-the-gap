import React, { useState, useEffect } from 'react';
import LLMBenchmarkDashboard from './components/LLMBenchmarkDashboard';
import LeftPanel from './components/LeftPanel';
import config from './config';

// Add this function to normalize scores
const normalizeScore = (score, min, max) => {
  return (score - min) / (max - min);
};

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    checkServerFiles();
  }, []);

  const checkServerFiles = async () => {
    try {
      const response = await fetch('/api/checkFiles');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}, details: ${errorData.details}`);
      }

      const data = await response.json();
      console.log('Server file check:', data);
    } catch (error) {
      console.error('Error checking server files:', error);
      setError(`Failed to check server files: ${error.message}. Make sure the server is running on http://localhost:3001`);
    }
  };

  const fetchData = async () => {
    try {
      const response = await fetch('/api/getAllData');

      if (!response.ok) {
        throw new Error('Failed to load data');
      }

      const { models, benchmarks, results } = await response.json();

      console.log('Fetched data:', { models, benchmarks, results });

      // Process the fetched data
      const processedData = {
        benchmarks: benchmarks.map(benchmark => {
          const benchmarkResults = results.filter(result => result.benchmarkId === benchmark.id);
          const scores = benchmarkResults.map(r => r.score);
          const min = Math.min(...scores);
          const max = Math.max(...scores);

          return {
            name: benchmark.name,
            min,
            max,
            data: benchmarkResults
              .filter(result =>
                models.find(m => m.id === result.modelId)
                  ? (
                    models.openClosed === 'Open' || models.openClosed === 'Closed'
                  )
                  : true
              )
              .map(result => {
            // Ensure that we join the 'results' table with the 'models' table using result.modelId
              const model = models.find(m => m.id === result.modelId);
              return {
                date: result.date,
                name: model ? model.name : 'Unknown',
                params: model ? model.params : null,
                author: model ? model.author : 'Unknown',
                openClosed: model ? model.openClosed : 'Unknown',
                score: result.score,
                normalizedScore: normalizeScore(result.score, min, max)
              };
            })
          };
        }).filter(benchmark => benchmark.data.length > 0)
      };

      setData(processedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(`Failed to load data: ${error.message}. Please check your network connection and make sure the server is running.`);
    }
  };

  const handleNewData = async (newData) => {
    try {
      console.log('Sending new data:', newData);

      const response = await fetch('/api/saveBenchmarkData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.details || 'Failed to add new data');
      }

      console.log('Server response:', responseData);

      // Refetch data to update the charts
      await fetchData();
    } catch (error) {
      console.error('Error adding new data:', error);
      setError(`Failed to add new data. ${error.message}`);
    }
  };


  const handleDeleteData = async (modelNames) => {
    try {
      const response = await fetch('http://localhost:3001/api/deleteModelData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelNames }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.details || 'Failed to delete data');
      }

      console.log('Server response:', responseData);

      // Refetch data to update the charts
      await fetchData();
    } catch (error) {
      console.error('Error deleting data:', error);
      setError(`Failed to delete data. ${error.message}`);
    }
  };


  const handleAddBenchmark = async (benchmarkName) => {
    try {
      const response = await fetch('http://localhost:3001/api/addBenchmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: benchmarkName }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.details || 'Failed to add benchmark');
      }

      console.log('Server response:', responseData);

      // Refetch data to update the benchmarks
      await fetchData();
    } catch (error) {
      console.error('Error adding benchmark:', error);
      setError(`Failed to add benchmark. ${error.message}`);
    }
  };

  const handleDeleteBenchmark = async (benchmarkName) => {
    try {
      const response = await fetch('http://localhost:3001/api/deleteBenchmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: benchmarkName }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.details || 'Failed to delete benchmark');
      }

      console.log('Server response:', responseData);

      // Refetch data to update the benchmarks
      await fetchData();
    } catch (error) {
      console.error('Error deleting benchmark:', error);
      setError(`Failed to delete benchmark. ${error.message}`);
    }
  };

  const handleBackup = async () => {
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Server response:', responseData);
      alert(`Backup created successfully! Location: ${responseData.backupDir}`);
    } catch (error) {
      console.error('Error creating backup:', error);
      alert(`Failed to create backup. ${error.message}`);
    }
  };

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  if (!data) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  const scrollToGraph = (graphId) => {
    const element = document.getElementById(graphId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex">
      <div className="w-1/4 p-4">
        <LeftPanel
          data={data}
          onNewData={handleNewData}
          onDeleteData={handleDeleteData}
          onAddBenchmark={handleAddBenchmark}
          onDeleteBenchmark={handleDeleteBenchmark}
          onBackup={handleBackup}
          isAdmin={config.enableAdminPanel}
          onGraphSelect={scrollToGraph}
        />
      </div>
      <div className="w-3/4 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">LLM Benchmark Visualisation</h1>
        <div className="bg-yellow-100 p-4 rounded-lg mb-8">
          <p className="text-yellow-800">
            This is experimental, and is a work in progress. Results may be incomplete or inaccurate, some functionality may be missing or broken.
          </p>
        </div>
        {error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          data ? <LLMBenchmarkDashboard data={data} /> : <div>Loading...</div>
        )}
      </div>
    </div>
  );
}

export default App;
