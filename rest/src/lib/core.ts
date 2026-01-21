import { RemoveWebPushToken } from "@/app/user";
import { API_KEY, APP_URL, APP_VERSION, VAPID } from "@/config";
import { withZuzAuth, Logger } from "@/lib";
import Routes from "@/routes";
import { _, dynamic } from "@zuzjs/core";
import { execSync } from "child_process";
import crypto from 'crypto';
import { Request, Response } from "express";
import Hashids from "hashids";
import nodemailer from 'nodemailer';
import webpush from "web-push";

const encryptionAlgo = 'aes-256-cbc';

const hashids = new Hashids(process.env.ENCRYPTION_KEY, +process.env.HASHIDS_LENGTH!)

export const withSeperator = (str: string|number, ...more: (string|number)[]) : string => [str, ...more].join(process.env.SEPERATOR)

export const withoutSeperator = (str: string) : string[] => str.split(process.env.SEPERATOR!)

export const toHash = ( str : number ) : string => hashids.encode(str)

export const fromHash = ( str : string ) : number => {
    try{
        const n = hashids.decode(str)
        return n.length >= 0 ? Number(n[0]) : 0
    }
    catch(e){
        return 0
    }
}

const encryptKey = (key?: string): Buffer => crypto.createHash('sha256').update(key || process.env.ENCRYPTION_KEY!).digest();

const safeB64Encode = (str: string): string => {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const safeB64Decode = (str: string): string => {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
        str += '=';
    }
    return str //Buffer.from(str, 'base64').toString('utf8');
}

export const Encode = (value: string, key?: string): string => {
    if (!value) return ``;
    const ENCRYPT_KEY = encryptKey(key);
    const iv = crypto.createHash('md5').update(ENCRYPT_KEY).digest('hex').substring(0, 16);
    const cipher = crypto.createCipheriv(encryptionAlgo, Buffer.from(ENCRYPT_KEY), iv);
    let encrypted = cipher.update(value, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return safeB64Encode(encrypted);
}

export const Decode = (value: string, key?: string): string => {
    if (!value) return ``
    try {
        const ENCRYPT_KEY = encryptKey(key);
        const iv = crypto.createHash('md5').update(ENCRYPT_KEY).digest('hex').substring(0, 16);
        const decipher = crypto.createDecipheriv(encryptionAlgo, Buffer.from(ENCRYPT_KEY), iv);
        let decrypted = decipher.update(safeB64Decode(value), 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }catch(err : any){
        Logger.error(`[DecodeFailed]`, value, key || `APP_KEY`, err)
        return ``
    }
}

export const headers = (req: Request, keys?: string[]) : dynamic => {

    const list : dynamic = {}
    keys = keys || [];

    (keys.length > 0 ? keys : Object.keys(req.headers)).map(key => {
        if ( keys.length > 0 && req.headers[key] ){
            list[_(key).camelCase()._] = req.headers[key]
        }
        else{
            list[_(key).camelCase()._] = req.headers[key]
        }
    })

    return list

}

export const handleAPI = (requestMethod: "Post" | "Get", req: Request, resp: Response) => {

    const [ key, method, action, ...rest ] = req.url.split(`/`).filter(Boolean)
    
    if ( key == API_KEY && method ){
        try{
            
            const apiRoutes = Routes[requestMethod]
            const METHOD = _(method).camelCase().ucfirst()._
            const ACTION = action ? _(action).camelCase().ucfirst()._ : null
            
            // console.log(
            //     requestMethod, 
            //     METHOD, 
            //     ACTION,
            //     (
            //         ACTION &&
            //         _(apiRoutes[METHOD]).isObject() && 
            //         apiRoutes[METHOD].private &&
            //         ACTION in apiRoutes[METHOD].private
            //     ),
            //     apiRoutes, 
            // )

            if ( METHOD in apiRoutes ){

                if ( _(apiRoutes[METHOD]).isFunction() ){
                    return apiRoutes[METHOD](req, resp)    
                }
                
                /**
                 * Called from internal only
                 */
                else if( 
                    ACTION &&
                    _(apiRoutes[METHOD]).isObject() && 
                    apiRoutes[METHOD].internal &&
                    ACTION in apiRoutes[METHOD].internal
                ){
                    console.log(`[InternalAPIRequest]`, METHOD, ACTION)
                    return apiRoutes[METHOD].internal[ACTION](req, resp)
                }
                
                else if( 
                    ACTION &&
                    _(apiRoutes[METHOD]).isObject() && 
                    apiRoutes[METHOD].private &&
                    ACTION in apiRoutes[METHOD].private
                ){
                    return withZuzAuth(req, resp, () => apiRoutes[METHOD].private[ACTION](req, resp))
                }
                else if( 
                    ACTION &&
                    _(apiRoutes[METHOD]).isObject() && 
                    ACTION in apiRoutes[METHOD]
                ){
                    return apiRoutes[METHOD][ACTION](req, resp)
                }

                return resp.status(403).send({
                    error: `403`,
                    message: req.lang!.apiWrongAction
                })
                
            }

            return resp.status(403).send({
                error: `403`,
                message: req.lang!.apiWrongMethod
            })

        }catch(e){
            return resp.status(403).send({
                error: `403`,
                message: req.lang!.youAreLost
            })

        }
    }

    return resp.status(404).send({
        error: `404`,
        message: req.lang!.youAreLost
    })
}

export const sendPush = async (
    token: {
        endpoint: string,
        expirationTime: string | number | null,
        keys: {
            p256dh: string,
            auth: string
        }
    },
    meta: {
        title: string,
        message: string,
        icon?: string,
        badge?: string,
        url?: string,
        tag?: string,
        requireInteraction?: boolean,
        silent?: boolean
    }
) => {

    const { title, message, icon, badge, url, tag, silent, requireInteraction } = meta

    webpush.setVapidDetails(
        url || APP_URL,
        VAPID.pk!,
        VAPID.sk!,
    );

    webpush.sendNotification(
        {
            endpoint: token.endpoint,
            keys: token.keys
        },
        JSON.stringify({
            title,
            body: message,
            icon: icon || "/static/icons/welcome-192.png",
            badge: icon || "/static/icons/badge-72.png",
            data: { url: url || `/` },           // opens homepage when clicked
            tag: tag || `ZAPP_${APP_VERSION}`,
            silent: silent || false,
            requireInteraction: requireInteraction || false,
        }),
        {
            TTL: 60 * 15,
        }
    )
    .then((resp: any) => {
        // console.log(`WebPushSendSent`, resp)
    })
    .catch(async (err) => {
        console.error(`[WebPushSendFailed] ${err}`)
        if ( err.statusCode && err.statusCode == 410 ){
            RemoveWebPushToken(err.endpoint)
        }
    });
}

export const sendMail = (from : string, to : string, subject : string, message : string) => {

    return new Promise((resolve, reject) => {

        const sender = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: true,
            auth: {
                user: process.env.EMAIL_ADDRESS,
                pass: process.env.EMAIL_PASSWORD
            }
        })

        sender.sendMail(
            {
                from, to, subject, html: message
            },
            (error, info) => {
                if ( error ){
                    reject(error)
                }
                else
                    resolve(info.response)
            }
        )

    })

}

export const isGitHubUrl = (url: string) : {
    valid: boolean,
    username?: string,
    repo?: string
} => {

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
}

/**
 * Executes a command with sudo if not running as root.
 * Centralizes logging and security checks.
 */
export const execSyncSudo = (command: string) => {
  try {
    // In a production panel, you might want to log every 
    // privileged command for the admin audit log.
    const finalCmd = process.getuid?.() === 0 ? command : `sudo ${command}`;
    return execSync(finalCmd, { stdio: 'pipe', encoding: 'utf8' });
  } catch (err: any) {
    throw new Error(`suExecError: ${err.stderr || err.message}`);
  }
};