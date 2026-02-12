import { dynamic } from "@zuzjs/core";
import http, { IncomingMessage } from "http"
import Routes from "@/routes";
import { logHistory, log, LogEntry } from "@/lib";
import { APP_NAME } from "@/config";
import pc from "picocolors"
import { pubsub } from "@/cache";
import { Events } from "./types";

export const handleSocketMessage = (req: IncomingMessage, ms, ws, origin) => {
    
    const wsUri = new URL(req.url || '/', `http://${req.headers.host}`);
    const isProtected = Routes.WebSocket.private.some((p: string) => wsUri.pathname.startsWith(p));
    
    const raw = JSON.parse(Buffer.isBuffer(ms) ? ms.toString(`utf8`) : `string` == typeof ms ? ms : ms.data)

    const respond = (a: string, m: dynamic) => {
        if ( ws && ws.readyState == WebSocket.OPEN ){
            ws.send(JSON.stringify({ a, m, }))
        }
    }

    const noLogEntry = (appId : string) : LogEntry[] => [
        { 
            appId: `[${pc.cyan(appId == `-` ? APP_NAME : appId)}]`, 
            level: "info", 
            message: "...", 
            timestamp: new Date().toISOString() 
        }
    ]

    pubsub.on(Events.TLog, (entry: LogEntry) => respond("tlog", { msg: `[${pc.cyan(entry.appId)}] ${entry.message}` }))    

    if ( `a` in raw && `m` in raw){

        switch(raw.a){
            case "ping":
                respond("pong", {})
                break;
            case "tlog":
                // const history = logHistory.filter((l: LogEntry) => l.appId === raw.m);
                // (
                //     raw.m != `-` ?
                //         history.length > 0 ? history : noLogEntry(raw.m)
                //         : logHistory.length > 0 ? logHistory
                //             : noLogEntry(`-`)
                // )
                logHistory.forEach((log: LogEntry) => {
                    respond("tlog", { appId: raw.m, msg: `[${pc.cyan(log.appId)}] ${log.message}` })
                })
                break;
        }


    }

}