"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.calculatePoints = calculatePoints;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dataDir = path_1.default.join(__dirname, '..', 'data');
const dbPath = path_1.default.join(dataDir, 'app.sqlite');
if (!fs_1.default.existsSync(dataDir)) {
    fs_1.default.mkdirSync(dataDir, { recursive: true });
}
exports.db = new better_sqlite3_1.default(dbPath);
exports.db.pragma('journal_mode = WAL');
exports.db.exec(`
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
    const existing = exports.db.prepare('SELECT 1 FROM users WHERE user_id = ?').get(adminUserId);
    if (!existing) {
        const passwordHash = bcrypt_1.default.hashSync(adminPassword, 12);
        exports.db.prepare('INSERT INTO users (user_id, password_hash) VALUES (?, ?)').run(adminUserId, passwordHash);
        // eslint-disable-next-line no-console
        console.log('Seeded admin user:', adminUserId);
    }
}
seedAdmin();
function calculatePoints(position) {
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
