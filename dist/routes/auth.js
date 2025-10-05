"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const express_validator_1 = require("express-validator");
const db_1 = require("../db");
exports.router = (0, express_1.Router)();
exports.router.get('/login', (req, res) => {
    res.render('login');
});
exports.router.post('/login', (0, express_validator_1.body)('user_id').trim().isLength({ min: 1, max: 50 }).escape(), (0, express_validator_1.body)('password').isLength({ min: 8, max: 200 }), (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('login', { errors: errors.array() });
    }
    const { user_id, password } = req.body;
    const user = db_1.db.prepare('SELECT * FROM users WHERE user_id = ?').get(user_id);
    if (!user) {
        return res.status(401).render('login', { errors: [{ msg: 'Invalid credentials' }] });
    }
    const ok = bcrypt_1.default.compareSync(password, user.password_hash);
    if (!ok) {
        return res.status(401).render('login', { errors: [{ msg: 'Invalid credentials' }] });
    }
    req.session.user = { id: user.id, user_id: user.user_id };
    return res.render('post-login-loading');
});
exports.router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login');
    });
});
