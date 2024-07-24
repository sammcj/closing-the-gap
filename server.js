const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs').promises;
const app = express();
const port = process.env.PORT || 3001;
const dbPath = process.env.DB_PATH || './llm_benchmarks.db';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create a database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Promisify database methods
const dbRun = (sql, params) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) reject(err);
    else resolve(this);
  });
});

const dbGet = (sql, params) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

const dbAll = (sql, params) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

// GET endpoint for checkFiles
app.get('/api/checkFiles', async (req, res) => {
  try {
    await fs.access(dbPath);
    res.json({ message: 'Database file exists' });
  } catch (err) {
    res.status(500).json({ error: 'Database file not found', details: err.message });
  }
});

// GET endpoint to check if database is accessible
app.get('/api/checkDatabase', async (req, res) => {
  try {
    const result = await dbGet("SELECT name FROM sqlite_master WHERE type='table' AND name='models'");
    res.json({ message: 'Database is accessible', tableExists: !!result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to query database', details: err.message });
  }
});

// GET endpoint to fetch all data
app.get('/api/getAllData', async (req, res) => {
  try {
    const models = await dbAll("SELECT * FROM models");
    const benchmarks = await dbAll("SELECT * FROM benchmarks");
    const results = await dbAll("SELECT * FROM results");

    console.log('Models:', models);
    console.log('Benchmarks:', benchmarks);
    console.log('Results:', results);

    res.json({ models, benchmarks, results });
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).json({ error: 'Failed to fetch data', details: err.message });
  }
});

// POST endpoint to save benchmark data
app.post('/api/saveBenchmarkData', async (req, res) => {
  const { modelName, benchmarkId, score, date, openClosed } = req.body;

  if (!modelName || !benchmarkId || !score || !date || !openClosed) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await dbRun("BEGIN TRANSACTION");

    let model = await dbGet("SELECT * FROM models WHERE name = ?", modelName);
    let modelId;

    if (!model) {
      const result = await dbRun("INSERT INTO models (name, openClosed) VALUES (?, ?)", [modelName, openClosed]);
      modelId = result.lastID;
    } else {
      modelId = model.id;
    }

    await dbRun("INSERT INTO results (date, modelId, benchmarkId, score) VALUES (?, ?, ?, ?)",
      [date, modelId, benchmarkId, score]);

    await dbRun("COMMIT");
    res.json({ message: 'Data saved successfully' });
  } catch (err) {
    await dbRun("ROLLBACK");
    res.status(500).json({ error: 'Failed to save data', details: err.message });
  }
});

// POST endpoint to delete model data
app.post('/api/deleteModelData', async (req, res) => {
  const { modelNames } = req.body;

  if (!Array.isArray(modelNames) || modelNames.length === 0) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    await dbRun("BEGIN TRANSACTION");

    const placeholders = modelNames.map(() => '?').join(',');
    const result = await dbRun(`DELETE FROM models WHERE name IN (${placeholders})`, modelNames);

    await dbRun("COMMIT");
    res.json({ message: `${result.changes} models deleted successfully` });
  } catch (err) {
    await dbRun("ROLLBACK");
    res.status(500).json({ error: 'Failed to delete models', details: err.message });
  }
});

// POST endpoint to add a new benchmark
app.post('/api/addBenchmark', async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Benchmark name is required' });
  }

  try {
    const result = await dbRun("INSERT INTO benchmarks (name) VALUES (?)", [name]);
    res.json({ message: 'Benchmark added successfully', benchmark: { id: result.lastID, name } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add benchmark', details: err.message });
  }
});

// POST endpoint to delete a benchmark
app.post('/api/deleteBenchmark', async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Benchmark name is required' });
  }

  try {
    await dbRun("BEGIN TRANSACTION");

    await dbRun("DELETE FROM benchmarks WHERE name = ?", [name]);
    await dbRun("DELETE FROM results WHERE benchmarkId NOT IN (SELECT id FROM benchmarks)");

    await dbRun("COMMIT");
    res.json({ message: 'Benchmark and related results deleted successfully' });
  } catch (err) {
    await dbRun("ROLLBACK");
    res.status(500).json({ error: 'Failed to delete benchmark', details: err.message });
  }
});

// POST endpoint to create a backup
app.post('/api/backup', async (req, res) => {
  const backupDir = path.join(__dirname, 'backups', new Date().toISOString().replace(/:/g, '-'));
  const backupFile = path.join(backupDir, 'llm_benchmarks_backup.db');

  try {
    await fs.mkdir(backupDir, { recursive: true });
    await dbRun("VACUUM INTO ?", backupFile);
    res.json({ message: 'Backup created successfully', backupFile });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create backup', details: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});
