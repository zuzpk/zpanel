import { pubsub } from "@/cache";
import { APP_NAME } from "@/config";
import { fromHash, headers, log } from "@/lib";
import { redisClient, redisSub, wss } from "@/lib/clients";
import { LOG_SYMBOLS } from "@/lib/logger";
import { Events } from "@/lib/types";
import { dynamic } from "@zuzjs/core";
import { IncomingMessage } from "node:http";
import { WebSocket } from "ws";

let isInitialized = false;

export const handleSocketMessage = (req:IncomingMessage, ms, ws, origin) => {

    const raw = JSON.parse(Buffer.isBuffer(ms) ? ms.toString(`utf8`) : `string` == typeof ms ? ms : ms.data)

    const respond = (a: string, m: dynamic) => {
        if ( ws && ws.readyState == WebSocket.OPEN ){
            ws.send(JSON.stringify({ a, m, }))
        }
    }

    // pubsub.on(Events.TLog, (entry: LogEntry) => respond("tlog", { msg: `[${pc.cyan(entry.appId)}] ${entry.message}` }))    

    if ( `a` in raw ){

        switch(raw.a){
            case "ping":
                respond("pong", {})
                break;            
        }
    }
}

export const initSocketHub = () => {

    if (isInitialized) return;

    // 1. Global Redis Subscriber
    redisSub.pSubscribe('app:*', (message, channel) => {
        try {
            
            const [, _channel ] = channel.split(`:`);

            const data = JSON.parse(message);
            // const data = _(_data).isArray() && _data.length == 1 ? _data[0] : _data
            (wss.clients as Set<WebSocket>).forEach((ws) => {
                if (ws.readyState === WebSocket.OPEN) {
                    
                    if ( _channel && _channel.startsWith(`u@`) ){
                        const [, uid, event ] = _channel.split(`@`);
                        if ( uid && ws.session?.uid == fromHash(uid) ){
                            ws.send(JSON.stringify({ a: event, m: data }));    
                        }
                    }

                    else if ( _channel && _channel.startsWith(`set@`) ){
                        const [, appId, event ] = _channel.split(`@`);
                        if (ws.topics?.has(`app:${appId}`)) {
                            ws.send(JSON.stringify({ a: event, m: data }));
                        }
                    }

                    else if (ws.topics?.has(channel)) {
                        ws.send(JSON.stringify({ a: channel, m: data }));
                    }
                }
            });
        } catch (err) {
            log.error(APP_NAME, `[X] Redis Sub Error`, err);
        }
    });

    // 2. Connection Handler
    wss.on(`connection`, (ws: WebSocket, req: any) => {

        ws.removeAllListeners('message');
        ws.removeAllListeners('close');

        const { origin, cfConnectingIp } = headers(req);
        log.info(APP_NAME, `${LOG_SYMBOLS.add} Socket Connected: ${origin} [${cfConnectingIp}]`);

        ws.on(`message`, (ms) => handleSocketMessage(req, ms, ws, origin));
        ws.on(`close`, () => log.info(APP_NAME, `${LOG_SYMBOLS.remove} Socket Disconnected`));
    });


    pubsub.on(Events.onUserSocket, (action, event, ...args) => {
        redisClient.publish(
            `app:u@${action}@${event}`, 
            typeof args == `string` ? args : JSON.stringify(args)
        )
    })

    pubsub.on(Events.onPubSocket, (action, event, ...args) => {
        redisClient.publish(
            `app:${action}@${event}`, 
            typeof args == `string` ? args : JSON.stringify(args)
        )
    })

    

    isInitialized = true;

};
