const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Connect to SQLite database (it will be created if it doesn't exist)
const db = new sqlite3.Database('./llm_benchmarks.db', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to the SQLite database.');
    createTables();
  }
});

function createTables() {
  db.serialize(() => {
    // Create models table
    db.run(`CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      params REAL,
      author TEXT,
      openClosed TEXT
    )`, (err) => {
      if (err) console.error('Error creating models table:', err);
    });

    // Create benchmarks table
    db.run(`CREATE TABLE IF NOT EXISTS benchmarks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    )`, (err) => {
      if (err) console.error('Error creating benchmarks table:', err);
    });

    // Create results table
    db.run(`CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      modelName TEXT NOT NULL,
      benchmarkId TEXT NOT NULL,
      score REAL NOT NULL,
      FOREIGN KEY (modelName) REFERENCES models(name),
      FOREIGN KEY (benchmarkId) REFERENCES benchmarks(id)
    )`, (err) => {
      if (err) console.error('Error creating results table:', err);
      else {
        console.log('Tables created successfully.');
        importData();
      }
    });
  });
}

function importData() {
  const modelsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'models.json'), 'utf8'));
  const benchmarksData = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'benchmarks.json'), 'utf8'));
  const resultsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'results.json'), 'utf8'));

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // Import models
    const stmtModel = db.prepare("INSERT OR IGNORE INTO models (name, params, author, openClosed) VALUES (?, ?, ?, ?)");
    modelsData.forEach((model) => {
      console.log('Inserting model:', model);
      stmtModel.run(model.name, model.params, model.author, model.openClosed, (err) => {
        if (err) console.error('Error inserting model:', model.name, err);
      });
    });
    stmtModel.finalize();

    // Import benchmarks
    const stmtBenchmark = db.prepare("INSERT OR IGNORE INTO benchmarks (id, name) VALUES (?, ?)");
    benchmarksData.forEach((benchmark) => {
      console.log('Inserting benchmark:', benchmark);
      stmtBenchmark.run(benchmark.id, benchmark.name, (err) => {
        if (err) console.error('Error inserting benchmark:', benchmark.name, err);
      });
    });
    stmtBenchmark.finalize();

    // Import results
    const stmtResult = db.prepare("INSERT OR IGNORE INTO results (date, modelName, benchmarkId, score) VALUES (?, ?, ?, ?)");
    resultsData.forEach((result) => {
      console.log('Inserting result:', result);
      stmtResult.run(result.date, result.modelName, result.benchmarkId, result.score, (err) => {
        if (err) console.error('Error inserting result:', result, err);
      });
    });
    stmtResult.finalize();

    db.run("COMMIT", (err) => {
      if (err) {
        console.error('Error committing transaction', err);
        db.run("ROLLBACK");
      } else {
        console.log('Data imported successfully.');
      }
      db.close();
    });
  });
}
