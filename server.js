const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// GET endpoint to check if files can be read
app.get('/api/checkFiles', async (req, res) => {
  try {
    const modelsPath = path.join(__dirname, 'public', 'models.json');
    const resultsPath = path.join(__dirname, 'public', 'results.json');

    console.log('Attempting to read files:');
    console.log('Models path:', modelsPath);
    console.log('Results path:', resultsPath);

    const [models, results] = await Promise.all([
      fs.readFile(modelsPath, 'utf-8'),
      fs.readFile(resultsPath, 'utf-8')
    ]);

    console.log('Files read successfully');

    res.json({
      message: 'Files read successfully',
      modelCount: JSON.parse(models).length,
      resultCount: JSON.parse(results).length
    });
  } catch (error) {
    console.error('Error reading files:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to read files', details: error.message, stack: error.stack });
  }
});


app.post('/api/saveBenchmarkData', async (req, res) => {
  console.log('Received POST request to /api/saveBenchmarkData');
  try {
    const { modelName, benchmarkId, score, date, openClosed } = req.body;
    console.log('Received data:', { modelName, benchmarkId, score, date, openClosed });

    const modelsPath = path.join(__dirname, 'public', 'models.json');
    const resultsPath = path.join(__dirname, 'public', 'results.json');

    console.log('File paths:', { modelsPath, resultsPath });

    let models, results;
    try {
      [models, results] = await Promise.all([
        fs.readFile(modelsPath, 'utf-8').then(JSON.parse),
        fs.readFile(resultsPath, 'utf-8').then(JSON.parse),
      ]);
      console.log('Files read successfully');
    } catch (readError) {
      console.error('Error reading files:', readError);
      throw new Error(`Failed to read files: ${readError.message}`);
    }

    if (!models.find(m => m.name === modelName)) {
      console.log('Adding new model:', modelName);
      models.push({ name: modelName, params: null, author: 'Unknown', openClosed });
      try {
        await fs.writeFile(modelsPath, JSON.stringify(models, null, 2));
        console.log('Updated models file');
      } catch (writeError) {
        console.error('Error writing to models file:', writeError);
        throw new Error(`Failed to write to models file: ${writeError.message}`);
      }
    }

    console.log('Adding new result');
    results.push({ date, modelName, benchmarkId, score });
    try {
      await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
      console.log('Updated results file');
    } catch (writeError) {
      console.error('Error writing to results file:', writeError);
      throw new Error(`Failed to write to results file: ${writeError.message}`);
    }

    res.json({ message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error in /api/saveBenchmarkData:', error);
    res.status(500).json({ error: 'Failed to save data', details: error.message });
  }
});


app.post('/api/deleteModelData', async (req, res) => {
  try {
    const { modelNames } = req.body;
    const modelsPath = path.join(__dirname, 'public', 'models.json');
    const resultsPath = path.join(__dirname, 'public', 'results.json');

    let [models, results] = await Promise.all([
      fs.readFile(modelsPath, 'utf-8').then(JSON.parse),
      fs.readFile(resultsPath, 'utf-8').then(JSON.parse),
    ]);

    // Remove models
    models = models.filter(model => !modelNames.includes(model.name));

    // Remove results for the deleted models
    results = results.filter(result => !modelNames.includes(result.modelName));

    await Promise.all([
      fs.writeFile(modelsPath, JSON.stringify(models, null, 2)),
      fs.writeFile(resultsPath, JSON.stringify(results, null, 2)),
    ]);

    res.json({ message: 'Data deleted successfully' });
  } catch (error) {
    console.error('Error in /api/deleteModelData:', error);
    res.status(500).json({ error: 'Failed to delete data', details: error.message });
  }
});

app.post('/api/addBenchmark', async (req, res) => {
  try {
    const { name } = req.body;
    const benchmarksPath = path.join(__dirname, 'public', 'benchmarks.json');

    let benchmarks = await fs.readFile(benchmarksPath, 'utf-8').then(JSON.parse);

    const newBenchmark = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      name: name
    };

    benchmarks.push(newBenchmark);

    await fs.writeFile(benchmarksPath, JSON.stringify(benchmarks, null, 2));

    res.json({ message: 'Benchmark added successfully', benchmark: newBenchmark });
  } catch (error) {
    console.error('Error in /api/addBenchmark:', error);
    res.status(500).json({ error: 'Failed to add benchmark', details: error.message });
  }
});

app.post('/api/deleteBenchmark', async (req, res) => {
  try {
    const { name } = req.body;
    const benchmarksPath = path.join(__dirname, 'public', 'benchmarks.json');
    const resultsPath = path.join(__dirname, 'public', 'results.json');

    let [benchmarks, results] = await Promise.all([
      fs.readFile(benchmarksPath, 'utf-8').then(JSON.parse),
      fs.readFile(resultsPath, 'utf-8').then(JSON.parse),
    ]);

    const benchmarkToDelete = benchmarks.find(b => b.name === name);
    if (!benchmarkToDelete) {
      return res.status(404).json({ error: 'Benchmark not found' });
    }
    benchmarks = benchmarks.filter(b => b.name !== name);
    results = results.filter(r => r.benchmarkId !== benchmarkToDelete.id);

    await Promise.all([
      fs.writeFile(benchmarksPath, JSON.stringify(benchmarks, null, 2)),
      fs.writeFile(resultsPath, JSON.stringify(results, null, 2)),
    ]);

    res.json({ message: 'Benchmark deleted successfully' });
  } catch (error) {
    console.error('Error in /api/deleteBenchmark:', error);
    res.status(500).json({ error: 'Failed to delete benchmark', details: error.message });
  }
});

app.post('/api/backup', async (req, res) => {
  try {
    const backupDir = path.join(__dirname, 'backups', new Date().toISOString().replace(/:/g, '-'));
    await fs.mkdir(backupDir, { recursive: true });

    const files = ['models.json', 'benchmarks.json', 'results.json'];
    await Promise.all(files.map(file =>
      fs.copyFile(
        path.join(__dirname, 'public', file),
        path.join(backupDir, file)
      )
    ));

    console.log('Backup created successfully:', backupDir);
    res.json({ message: 'Backup created successfully', backupDir });
  } catch (error) {
    console.error('Error in /api/backup:', error);
    res.status(500).json({ error: 'Failed to create backup', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
