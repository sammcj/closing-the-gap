const sqlite3 = require('sqlite3').verbose();
const fs = require('fs').promises;
const path = require('path');
const stringSimilarity = require('string-similarity');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function normaliseModelName(name) {
  let normalised = name.toLowerCase();
  normalised = normalised.replace(/[-_]?\d{4}[-]?(\d{2}([-]?\d{2})?)?$/, '');
  normalised = normalised.replace(/[-_]?\d{3,9}$/, '');
  normalised = normalised.replace(/[-_]/g, ' ');
  return normalised.trim();
}

function normaliseDate(date) {
  if (/^\d{4}-\d{2}$/.test(date)) {
    return date;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date.substring(0, 7);
  }
  if (/^\d{8}$/.test(date)) {
    return `${date.substring(0, 4)}-${date.substring(4, 6)}`;
  }
  if (/^\d{4}$/.test(date)) {
    return `${date}-01`;
  }
  throw new Error(`Unrecognised date format: ${date}`);
}


function validateData(data) {
  const requiredKeys = ['date', 'modelName', 'benchmarkId', 'score', 'openClosed'];
  for (const item of data) {
    if (!requiredKeys.every(key => key in item)) {
      throw new Error(`Missing required keys in data item: ${JSON.stringify(item)}`);
    }
    try {
      item.date = normaliseDate(item.date);
    } catch (error) {
      throw new Error(`Invalid date format in item: ${JSON.stringify(item)}. ${error.message}`);
    }
    if (typeof item.score !== 'number') {
      throw new Error(`Score must be a number in item: ${JSON.stringify(item)}`);
    }
    if (!['Open', 'Closed'].includes(item.openClosed)) {
      throw new Error(`openClosed must be 'Open' or 'Closed' in item: ${JSON.stringify(item)}`);
    }
  }
}

async function backupDatabase(dbPath) {
  const backupDir = path.join(path.dirname(dbPath), 'backups');
  await fs.mkdir(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `llm_benchmarks_backup_${timestamp}.db`);
  await fs.copyFile(dbPath, backupPath);
  console.log(`Database backed up to: ${backupPath}`);
}

async function findSimilarModel(db, modelName) {
  return new Promise((resolve, reject) => {
    db.all('SELECT name FROM models', [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      const existingNames = rows.map(row => row.name);
      const { bestMatch } = stringSimilarity.findBestMatch(modelName, existingNames);
      if (bestMatch.rating > 0.8) {
        resolve(bestMatch.target);
      } else {
        resolve(null);
      }
    });
  });
}

async function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase());
    });
  });
}


async function checkNewBenchmarks(db, data) {
  return /** @type {Promise<void>} */(new Promise((resolve, reject) => {
    const newBenchmarks = new Set();
    db.all('SELECT id FROM benchmarks', [], async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      const existingBenchmarks = new Set(rows.map(row => row.id));
      for (const item of data) {
        if (!existingBenchmarks.has(item.benchmarkId)) {
          newBenchmarks.add(item.benchmarkId);
        }
      }
      if (newBenchmarks.size > 0) {
        console.log('New benchmarks detected:', Array.from(newBenchmarks));
        const answer = await promptUser('Do you want to add these new benchmarks? (yes/no): ');
        if (answer !== 'yes') {
          reject(new Error('User chose not to add new benchmarks. Ingestion cancelled.'));
          return;
        }
        // Insert new benchmarks
        for (const benchmarkId of newBenchmarks) {
          await /** @type {Promise<void>} */(new Promise((resolve, reject) => {
            db.run('INSERT INTO benchmarks (id, name) VALUES (?, ?)', [benchmarkId, benchmarkId], (err) => {
              if (err) {
                console.error(`Error inserting new benchmark ${benchmarkId}:`, err);
                reject(err);
              } else {
                console.log(`New benchmark ${benchmarkId} inserted successfully`);
                resolve();
              }
            });
          }));
        }
      }
      resolve();
    });
  }));
}

async function checkExistingResult(db, date, modelName, benchmarkId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM results WHERE date = ? AND modelName = ? AND benchmarkId = ?',
      [date, modelName, benchmarkId],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
}

async function ingestData(dbPath, data) {
  let db;
  try {
    validateData(data);
    await backupDatabase(dbPath);
    db = new sqlite3.Database(dbPath);

    await /** @type {Promise<void>} */(new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    }));

    await checkNewBenchmarks(db, data);

    const insertModel = db.prepare('INSERT OR IGNORE INTO models (name, openClosed) VALUES (?, ?)');
    const insertResult = db.prepare('INSERT INTO results (date, modelName, benchmarkId, score) VALUES (?, ?, ?, ?)');
    const updateResult = db.prepare('UPDATE results SET score = ? WHERE date = ? AND modelName = ? AND benchmarkId = ?');

    for (const item of data) {
      const normalisedName = normaliseModelName(item.modelName);
      const similarModel = await findSimilarModel(db, normalisedName);
      const finalModelName = similarModel || normalisedName;
      const normalisedDate = normaliseDate(item.date);

      await /** @type {Promise<void>} */(new Promise((resolve, reject) => {
        insertModel.run(finalModelName, item.openClosed, function (err) {
          if (err) {
            console.error(`Error inserting model ${finalModelName}:`, err);
            reject(err);
          } else {
            console.log(`Model ${finalModelName} inserted or already exists. Changes: ${this.changes}`);
            resolve();
          }
        });
      }));

      const existingResult = await checkExistingResult(db, normalisedDate, finalModelName, item.benchmarkId);

      if (existingResult) {
        if (existingResult.score !== item.score) {
          await /** @type {Promise<void>} */(new Promise((resolve, reject) => {
            updateResult.run(item.score, normalisedDate, finalModelName, item.benchmarkId, function (err) {
              if (err) {
                console.error(`Error updating result for ${finalModelName}:`, err);
                reject(err);
              } else {
                console.log(`Result for ${finalModelName} updated. Changes: ${this.changes}`);
                resolve();
              }
            });
          }));
        } else {
          console.log(`Skipping duplicate result for ${finalModelName} on ${item.benchmarkId}`);
        }
      } else {
        await /** @type {Promise<void>} */(new Promise((resolve, reject) => {
          insertResult.run(normalisedDate, finalModelName, item.benchmarkId, item.score, function (err) {
            if (err) {
              console.error(`Error inserting result for ${finalModelName}:`, err);
              reject(err);
            } else {
              console.log(`Result for ${finalModelName} inserted. Changes: ${this.changes}`);
              resolve();
            }
          });
        }));
      }
    }

    await /** @type {Promise<void>} */(new Promise((resolve, reject) => {
      insertModel.finalize((err) => {
        if (err) reject(err);
        else resolve();
      });
    }));

    await /** @type {Promise<void>} */(new Promise((resolve, reject) => {
      insertResult.finalize((err) => {
        if (err) reject(err);
        else resolve();
      });
    }));

    await /** @type {Promise<void>} */(new Promise((resolve, reject) => {
      updateResult.finalize((err) => {
        if (err) reject(err);
        else resolve();
      });
    }));

    await /** @type {Promise<void>} */(new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => {
        if (err) {
          console.error('Error committing transaction:', err);
          db.run('ROLLBACK');
          reject(err);
        } else {
          console.log('Transaction committed successfully');
          resolve();
        }
      });
    }));

    verifyInsertedData(db)
  } catch (error) {
    console.error('Error ingesting data:', error);
    if (db) {
      db.run('ROLLBACK');
    }
    throw error;
  } finally {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    }
    rl.close();
  }
}

async function verifyInsertedData(db) {
  return /** @type {Promise<void>} */(new Promise((resolve, reject) => {
    db.all(`
      SELECT r.date, r.modelName, r.benchmarkId, r.score, m.openClosed
      FROM results r
      JOIN models m ON r.modelName = m.name
      ORDER BY r.date DESC, r.modelName
      LIMIT 20
    `, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        console.log("Recent inserted data:");
        console.log(rows);
        resolve();
      }
    });
  }));
}

async function main() {
  const dbPath = '../llm_benchmarks.db'; // Update this with your database path
  const importPath = 'import.json'; // Path to the JSON file with data to import

  try {
    const jsonData = await fs.readFile(importPath, 'utf8');
    const data = JSON.parse(jsonData);
    await ingestData(dbPath, data);
    console.log('Ingestion completed successfully');
  } catch (error) {
    console.error('Ingestion failed:', error);
  }
}

main();
