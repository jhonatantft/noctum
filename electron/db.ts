import Database from 'better-sqlite3';
import path from 'path';
import electron from 'electron';
const { app } = electron;

const dbPath = path.join(app.getPath('userData'), 'meetings.db');
const db = new Database(dbPath);

// Initialize Database
export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      date TEXT,
      duration INTEGER,
      summary TEXT
    );
    CREATE TABLE IF NOT EXISTS transcripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER,
      speaker TEXT,
      text TEXT,
      timestamp INTEGER,
      FOREIGN KEY(meeting_id) REFERENCES meetings(id)
    );
  `);
}

export function createMeeting(title: string) {
  const stmt = db.prepare('INSERT INTO meetings (title, date, duration) VALUES (?, ?, ?)');
  const info = stmt.run(title, new Date().toISOString(), 0);
  return info.lastInsertRowid;
}

export function addTranscript(meetingId: number, speaker: string, text: string, timestamp: number) {
  const stmt = db.prepare('INSERT INTO transcripts (meeting_id, speaker, text, timestamp) VALUES (?, ?, ?, ?)');
  stmt.run(meetingId, speaker, text, timestamp);
}

export function getMeetings() {
  return db.prepare('SELECT * FROM meetings ORDER BY date DESC').all();
}

export function getMeetingDetails(id: number) {
  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id) as object | undefined;
  if (!meeting) return null;
  const transcripts = db.prepare('SELECT * FROM transcripts WHERE meeting_id = ? ORDER BY timestamp ASC').all(id);
  return { ...meeting, transcripts };
}
