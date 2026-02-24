import { spawn } from "node:child_process";
import { execSyncSudo } from "./core";
import { log } from "./logger";

export * from "./core";
export { echo, log, Logger, logHistory, withAccessLogger, type LogEntry } from "./logger";
export { handleSocketMessage } from "./socket";
export { withZuzAuth } from "./zauth";
export { withZuzRequest } from "./zrequest";

/**
 * Checks if a directory exists using sudo
 * @param dirPath Absolute path to the directory
 * @returns boolean
 */
export const sudoDirExists = (dirPath: string): boolean => {
    try {
        // -d checks if path exists AND is a directory
        execSyncSudo(`test -d "${dirPath}"`);
        return true;
    } catch (error) {
        // If test -d fails, it throws an error (exit code 1)
        return false;
    }
};

/**
 * Checks if a directory is empty using sudo
 * @param dirPath Absolute path to the directory
 * @returns boolean
 */
export const sudoDirIsEmpty = (dirPath: string): boolean => {
    try {
        // ls -A lists all files except . and ..
        // wc -l counts the number of lines
        const output = execSyncSudo(`ls -A "${dirPath}" | wc -l`);
        
        // If the result is "0", the directory is empty
        return parseInt(output.toString().trim(), 10) === 0;
    } catch (error) {
        // If the directory doesn't exist or isn't accessible, we treat it as not empty/error
        return false; 
    }
};

export const runStreamedCommand = (appId: string, command: string, onData: (data: string) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
        const process = spawn('sh', ['-c', command]);

        process.stdout.on('data', (data: any) => {
            const chunk = data.toString();
            onData(chunk); // To Terminal
        });

        process.stderr.on('data', (data: any) => {
            const chunk = data.toString();
            onData(chunk); // To Terminal
            log.warn(appId, 'warn', chunk); // To Central Registry
        });

        process.on('close', (code: any) => {
            if (code === 0) resolve();
            else reject(new Error(`Command failed with code ${code}`));
        });
    });
}