"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.execSyncSudo = exports.isGitHubUrl = exports.sendMail = exports.sendPush = exports.handleAPI = exports.headers = exports.Decode = exports.Encode = exports.fromHash = exports.toHash = exports.withoutSeperator = exports.withSeperator = void 0;
const user_1 = require("../app/user");
const config_1 = require("../config");
const lib_1 = require("../lib");
const routes_1 = __importDefault(require("../routes"));
const core_1 = require("@zuzjs/core");
const child_process_1 = require("child_process");
const crypto_1 = __importDefault(require("crypto"));
const hashids_1 = __importDefault(require("hashids"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const web_push_1 = __importDefault(require("web-push"));
const encryptionAlgo = 'aes-256-cbc';
const hashids = new hashids_1.default(process.env.ENCRYPTION_KEY, +process.env.HASHIDS_LENGTH);
const withSeperator = (str, ...more) => [str, ...more].join(process.env.SEPERATOR);
exports.withSeperator = withSeperator;
const withoutSeperator = (str) => str.split(process.env.SEPERATOR);
exports.withoutSeperator = withoutSeperator;
const toHash = (str) => hashids.encode(str);
exports.toHash = toHash;
const fromHash = (str) => {
    try {
        const n = hashids.decode(str);
        return n.length >= 0 ? Number(n[0]) : 0;
    }
    catch (e) {
        return 0;
    }
};
exports.fromHash = fromHash;
const encryptKey = (key) => crypto_1.default.createHash('sha256').update(key || process.env.ENCRYPTION_KEY).digest();
const safeB64Encode = (str) => {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const safeB64Decode = (str) => {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
        str += '=';
    }
    return str;
};
const Encode = (value, key) => {
    if (!value)
        return ``;
    const ENCRYPT_KEY = encryptKey(key);
    const iv = crypto_1.default.createHash('md5').update(ENCRYPT_KEY).digest('hex').substring(0, 16);
    const cipher = crypto_1.default.createCipheriv(encryptionAlgo, Buffer.from(ENCRYPT_KEY), iv);
    let encrypted = cipher.update(value, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return safeB64Encode(encrypted);
};
exports.Encode = Encode;
const Decode = (value, key) => {
    if (!value)
        return ``;
    try {
        const ENCRYPT_KEY = encryptKey(key);
        const iv = crypto_1.default.createHash('md5').update(ENCRYPT_KEY).digest('hex').substring(0, 16);
        const decipher = crypto_1.default.createDecipheriv(encryptionAlgo, Buffer.from(ENCRYPT_KEY), iv);
        let decrypted = decipher.update(safeB64Decode(value), 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (err) {
        lib_1.Logger.error(`[DecodeFailed]`, value, key || `APP_KEY`, err);
        return ``;
    }
};
exports.Decode = Decode;
const headers = (req, keys) => {
    const list = {};
    keys = keys || [];
    (keys.length > 0 ? keys : Object.keys(req.headers)).map(key => {
        if (keys.length > 0 && req.headers[key]) {
            list[(0, core_1._)(key).camelCase()._] = req.headers[key];
        }
        else {
            list[(0, core_1._)(key).camelCase()._] = req.headers[key];
        }
    });
    return list;
};
exports.headers = headers;
const handleAPI = (requestMethod, req, resp) => {
    const [key, method, action, ...rest] = req.url.split(`/`).filter(Boolean);
    if (key == config_1.API_KEY && method) {
        try {
            const apiRoutes = routes_1.default[requestMethod];
            const METHOD = (0, core_1._)(method).camelCase().ucfirst()._;
            const ACTION = action ? (0, core_1._)(action).camelCase().ucfirst()._ : null;
            if (METHOD in apiRoutes) {
                if ((0, core_1._)(apiRoutes[METHOD]).isFunction()) {
                    return apiRoutes[METHOD](req, resp);
                }
                else if (ACTION &&
                    (0, core_1._)(apiRoutes[METHOD]).isObject() &&
                    apiRoutes[METHOD].internal &&
                    ACTION in apiRoutes[METHOD].internal) {
                    console.log(`[InternalAPIRequest]`, METHOD, ACTION);
                    return apiRoutes[METHOD].internal[ACTION](req, resp);
                }
                else if (ACTION &&
                    (0, core_1._)(apiRoutes[METHOD]).isObject() &&
                    apiRoutes[METHOD].private &&
                    ACTION in apiRoutes[METHOD].private) {
                    return (0, lib_1.withZuzAuth)(req, resp, () => apiRoutes[METHOD].private[ACTION](req, resp));
                }
                else if (ACTION &&
                    (0, core_1._)(apiRoutes[METHOD]).isObject() &&
                    ACTION in apiRoutes[METHOD]) {
                    return apiRoutes[METHOD][ACTION](req, resp);
                }
                return resp.status(403).send({
                    error: `403`,
                    message: req.lang.apiWrongAction
                });
            }
            return resp.status(403).send({
                error: `403`,
                message: req.lang.apiWrongMethod
            });
        }
        catch (e) {
            return resp.status(403).send({
                error: `403`,
                message: req.lang.youAreLost
            });
        }
    }
    return resp.status(404).send({
        error: `404`,
        message: req.lang.youAreLost
    });
};
exports.handleAPI = handleAPI;
const sendPush = async (token, meta) => {
    const { title, message, icon, badge, url, tag, silent, requireInteraction } = meta;
    web_push_1.default.setVapidDetails(url || config_1.APP_URL, config_1.VAPID.pk, config_1.VAPID.sk);
    web_push_1.default.sendNotification({
        endpoint: token.endpoint,
        keys: token.keys
    }, JSON.stringify({
        title,
        body: message,
        icon: icon || "/static/icons/welcome-192.png",
        badge: icon || "/static/icons/badge-72.png",
        data: { url: url || `/` },
        tag: tag || `ZAPP_${config_1.APP_VERSION}`,
        silent: silent || false,
        requireInteraction: requireInteraction || false,
    }), {
        TTL: 60 * 15,
    })
        .then((resp) => {
    })
        .catch(async (err) => {
        console.error(`[WebPushSendFailed] ${err}`);
        if (err.statusCode && err.statusCode == 410) {
            (0, user_1.RemoveWebPushToken)(err.endpoint);
        }
    });
};
exports.sendPush = sendPush;
const sendMail = (from, to, subject, message) => {
    return new Promise((resolve, reject) => {
        const sender = nodemailer_1.default.createTransport({
            service: process.env.EMAIL_SERVICE,
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: true,
            auth: {
                user: process.env.EMAIL_ADDRESS,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        sender.sendMail({
            from, to, subject, html: message
        }, (error, info) => {
            if (error) {
                reject(error);
            }
            else
                resolve(info.response);
        });
    });
};
exports.sendMail = sendMail;
const isGitHubUrl = (url) => {
    const httpsPattern = /^https:\/\/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)(\.git)?$/;
    const sshPattern = /^git@github\.com:([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)(\.git)?$/;
    const httpsMatch = url.match(httpsPattern);
    const sshMatch = url.match(sshPattern);
    if (httpsMatch) {
        return { valid: true, username: httpsMatch[1] ?? `-`, repo: httpsMatch[2] ?? `-` };
    }
    if (sshMatch) {
        return { valid: true, username: sshMatch[1] ?? `-`, repo: sshMatch[2] ?? `-` };
    }
    return { valid: false };
};
exports.isGitHubUrl = isGitHubUrl;
const execSyncSudo = (command) => {
    try {
        const finalCmd = process.getuid?.() === 0 ? command : `sudo ${command}`;
        return (0, child_process_1.execSync)(finalCmd, { stdio: 'pipe', encoding: 'utf8' });
    }
    catch (err) {
        throw new Error(`suExecError: ${err.stderr || err.message}`);
    }
};
exports.execSyncSudo = execSyncSudo;
