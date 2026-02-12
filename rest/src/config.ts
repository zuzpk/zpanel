import { UserCookies } from "@/lib/types";
import { CookieOptions } from "express";

export const APP_PORT : number = 3001;
export const API_KEY : string = `_`;
export const APP_VERSION : string = `0.1.1`;
export const APP_NAME : string = "ZPanel";
export const APP_URL : string  = "http://192.168.100.4:2083/";
export const API_URL : string  = "http://192.168.100.4:2083/_/";
// export const APP_URL : string  = "https://dad.zuzcdn.net/";
// export const API_URL : string  = "https://dad.zuzcdn.net/_/";
export const ADMIN_EMAIL : string = `hello@zuz.com.pk`;
export const SESS_KEYS : UserCookies = {
    ID: `ui`,
    Token: `ut`,
    Data: `ud`,
    Fingerprint: `fp`,
    Session: `si`
};
export const SESS_PREFIX : string = `__`;
export const SESS_DURATION : number = 15 //15 days

export const _COOKIE_SETTING : CookieOptions = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: (24 * 60 * 60 * 1000) * SESS_DURATION
}
export const SESS_COOKIE_SETTING : CookieOptions = {
    httpOnly: false,
    ..._COOKIE_SETTING
}
export const SESS_COOKIE_SETTING_HTTP : CookieOptions = {
    httpOnly: true,
    ..._COOKIE_SETTING
}
export const DEFAULT_LANG = "en"; // for english

export const DOCUMENT_ROOT = `/zpanel/rest/`
export const BASH_ROOT = `${DOCUMENT_ROOT}bash/`


export const ALLOWED_ORIGINS : string[] = [
    `http://localhost:2083`,
    `http://192.168.100.4:2083`,
    APP_URL
]

export const VAPID : { pk: null | string, sk: null | string } = { pk: null, sk: null }