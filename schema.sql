-- GIO Cafe & Slow Life - Daily Summary Database Schema
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  income REAL DEFAULT 0,
  expense REAL DEFAULT 0,
  note TEXT
);
