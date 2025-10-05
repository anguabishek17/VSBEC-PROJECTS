"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
function requireAuth(req, res, next) {
    if (req.session?.user)
        return next();
    return res.redirect('/auth/login');
}
