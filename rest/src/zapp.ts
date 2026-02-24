import { Cog } from "@/app"
import { APP_NAME, APP_URL, SESS_DURATION, SESS_NAME, VAPID } from "@/config"
import {
    handleAPI,
    log
} from "@/lib"
import { initClients, redisClient, redisStore, wss } from "@/lib/clients"
import { oauthWebsocket } from "@/lib/middleware"
import { initSocketHub } from "@/lib/socket"
import { withZuzRequest } from "@/lib/zrequest"
import Routes from "@/routes"
import zorm from "@/zorm"
import { withCredentials } from "@zuzjs/core"
import bodyParser from "body-parser"
import cookieParser from "cookie-parser"
import cors from "cors"
import de from "dotenv"
import express, { Request, Response } from "express"
import session from "express-session"
import http from "http"
import path from "path"
import pc from "picocolors"
import webpush from "web-push"

de.config()
withCredentials(true)

const app = express();
const server = http.createServer(app);
const { hostname } = new URL(APP_URL);

app.set('trust proxy', 1);
app.disable(`x-powered-by`);
app.use(
    cors({
        origin: (origin, callback) => {
            // In production, we might want to validate against a whitelist
            // For now, allow the specific requesting origin to support credentials
            callback(null, origin || true); 
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }), 
    cookieParser(process.env.ENCRYPTION_KEY), 
    bodyParser.json(),
    bodyParser.urlencoded({ extended: true }),
    session({
        secret: process.env.ENCRYPTION_KEY!,
        name: SESS_NAME,
        resave: false,
        saveUninitialized: false,
        store: redisStore,
        cookie: { 
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? `none` : 'lax',
            maxAge: 24 * 60 * 60 * 1000 * SESS_DURATION,
            domain: hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
                ? undefined
                : hostname

                // Use this if you want wildcard like *.domain.com
                // `.${hostname.split('.').slice(-2).join('.')}`,
        }
    }),
    withZuzRequest
);

app.use('/public', express.static(path.join(process.cwd(), 'iconfonts_built')));
app.get(`/*splat`, (req: Request, resp: Response) => handleAPI("Get", req, resp))
app.post(`/*splat`, (req: Request, resp: Response) => handleAPI("Post", req, resp))

// HTTP Upgrade (WebSocket Handshake)
server.on('upgrade', async (req, socket, head) => {
    
    const wsUri = new URL(req.url || '/', `http://${req.headers.host}`);
    const isProtected = Routes.WebSocket.private.some((p: string) => wsUri.pathname.startsWith(p));

    try {

        const session = await oauthWebsocket(wsUri, req.headers.cookie || '');

        if (isProtected && !session) {
            log.error(APP_NAME, `Unauthorized WebSocket connection attempt to ${wsUri.pathname}`);
            socket.end('HTTP/1.1 401 Unauthorized\r\n\r\n');
            return;
        }
        
        wss.handleUpgrade(req, socket, head, (ws: any) => {
            ws.session = session;
            ws.topics = new Set();
            ws.currentApp = wsUri.searchParams.get("id");
            wss.emit('connection', ws, req);
        });

    } catch (err) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
    }
});

const gracefulShutdown = () => {
    log.error(APP_NAME, "Received kill signal, shutting down gracefully...");
    server.close(() => {
        log.error(APP_NAME, "HTTP server closed.");
        redisClient.quit().then(() => {
            log.error(APP_NAME, "Redis disconnected.");
            process.exit(0);
        });
    });

    // Force close after 2 seconds if graceful fails
    setTimeout(() => {
        log.error(APP_NAME, "Could not close connections in time, forceful shutdown");
        process.exit(1);
    }, 2000);
};

// Bootup
const boot = async () => {

    console.log(pc.cyan("------------------------------------------"));
    console.log(pc.cyan(`[${APP_NAME}] Booting in ${process.env.NODE_ENV} mode...`));
    console.log(pc.cyan("------------------------------------------"));

    await initClients();
    initSocketHub();

    server.listen(process.env.APP_PORT, async () => {

        zorm.connect().then(async () => {
            const vapidKeys = webpush.generateVAPIDKeys();
            const _cog = await Cog([`vapid_pk`, `vapid_sk`], [vapidKeys.publicKey, vapidKeys.privateKey])
            VAPID.pk = _cog!.vapid_pk as string;
            VAPID.sk = _cog!.vapid_sk as string; 

            log.info(APP_NAME, `🚀 Server ready on port ${process.env.APP_PORT}`)
        })
        .catch((err: any) => {
            console.error(`[ZormConnectionFailed]`, err)
        })

    })

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

};

boot();