"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withZuzAuth = void 0;
const withZuzAuth = async (req, res, next) => {
    if (!req.session.loggedIn) {
        return res.send({
            error: `oauth`,
            stamp: Date.now(),
            message: req.lang.unauthorized
        });
    }
    next();
};
exports.withZuzAuth = withZuzAuth;
