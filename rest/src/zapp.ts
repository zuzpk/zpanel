import { Cog } from "@/app"
import { APP_NAME, SESS_DURATION, VAPID, APP_URL } from "@/config"
import { 
    handleAPI, 
    Logger, 
    headers,
    handleSocketMessage,
    log,
} from "@/lib"
import { withZuzRequest } from "@/lib/zrequest"
import zorm from "@/zorm"
import bodyParser from "body-parser"
import cookieParser from "cookie-parser"
import { parse } from "cookie"
import cors from "cors"
import de from "dotenv"
import express, { Request, Response } from "express"
import session from "express-session"
import http, { IncomingMessage } from "http"
import type { Buffer as BufferType } from "node:buffer"
import { Socket } from "node:net"
import webpush from "web-push"
import { WebSocket, WebSocketServer } from "ws"
import { createClient } from "redis"
import { RedisStore } from "connect-redis"
import { withCredentials } from "@zuzjs/core"
import { exec } from "node:child_process"
import Routes from "./routes"
import pc from "picocolors";

const redisClient = createClient();
redisClient.on('error', (err: any) => log.error(APP_NAME, 'Redis Client Error', err));
redisClient.connect().catch((err: any) => log.error(APP_NAME, 'Redis Connection Error', err));
const redisStore = new RedisStore({
  client: redisClient,
  prefix: `zapp:`,
  disableTouch: false
})

de.config()

withCredentials(true)

/** Parse APP_URL to get Host for session store */
const { hostname } = new URL(APP_URL);

const app = express();
app.set('trust proxy', 1);
app.disable(`x-powered-by`);
app.use(
    cors({
        origin: (origin, callback) => {
            // In production, you might want to validate against a whitelist
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
        name: `${APP_NAME.toLowerCase()}.sid`,
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
    // withZuzAuth,
    // withAccessLogger,
    withZuzRequest
)
 
app.get(`/*splat`, (req: Request, resp: Response) => handleAPI("Get", req, resp))
app.post(`/*splat`, (req: Request, resp: Response) => handleAPI("Post", req, resp))

const httpServer = http.createServer(app)
export const wss = new WebSocketServer({ noServer: true })

httpServer.on(`upgrade`, async (req: IncomingMessage, socket: Socket, head: BufferType) => {
    try{

        const wsUri = new URL(req.url || '/', `http://${req.headers.host}`);
        // console.log(pc.yellow(`[WebSocketUpgradeAttempt]`), wsUri);
        const isProtected = Routes.WebSocket.private.some((p: string) => wsUri.pathname.startsWith(p));

        if (isProtected) {
            try {
                const cookies = parse(req.headers.cookie || '');
                const sid = cookies[`${APP_NAME.toLowerCase()}.sid`];

                if (!sid) throw new Error("No session found");

                // Extract the actual session ID from the signed cookie string
                const unsignedSid = sid.split('.')[0]?.replace('s:', '');
                
                // Look up session in Redis
                redisStore.get(unsignedSid ?? `-`, (err: any, session: any) => {
                    if (err || !session || !session.loggedIn) {
                        log.error(APP_NAME, `Unauthorized WebSocket connection attempt to ${wsUri.pathname}`);
                        socket.end('HTTP/1.1 401 Unauthorized\r\n\r\n');
                        return;
                    }
                    
                    // Authorized! Pass session info to the connection
                    wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
                        ws.session = session; 
                        wss.emit('connection', ws, req);
                    });
                });
                return;
            } catch (err) {
                log.error(APP_NAME, `Unauthorized WebSocket connection attempt to ${wsUri.pathname}`);
                socket.end('HTTP/1.1 401 Unauthorized\r\n\r\n');
                return;
            }
        }

        wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
            wss.emit('connection', ws, req);
        });
    }
    catch(err){
        log.error(APP_NAME, `[HTTPRequestUpgradeErrored]`, err);
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    }
})

wss.on(`connection`, (ws: WebSocket, req: Request) => {

    const { origin, cfConnectingIp, cfIpcountry } = headers(req)
    log.info(APP_NAME, `WebSocket connection established from`, `${origin} [${cfConnectingIp}]`)
    
    ws.on(`message`, async (ms: any) => handleSocketMessage(req, ms, ws, origin))
    ws.on(`close`, () => {
        log.info(APP_NAME, `[${cfIpcountry}:${cfConnectingIp}] Socket Client Disconnected`)
    })

})

httpServer.listen(process.env.APP_PORT, async () => {

    zorm.connect().then(async () => {
        const vapidKeys = webpush.generateVAPIDKeys();
        const _cog = await Cog([`vapid_pk`, `vapid_sk`], [vapidKeys.publicKey, vapidKeys.privateKey])
        VAPID.pk = _cog!.vapid_pk as string;
        VAPID.sk = _cog!.vapid_sk as string; 
        
        log.info(APP_NAME, `🚀 Server is running on port ${process.env.APP_PORT}`)
    })
    .catch((err: any) => {
        console.error(`[ZormConnectionFailed]`, err)
    })

})

// Add this to the end of zapp.ts
const gracefulShutdown = () => {
    log.error(APP_NAME, "Received kill signal, shutting down gracefully...");
    httpServer.close(() => {
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

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);