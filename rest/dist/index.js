"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pm_1 = __importDefault(require("./pm"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
require("reflect-metadata");
const appName = 'zpanel';
const script = path_1.default.join(__dirname, '../dist/zapp.js');
const isDevMode = process.env.NODE_ENV !== 'production';
(0, child_process_1.exec)(`sudo fuser -k -9 ${process.env.APP_PORT}/tcp`, (err, stdout, stderr) => {
    console.log(err, stdout, stderr);
});
const processManager = new pm_1.default(appName, script, isDevMode);
processManager.startApp();
