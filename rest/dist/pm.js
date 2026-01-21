"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("./lib");
const child_process_1 = require("child_process");
const chokidar_1 = __importDefault(require("chokidar"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const net_1 = __importDefault(require("net"));
class ProcessManager {
    appName;
    script;
    pidFile;
    process = null;
    watcher = null;
    restartTimeout = null;
    isDevMode;
    constructor(appName, script, isDevMode) {
        this.appName = appName;
        this.script = script;
        this.pidFile = path_1.default.join(__dirname, `..`, `${appName}.pid`);
        this.isDevMode = isDevMode;
    }
    startApp() {
        this.startProcess();
        if (this.isDevMode) {
            this.watchFiles();
        }
    }
    pingSystemd(state = 'READY=1') {
        const socketPath = process.env.NOTIFY_SOCKET;
        if (!socketPath)
            return;
        const normalizedPath = socketPath.startsWith('@')
            ? '\0' + socketPath.substring(1)
            : socketPath;
        const client = net_1.default.createConnection(normalizedPath, () => {
            client.write(state + '\n');
            client.end();
        });
        client.on('error', (err) => {
            if (err.code !== 'ENOENT') {
                console.error('Failed to notify systemd:', err.message);
            }
        });
    }
    startProcess() {
        lib_1.Logger.error(`Starting ${this.appName}...`);
        this.process = (0, child_process_1.spawn)('node', [this.script], {
            stdio: ['inherit', 'inherit', 'pipe'],
            env: { ...process.env, NODE_ENV: this.isDevMode ? 'development' : 'production' },
        });
        let lastError = '';
        this.process.stderr?.on('data', (data) => {
            const msg = data.toString();
            lastError += msg;
            process.stderr.write(data);
        });
        if (this.process && this.process.pid) {
            console.log(`Started ${this.appName} with PID ${this.process.pid}`);
            this.pingSystemd(`READY=1\nSTATUS=Managing ${this.appName} (PID: ${this.process.pid})`);
            fs_1.default.writeFileSync(this.pidFile, this.process.pid.toString());
        }
        this.process.on('exit', (code, signal) => {
            if (code !== 0 || signal) {
                const reason = signal ? `killed by signal ${signal}` : `exit code ${code}`;
                lib_1.Logger.error(`${this.appName} crashed. Reason: ${reason}`);
                if (lastError) {
                    lib_1.Logger.error(`Last error seen: ${lastError.split('\n').pop()}`);
                }
                this.debounceRestart();
            }
            else {
                lib_1.Logger.error(`${this.appName} exited gracefully.`);
            }
        });
        this.process.on('error', (err) => {
            lib_1.Logger.error(`Failed to start ${this.appName}:`, err);
        });
    }
    stopApp() {
        if (this.process) {
            lib_1.Logger.error(`Stopping ${this.appName}...`);
            this.process.kill();
            this.process = null;
            fs_1.default.unlinkSync(this.pidFile);
        }
        this.stopWatchingFiles();
    }
    restartApp(isDevMode) {
        this.isDevMode = isDevMode;
        if (fs_1.default.existsSync(this.pidFile)) {
            const pid = parseInt(fs_1.default.readFileSync(this.pidFile, 'utf-8'), 10);
            try {
                process.kill(pid);
                lib_1.Logger.error(`Killed existing process with PID ${pid}`);
            }
            catch (err) {
                lib_1.Logger.error(`Failed to kill process with PID ${pid}:`, err);
            }
            fs_1.default.unlinkSync(this.pidFile);
        }
        this.startApp();
    }
    watchFiles() {
        if (this.watcher) {
            return;
        }
        this.watcher = chokidar_1.default.watch(path_1.default.dirname(this.script), {
            ignored: /node_modules/,
            persistent: true,
        });
        this.watcher.on('change', (filePath) => {
            lib_1.Logger.error(`File changed: ${filePath}. Restarting ${this.appName}...`);
            this.debounceRestart();
        });
        this.watcher.on('error', (error) => {
            lib_1.Logger.error(`Watcher error: ${error}`);
        });
    }
    stopWatchingFiles() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
    }
    debounceRestart() {
        if (this.restartTimeout) {
            clearTimeout(this.restartTimeout);
        }
        this.restartTimeout = setTimeout(() => {
            this.restartApp(this.isDevMode);
        }, 1000);
    }
}
exports.default = ProcessManager;
