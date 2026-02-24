import { version } from "../package.json";
export const APP_PORT : number = 2082;
export const API_KEY : string = `_`;
export const APP_VERSION : string = version;
export const APP_NAME : string = `ZPanel`;
export const APP_URL : string  = "http://192.168.100.4:2083/";
export const API_URL : string  = "http://192.168.100.4:2083/_/";
export const ADMIN_EMAIL : string = `hello@zuz.com.pk`;

export const SESS_NAME : string = `${APP_NAME.toLowerCase()}.sid`
export const SESS_DURATION : number = 15 //15 days
export const SESS_MAX_AGE : number = (24 * 60 * 60 * 1000) * SESS_DURATION
export const DEFAULT_LANG = "en"; // for english

export const DOCUMENT_ROOT = `/zpanel/rest/`
export const BASH_ROOT = `${DOCUMENT_ROOT}bash/`

export const ALLOWED_ORIGINS : string[] = [
    `http://localhost:2083`,
    `http://192.168.100.4:2083`,
    APP_URL
]

export const VAPID : { pk: null | string, sk: null | string } = { pk: null, sk: null }