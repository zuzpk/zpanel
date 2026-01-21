"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wss = void 0;
const app_1 = require("./app");
const config_1 = require("./config");
const lib_1 = require("./lib");
const zrequest_1 = require("./lib/zrequest");
const zorm_1 = __importDefault(require("./zorm"));
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const http_1 = __importDefault(require("http"));
const web_push_1 = __importDefault(require("web-push"));
const ws_1 = require("ws");
const redis_1 = require("redis");
const connect_redis_1 = require("connect-redis");
const core_1 = require("@zuzjs/core");
const redisClient = (0, redis_1.createClient)();
redisClient.connect().catch(console.error);
const redisStore = new connect_redis_1.RedisStore({
    client: redisClient,
    prefix: "myapp:",
});
dotenv_1.default.config();
(0, core_1.withCredentials)(true);
const { hostname } = new URL(config_1.APP_URL);
const app = (0, express_1.default)();
app.disable(`x-powered-by`);
app.use((0, cors_1.default)({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}), (0, cookie_parser_1.default)(process.env.ENCRYPTION_KEY), body_parser_1.default.json(), body_parser_1.default.urlencoded({ extended: true }), (0, express_session_1.default)({
    secret: process.env.ENCRYPTION_KEY,
    name: `${config_1.APP_NAME.toLowerCase()}.sid`,
    resave: false,
    saveUninitialized: false,
    store: redisStore,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 * config_1.SESS_DURATION,
        domain: hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
            ? undefined
            : `.${hostname.split('.').slice(-2).join('.')}`,
    }
}), zrequest_1.withZuzRequest);
app.get(`/*splat`, (req, resp) => (0, lib_1.handleAPI)("Get", req, resp));
app.post(`/*splat`, (req, resp) => (0, lib_1.handleAPI)("Post", req, resp));
const httpServer = http_1.default.createServer(app);
exports.wss = new ws_1.WebSocketServer({ noServer: true });
httpServer.on(`upgrade`, async (req, socket, head) => {
    try {
        exports.wss.handleUpgrade(req, socket, head, (ws) => {
            exports.wss.emit('connection', ws, req);
        });
    }
    catch (err) {
        lib_1.Logger.error(`[HTTPRequestUpgradeErrored]`, err);
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    }
});
httpServer.listen(process.env.APP_PORT, async () => {
    zorm_1.default.connect().then(async () => {
        const vapidKeys = web_push_1.default.generateVAPIDKeys();
        const _cog = await (0, app_1.Cog)([`vapid_pk`, `vapid_sk`], [vapidKeys.publicKey, vapidKeys.privateKey]);
        config_1.VAPID.pk = _cog.vapid_pk;
        config_1.VAPID.sk = _cog.vapid_sk;
        console.log(`🚀 Server is running on port ${process.env.APP_PORT}`);
    })
        .catch((err) => {
        console.error(`[ZormConnectionFailed]`, err);
    });
});
