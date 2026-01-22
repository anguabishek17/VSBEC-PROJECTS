import { Router } from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import { db } from '../db';

export const router = Router();

router.get('/login', (req, res) => {
  res.render('login');
});

router.post(
  '/login',
  body('user_id').trim().isLength({ min: 1, max: 50 }).escape(),
  body('password').isLength({ min: 8, max: 200 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('login', { errors: errors.array() });
    }

    const { user_id, password } = req.body as { user_id: string; password: string };

    const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(user_id) as any;
    if (!user) {
      return res.status(401).render('login', { errors: [{ msg: 'Invalid credentials' }] });
    }

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) {
      return res.status(401).render('login', { errors: [{ msg: 'Invalid credentials' }] });
    }

    (req.session as any).user = { id: user.id as number, user_id: user.user_id as string };

    return res.render('post-login-loading');
  }
);

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});
