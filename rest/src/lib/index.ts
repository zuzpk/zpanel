import { spawn } from "node:child_process";
import { execSyncSudo } from "./core";
import { log } from "./logger";

export * from "./core";
export { 
    Logger, echo, log,  withAccessLogger, logHistory,
    type LogEntry, 
} from "./logger";
export { withZuzAuth } from "./zauth";
export { handleSocketMessage } from "./socket";

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