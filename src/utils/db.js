// src/utils/db.js
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getDataFromDB() {
  const dbPath = path.join(__dirname, '..', '..', 'data/llm_benchmarks.db');
  console.log('Database path:', dbPath);

  let db;
  try {
    db = new Database(dbPath, { readonly: true });
    console.log('Database opened successfully');

    const benchmarks = db.prepare('SELECT * FROM benchmarks').all();
    console.log(`Retrieved ${benchmarks.length} benchmarks`);

    const models = db.prepare('SELECT * FROM models').all();
    console.log(`Retrieved ${models.length} models`);

    const results = db.prepare('SELECT * FROM results').all();
    console.log(`Retrieved ${results.length} results`);

    return { benchmarks, models, results };
  } catch (error) {
    console.error('Error in getDataFromDB:', error);
    throw error;
  } finally {
    if (db) {
      db.close();
      console.log('Database closed');
    }
  }
}
