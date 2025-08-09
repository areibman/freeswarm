import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(__dirname, '../../data/database.sqlite');
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize database tables
export const initDatabase = () => {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        github_id TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        email TEXT,
        avatar_url TEXT,
        access_token TEXT,
        refresh_token TEXT,
        preferences TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Repositories table
    db.run(`
      CREATE TABLE IF NOT EXISTS repositories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        full_name TEXT UNIQUE NOT NULL,
        owner TEXT NOT NULL,
        private BOOLEAN DEFAULT 0,
        description TEXT,
        default_branch TEXT,
        url TEXT,
        last_fetched DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Pull requests cache table
    db.run(`
      CREATE TABLE IF NOT EXISTS pull_requests (
        id TEXT PRIMARY KEY,
        number INTEGER NOT NULL,
        title TEXT,
        branch_name TEXT,
        base_branch TEXT,
        repository_id TEXT,
        status TEXT,
        description TEXT,
        author TEXT,
        data TEXT,
        last_updated DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (repository_id) REFERENCES repositories(id)
      )
    `);

    // Issues cache table
    db.run(`
      CREATE TABLE IF NOT EXISTS issues (
        id TEXT PRIMARY KEY,
        number INTEGER NOT NULL,
        title TEXT,
        description TEXT,
        state TEXT,
        repository_id TEXT,
        author TEXT,
        data TEXT,
        created_at DATETIME,
        updated_at DATETIME,
        FOREIGN KEY (repository_id) REFERENCES repositories(id)
      )
    `);

    // Cache table for general caching
    db.run(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        data TEXT,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User repositories junction table
    db.run(`
      CREATE TABLE IF NOT EXISTS user_repositories (
        user_id TEXT,
        repository_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, repository_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (repository_id) REFERENCES repositories(id)
      )
    `);

    // Webhooks log table
    db.run(`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT,
        payload TEXT,
        processed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized');
  });
};

export default db;