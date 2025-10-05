import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'app.sqlite');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  reg_no TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  section TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  category TEXT NOT NULL, -- academic | co-curricular | extra-curricular
  event_name TEXT NOT NULL,
  position TEXT NOT NULL, -- first | second | third | participation
  points INTEGER NOT NULL,
  achieved_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_students_reg_no ON students(reg_no);
CREATE INDEX IF NOT EXISTS idx_students_dept_section ON students(department, section);
CREATE INDEX IF NOT EXISTS idx_achievements_student ON achievements(student_id);
`);

function seedAdmin() {
  const adminUserId = process.env.ADMIN_USER_ID || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

  const existing = db.prepare('SELECT 1 FROM users WHERE user_id = ?').get(adminUserId);
  if (!existing) {
    const passwordHash = bcrypt.hashSync(adminPassword, 12);
    db.prepare('INSERT INTO users (user_id, password_hash) VALUES (?, ?)').run(adminUserId, passwordHash);
    // eslint-disable-next-line no-console
    console.log('Seeded admin user:', adminUserId);
  }
}

seedAdmin();

export type Student = {
  id: number;
  name: string;
  reg_no: string;
  department: string;
  section: string;
  year: number;
};

export type Achievement = {
  id: number;
  student_id: number;
  category: string;
  event_name: string;
  position: 'first' | 'second' | 'third' | 'participation';
  points: number;
};

export function calculatePoints(position: string): number {
  switch (position) {
    case 'first':
      return 10;
    case 'second':
      return 5;
    case 'third':
      return 3;
    case 'participation':
    default:
      return 1;
  }
}
