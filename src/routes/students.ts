import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { db, calculatePoints } from '../db';
import { requireAuth } from '../middleware/auth';

export const router = Router();

router.use(requireAuth);

router.get('/register', (req, res) => {
  res.render('dashboard/register', { success: null, errors: [] });
});

router.post(
  '/register',
  body('name').trim().isLength({ min: 1, max: 100 }).escape(),
  body('reg_no').trim().isLength({ min: 1, max: 50 }).escape(),
  body('department').trim().isLength({ min: 1, max: 50 }).escape(),
  body('section').trim().isLength({ min: 1, max: 10 }).escape(),
  body('year').isInt({ min: 1, max: 8 }).toInt(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('dashboard/register', { success: null, errors: errors.array() });
    }

    const { name, reg_no, department, section, year } = req.body as any;

    try {
      db.prepare(
        'INSERT INTO students (name, reg_no, department, section, year) VALUES (?, ?, ?, ?, ?)'
      ).run(name, reg_no, department, section, year);
      return res.render('dashboard/register', { success: 'Enrollment successful', errors: [] });
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).render('dashboard/register', { success: null, errors: [{ msg: 'Registration number already exists' }] });
      }
      return res.status(500).render('dashboard/register', { success: null, errors: [{ msg: 'Server error' }] });
    }
  }
);

router.get('/profile', (req, res) => {
  const q = (req.query.q as string) || '';
  let students: any[] = [];
  let selected: any = null;
  let achievements: any[] = [];
  if (q) {
    // Exact reg_no match selects the student
    const exact = db.prepare('SELECT * FROM students WHERE reg_no = ?').get(q) as any;
    if (exact) {
      selected = exact;
      achievements = db
        .prepare('SELECT * FROM achievements WHERE student_id = ? ORDER BY achieved_at DESC')
        .all(exact.id as number) as any[];
      const total = achievements.reduce((sum: number, a: any) => sum + a.points, 0);
      selected = { ...selected, total };
    }
    students = db
      .prepare(
        `SELECT * FROM students WHERE reg_no LIKE ? OR name LIKE ? ORDER BY section ASC, name ASC`
      )
      .all(`%${q}%`, `%${q}%`) as any[];
  } else {
    students = db.prepare('SELECT * FROM students ORDER BY section ASC, name ASC').all() as any[];
  }
  res.render('dashboard/profiles', { students, selected, achievements, q });
});

router.get('/profile/:reg_no', (req, res) => {
  const reg_no = (req.params as any).reg_no as string;
  const student = db.prepare('SELECT * FROM students WHERE reg_no = ?').get(reg_no) as any;
  if (!student) return res.status(404).render('404');
  const achievements = db
    .prepare('SELECT * FROM achievements WHERE student_id = ? ORDER BY achieved_at DESC')
    .all(student.id as number) as any[];
  const total = achievements.reduce((sum: number, a: any) => sum + a.points, 0);
  const students = db.prepare('SELECT * FROM students ORDER BY section ASC, name ASC').all() as any[];
  res.render('dashboard/profiles', { students, selected: { ...student, total }, achievements, q: '' });
});

router.post(
  '/profile/:reg_no/achievement',
  body('category').isIn(['academic', 'co-curricular', 'extra-curricular']),
  body('event_name').trim().isLength({ min: 1, max: 200 }).escape(),
  body('position').isIn(['first', 'second', 'third', 'participation']),
  (req, res) => {
    const errors = validationResult(req);
    const reg_no = (req.params as any).reg_no as string;
    const student = db.prepare('SELECT * FROM students WHERE reg_no = ?').get(reg_no) as any;
    if (!student) return res.status(404).render('404');

    if (!errors.isEmpty()) {
      const achievements = db
        .prepare('SELECT * FROM achievements WHERE student_id = ? ORDER BY achieved_at DESC')
        .all(student.id as number) as any[];
      const total = achievements.reduce((sum: number, a: any) => sum + a.points, 0);
      const students = db.prepare('SELECT * FROM students ORDER BY section ASC, name ASC').all() as any[];
      return res.status(400).render('dashboard/profiles', {
        students,
        selected: { ...student, total },
        achievements,
        q: '',
        errors: errors.array(),
      });
    }

    const { category, event_name, position } = req.body as any;
    const points = calculatePoints(position);
    db.prepare(
      'INSERT INTO achievements (student_id, category, event_name, position, points) VALUES (?, ?, ?, ?, ?)'
    ).run(student.id as number, category, event_name, position, points);

    return res.redirect(`/students/profile/${encodeURIComponent(reg_no)}`);
  }
);
