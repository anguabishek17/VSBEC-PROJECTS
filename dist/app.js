"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const helmet_1 = __importDefault(require("helmet"));
const express_session_1 = __importDefault(require("express-session"));
const connect_sqlite3_1 = __importDefault(require("connect-sqlite3"));
const csurf_1 = __importDefault(require("csurf"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = require("./routes/auth");
const dashboard_1 = require("./routes/dashboard");
const students_1 = require("./routes/students");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, 'views'));
// Simple layout middleware to wrap views with layout
app.use((req, res, next) => {
    const render = res.render.bind(res);
    res.render = (view, options, callback) => {
        const opts = options || {};
        render(view, opts, (err, html) => {
            if (err)
                return res.status(500).send(err.message);
            const layoutView = view.startsWith('dashboard/')
                ? 'dashboard/layout-wrapper'
                : '_layout-wrapper';
            return render(layoutView, { ...opts, body: html }, callback);
        });
    };
    next();
});
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            "img-src": ["'self'", 'data:'],
            "script-src": ["'self'", "'unsafe-inline'"],
            "style-src": ["'self'", "'unsafe-inline'"],
        },
    },
}));
const SQLiteStore = (0, connect_sqlite3_1.default)(express_session_1.default);
const sessionSecret = process.env.SESSION_SECRET || 'change_this_secret';
app.use((0, express_session_1.default)({
    store: new SQLiteStore({ db: 'sessions.sqlite', dir: path_1.default.join(__dirname, '..', 'data') }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 8 },
    name: 'sid',
}));
const limiter = (0, express_rate_limit_1.default)({ windowMs: 60 * 1000, max: 100 });
app.use(limiter);
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
app.use((0, csurf_1.default)());
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken?.() || '';
    res.locals.user = req.session.user || null;
    next();
});
app.get('/', (req, res) => {
    res.render('landing');
});
app.use('/auth', auth_1.router);
app.use('/dashboard', dashboard_1.router);
app.use('/students', students_1.router);
app.use((req, res) => {
    res.status(404).render('404');
});
app.use((err, req, res, next) => {
    console.error(err);
    const status = err.status || 500;
    res.status(status).render('error', { message: err.message || 'Server error' });
});
exports.default = app;
