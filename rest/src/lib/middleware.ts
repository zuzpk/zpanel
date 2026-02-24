import { SESS_NAME } from "@/config";
import { redisStore } from "@/lib/clients";
import { UserSession } from "@/lib/types";
import { parse } from "cookie";

export const oauthWebsocket = async (wsUri: URL, cookiesHeader: string) : Promise<UserSession | null> => {

    const cookies = parse(cookiesHeader || '');
    const sid = cookies[SESS_NAME];
    if (!sid) return null

    const unsignedSid = sid.split('.')[0]?.replace('s:', '');
    const session: UserSession = await new Promise((res, rej) => {
        redisStore.get(unsignedSid ?? `-`, (err, s) => (err || !s) ? rej(err) : res(s));
    });

    if (!session.loggedIn) return null

    // Path specific permission check
    if (wsUri.pathname === `/wss/any`) {
        return null
    }

    return session;
};