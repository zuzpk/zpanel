import { pubsub } from "@/cache"
import { headers } from "@/lib"
import { _, dynamic } from "@zuzjs/core"
import { NextFunction, Request, Response } from "express"
import pc from "picocolors"
import winston from "winston"
import { Events } from "./types"

// Circular buffer for in-memory logs
export const LOG_HISTORY_LIMIT = 100;
export interface LogEntry { 
    appId: string, 
    level: `info` | `warn` | `error`, 
    message: string, 
    timestamp: string,
}
export const logHistory: LogEntry[] = [];

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY/MM/DD HH:mm:ss" }),
    winston.format.splat(),
    winston.format.printf(({ timestamp, level, message, appId }) => {
        const tag = appId ? `[${appId}]` : "";
        return `${timestamp}${tag} [${level == `info` ? pc.cyan(level) : level == `warn` ? pc.yellow(level) : pc.red(level)}]: ${message}`;
    })
)

export const Logger = winston.createLogger({
    level: "info",
    format: logFormat,
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "logs/zpanel.log" }),
        new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    ]
})

const accessLogger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY/MM/DD HH:mm:ss" }),
        winston.format.splat(),
        winston.format.printf(({ timestamp, message }) => {
            const { userIP, userAgent, country, method, url } = message as dynamic
            return `${country || `Anonymous`} (${userIP || `?`}): [${timestamp}] "${method} ${url}" "${userAgent}"`
        })
    ),
    transports: [
        new winston.transports.File({ filename: "logs/access.log" }),
    ]
})

export const withAccessLogger = (req: Request, res: Response, next: NextFunction) => {
        
    const { userAgent, cfIpcountry : country, xForwardedFor  } = headers(req) 
    accessLogger.info({ 
        userIP: xForwardedFor,
        userAgent,
        country,
        method: req.method, 
        url: req.url  
    })

    next()

}

export const echo = (
    appId: string, 
    level: `info` | `warn` | `error`, 
    message: string
) => {

    const logEntry = { 
        appId: appId, 
        level, 
        message, 
        timestamp: new Date().toISOString() 
    };
    
    // Add to in-memory history
    logHistory.push(logEntry);
    if (logHistory.length > LOG_HISTORY_LIMIT) {
        logHistory.shift(); // Remove oldest
    }

    pubsub.emit(Events.TLog, logEntry)

    Logger.log({ 
        level, 
        message: logEntry.message, 
        appId: logEntry.appId 
    });
};

export const log = {
    info: (appId: string, message: string, ...data: any[]) =>  echo(appId, `info`, [ message, ...data.map(d => _(d).isObject() ? JSON.stringify(d) : d ) ].join(' ')),
    warn: (appId: string, message: string, ...data: any[]) => echo(appId, `warn`, [ message, ...data.map(d => _(d).isObject() ? JSON.stringify(d) : d ) ].join(' ')),
    error: (appId: string, message: string, ...data: any[]) => echo(appId, `error`, [ message, ...data.map(d => _(d).isObject() ? JSON.stringify(d) : d ) ].join(' ')),
}

/**
 * Standard CMD/Terminal symbols (ASCII only)
 */
export const LOG_SYMBOLS = {
    // Basic status
    success: pc.green('✔'),        // Checkmark replacement
    error:   pc.red(`X`),         // Cross mark replacement
    warn:    pc.yellow(`⚡`),         // Warning / Circle replacement
    info:    pc.gray(`○`),         // Information / Bullet
    debug:   pc.cyan('#'),         // Debug / Hash

    // Progress/Process indicators
    pending: '[...]',       // Loading
    wait:    '[?]',         // Awaiting input/response
    add:     '[+]',         // Item added/created
    remove:  '[-]',         // Item removed/deleted
    arrow:   '->',          // Direction/Flow
    
    // Borders for logging sections
    divider: '--------------------------------------------------',
    bullet:  '>'
} as const;

export type LogSymbol = keyof typeof LOG_SYMBOLS;