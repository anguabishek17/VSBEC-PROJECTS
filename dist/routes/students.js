"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
exports.router = (0, express_1.Router)();
exports.router.use(auth_1.requireAuth);
exports.router.get('/register', (req, res) => {
    res.render('dashboard/register', { success: null, errors: [] });
});
exports.router.post('/register', (0, express_validator_1.body)('name').trim().isLength({ min: 1, max: 100 }).escape(), (0, express_validator_1.body)('reg_no').trim().isLength({ min: 1, max: 50 }).escape(), (0, express_validator_1.body)('department').trim().isLength({ min: 1, max: 50 }).escape(), (0, express_validator_1.body)('section').trim().isLength({ min: 1, max: 10 }).escape(), (0, express_validator_1.body)('year').isInt({ min: 1, max: 8 }).toInt(), (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('dashboard/register', { success: null, errors: errors.array() });
    }
    const { name, reg_no, department, section, year } = req.body;
    try {
        db_1.db.prepare('INSERT INTO students (name, reg_no, department, section, year) VALUES (?, ?, ?, ?, ?)').run(name, reg_no, department, section, year);
        return res.render('dashboard/register', { success: 'Enrollment successful', errors: [] });
    }
    catch (e) {
        if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).render('dashboard/register', { success: null, errors: [{ msg: 'Registration number already exists' }] });
        }
        return res.status(500).render('dashboard/register', { success: null, errors: [{ msg: 'Server error' }] });
    }
});
exports.router.get('/profile', (req, res) => {
    const q = req.query.q || '';
    let students = [];
    let selected = null;
    let achievements = [];
    if (q) {
        // Exact reg_no match selects the student
        const exact = db_1.db.prepare('SELECT * FROM students WHERE reg_no = ?').get(q);
        if (exact) {
            selected = exact;
            achievements = db_1.db
                .prepare('SELECT * FROM achievements WHERE student_id = ? ORDER BY achieved_at DESC')
                .all(exact.id);
            const total = achievements.reduce((sum, a) => sum + a.points, 0);
            selected = { ...selected, total };
        }
        students = db_1.db
            .prepare(`SELECT * FROM students WHERE reg_no LIKE ? OR name LIKE ? ORDER BY section ASC, name ASC`)
            .all(`%${q}%`, `%${q}%`);
    }
    else {
        students = db_1.db.prepare('SELECT * FROM students ORDER BY section ASC, name ASC').all();
    }
    res.render('dashboard/profiles', { students, selected, achievements, q });
});
exports.router.get('/profile/:reg_no', (req, res) => {
    const reg_no = req.params.reg_no;
    const student = db_1.db.prepare('SELECT * FROM students WHERE reg_no = ?').get(reg_no);
    if (!student)
        return res.status(404).render('404');
    const achievements = db_1.db
        .prepare('SELECT * FROM achievements WHERE student_id = ? ORDER BY achieved_at DESC')
        .all(student.id);
    const total = achievements.reduce((sum, a) => sum + a.points, 0);
    const students = db_1.db.prepare('SELECT * FROM students ORDER BY section ASC, name ASC').all();
    res.render('dashboard/profiles', { students, selected: { ...student, total }, achievements, q: '' });
});
exports.router.post('/profile/:reg_no/achievement', (0, express_validator_1.body)('category').isIn(['academic', 'co-curricular', 'extra-curricular']), (0, express_validator_1.body)('event_name').trim().isLength({ min: 1, max: 200 }).escape(), (0, express_validator_1.body)('position').isIn(['first', 'second', 'third', 'participation']), (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    const reg_no = req.params.reg_no;
    const student = db_1.db.prepare('SELECT * FROM students WHERE reg_no = ?').get(reg_no);
    if (!student)
        return res.status(404).render('404');
    if (!errors.isEmpty()) {
        const achievements = db_1.db
            .prepare('SELECT * FROM achievements WHERE student_id = ? ORDER BY achieved_at DESC')
            .all(student.id);
        const total = achievements.reduce((sum, a) => sum + a.points, 0);
        const students = db_1.db.prepare('SELECT * FROM students ORDER BY section ASC, name ASC').all();
        return res.status(400).render('dashboard/profiles', {
            students,
            selected: { ...student, total },
            achievements,
            q: '',
            errors: errors.array(),
        });
    }
    const { category, event_name, position } = req.body;
    const points = (0, db_1.calculatePoints)(position);
    db_1.db.prepare('INSERT INTO achievements (student_id, category, event_name, position, points) VALUES (?, ?, ?, ?, ?)').run(student.id, category, event_name, position, points);
    return res.redirect(`/students/profile/${encodeURIComponent(reg_no)}`);
});
