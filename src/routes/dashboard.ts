import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { db } from '../db';

export const router = Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  res.render('dashboard/index');
});

router.get('/dept-toppers', (req, res) => {
  const rows = db
    .prepare(`
      SELECT s.department, s.section, s.name, s.reg_no,
             COALESCE(SUM(a.points), 0) AS total_points
      FROM students s
      LEFT JOIN achievements a ON a.student_id = s.id
      GROUP BY s.id
      ORDER BY s.department ASC, total_points DESC, s.name ASC
    `)
    .all();
  res.render('dashboard/dept-toppers', { rows });
});

router.get('/college-toppers', (req, res) => {
  const rows = db
    .prepare(`
      SELECT s.name, s.reg_no, s.department, s.section,
             COALESCE(SUM(a.points), 0) AS total_points
      FROM students s
      LEFT JOIN achievements a ON a.student_id = s.id
      GROUP BY s.id
      ORDER BY total_points DESC, s.name ASC
    `)
    .all();
  res.render('dashboard/college-toppers', { rows });
});

router.get('/below-average', (req, res) => {
  // Show only the lowest-ranked students per department-section (ties included)
  const rows = db
    .prepare(`
      WITH totals AS (
        SELECT s.department, s.section, s.name, s.reg_no, s.id AS student_id,
               COALESCE(SUM(a.points), 0) AS total_points
        FROM students s
        LEFT JOIN achievements a ON a.student_id = s.id
        GROUP BY s.id
      )
      SELECT t.department, t.section, t.name, t.reg_no, t.total_points
      FROM totals t
      JOIN (
        SELECT department, section, MIN(total_points) AS min_points
        FROM totals
        GROUP BY department, section
      ) m
      ON t.department = m.department AND t.section = m.section AND t.total_points = m.min_points
      ORDER BY t.department ASC, t.section ASC, t.name ASC
    `)
    .all();
  res.render('dashboard/below-average', { rows });
});
