import express from 'express';
import path from 'path';
import helmet from 'helmet';
import session from 'express-session';
import SQLiteStoreFactory from 'connect-sqlite3';
import csrf from 'csurf';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { router as authRouter } from './routes/auth';
import { router as dashboardRouter } from './routes/dashboard';
import { router as studentRouter } from './routes/students';

dotenv.config();

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Simple layout middleware to wrap views with layout
app.use((req, res, next) => {
  const render = res.render.bind(res);
  (res as any).render = (view: string, options?: any, callback?: any) => {
    const opts = options || {};
    render(view, opts, (err: any, html: string) => {
      if (err) return res.status(500).send(err.message);
      const layoutView = view.startsWith('dashboard/')
        ? 'dashboard/layout-wrapper'
        : '_layout-wrapper';
      return render(layoutView, { ...opts, body: html }, callback);
    });
  };
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "img-src": ["'self'", 'data:'],
      "script-src": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'"],
    },
  },
}));

const SQLiteStore = SQLiteStoreFactory(session) as unknown as typeof session.Store & (new (opts: any) => session.Store);
const sessionSecret = process.env.SESSION_SECRET || 'change_this_secret';

app.use(
  session({
    store: new (SQLiteStore as any)({ db: 'sessions.sqlite', dir: path.join(__dirname, '..', 'data') }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 8 },
    name: 'sid',
  })
);

const limiter = rateLimit({ windowMs: 60 * 1000, max: 100 });
app.use(limiter);

app.use(express.static(path.join(__dirname, 'public')));

app.use(csrf());
app.use((req, res, next) => {
  res.locals.csrfToken = (req as any).csrfToken?.() || '';
  res.locals.user = (req.session as any).user || null;
  next();
});

app.get('/', (req, res) => {
  res.render('landing');
});

app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);
app.use('/students', studentRouter);

app.use((req, res) => {
  res.status(404).render('404');
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).render('error', { message: err.message || 'Server error' });
});

export default app;
