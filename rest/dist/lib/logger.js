"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAccessLogger = exports.Logger = void 0;
const lib_1 = require("../lib");
const winston_1 = __importDefault(require("winston"));
exports.Logger = winston_1.default.createLogger({
    level: "info",
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: "YYYY/MM/DD HH:mm:ss" }), winston_1.default.format.splat(), winston_1.default.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level}] ${message}`;
    })),
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: "YYYY/MM/DD HH:mm:ss" }), winston_1.default.format.splat(), winston_1.default.format.printf(({ timestamp, level, message }) => {
                return `${timestamp} [${level}] ${message}`;
            })),
        }),
        new winston_1.default.transports.File({ filename: "logs/error.log", level: "error" }),
        new winston_1.default.transports.File({ filename: "logs/combined.log" }),
    ]
});
const accessLogger = winston_1.default.createLogger({
    level: "info",
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: "YYYY/MM/DD HH:mm:ss" }), winston_1.default.format.splat(), winston_1.default.format.printf(({ timestamp, message }) => {
        const { userIP, userAgent, country, method, url } = message;
        return `${country || `Anonymous`} (${userIP || `?`}): [${timestamp}] "${method} ${url}" "${userAgent}"`;
    })),
    transports: [
        new winston_1.default.transports.File({ filename: "logs/access.log" }),
    ]
});
const withAccessLogger = (req, res, next) => {
    const { userAgent, cfIpcountry: country, xForwardedFor } = (0, lib_1.headers)(req);
    accessLogger.info({
        userIP: xForwardedFor,
        userAgent,
        country,
        method: req.method,
        url: req.url
    });
    next();
};
exports.withAccessLogger = withAccessLogger;
