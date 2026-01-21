"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VAPID = exports.ALLOWED_ORIGINS = exports.BASH_ROOT = exports.DOCUMENT_ROOT = exports.DEFAULT_LANG = exports.SESS_COOKIE_SETTING_HTTP = exports.SESS_COOKIE_SETTING = exports._COOKIE_SETTING = exports.SESS_DURATION = exports.SESS_PREFIX = exports.SESS_KEYS = exports.ADMIN_EMAIL = exports.API_URL = exports.APP_URL = exports.APP_NAME = exports.APP_VERSION = exports.API_KEY = exports.APP_PORT = void 0;
exports.APP_PORT = 3001;
exports.API_KEY = `_`;
exports.APP_VERSION = `0.1.1`;
exports.APP_NAME = "ZPanel";
exports.APP_URL = "http://192.168.100.4:2083/";
exports.API_URL = "http://192.168.100.4:2083/_/";
exports.ADMIN_EMAIL = `hello@zuz.com.pk`;
exports.SESS_KEYS = {
    ID: `ui`,
    Token: `ut`,
    Data: `ud`,
    Fingerprint: `fp`,
    Session: `si`
};
exports.SESS_PREFIX = `__`;
exports.SESS_DURATION = 15;
exports._COOKIE_SETTING = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: (24 * 60 * 60 * 1000) * exports.SESS_DURATION
};
exports.SESS_COOKIE_SETTING = {
    httpOnly: false,
    ...exports._COOKIE_SETTING
};
exports.SESS_COOKIE_SETTING_HTTP = {
    httpOnly: true,
    ...exports._COOKIE_SETTING
};
exports.DEFAULT_LANG = "en";
exports.DOCUMENT_ROOT = `/zpanel/rest/`;
exports.BASH_ROOT = `${exports.DOCUMENT_ROOT}bash/`;
exports.ALLOWED_ORIGINS = [
    `http://localhost:2083`,
    `http://192.168.100.4:2083`,
    exports.APP_URL
];
exports.VAPID = { pk: null, sk: null };
