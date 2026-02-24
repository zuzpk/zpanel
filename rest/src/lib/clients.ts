import { APP_NAME } from "@/config";
import { log } from "@/lib";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
import { WebSocketServer } from "ws";

export const redisClient = createClient();
export const redisSub = redisClient.duplicate();

export const wss = new WebSocketServer({ noServer: true });

export const redisStore = new RedisStore({
    client: redisClient,
    prefix: `zapp:`,
    disableTouch: false
});

export const initClients = async () => {

    if ( redisClient.isOpen ) return;

    await redisClient.connect().catch((err: any) => log.error(APP_NAME, 'Redis Connection Error', err));
    await redisSub.connect().catch((err: any) => log.error(APP_NAME, 'RedisSub Connection Error', err));

    log.info(APP_NAME, `[*] Redis Clients Initialized`);
};