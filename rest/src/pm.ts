import chokidar, { FSWatcher } from 'chokidar';
import { ChildProcess, exec, spawn } from "node:child_process";
import fs from "node:fs";
import net from 'node:net';
import path, { basename } from "node:path";

interface ProcessManagerConf {
    /** Tag | App Name */
    scriptPath: string;
    tag?: string;
    args?: string[];
    devMode?: boolean;
    port?: number | string
}

class ProcessManager {

    private appName: string;
    private script: string;
    private args : string[];
    private process: ChildProcess | null = null;
    private restartCount = 0;
    private isDevMode: boolean;
    private watcher: FSWatcher | null = null;
    private pidFile: string;
    private restartTimer: NodeJS.Timeout | null = null;
    private successTimer: NodeJS.Timeout | null = null;
    private isRestarting = false;
    private backoffTime = 1 * 1000; 
    private readonly MAX_BACKOFF = 16 * 1000;
    private port: number | string;

    constructor({
        tag,
        scriptPath,
        args = [],
        devMode = false,
        port
    } : ProcessManagerConf) {
        this.script = scriptPath
        this.appName = tag ?? basename(this.script)
        this.args = args
        this.isDevMode = devMode;
        this.pidFile = path.join(__dirname, `..`, `${this.appName}.pid`);
        this.port = Number(port) || 3000
    }

    public start() {
        this.startProcess()
        if (this.isDevMode) {
          this.watchFiles();
        }
    }

    public stop() {
        if (this.process){
            console.log('[ZPM] Stopping process...');
            this.process.kill('SIGINT');
        }
    }

    public restart() {
        if (this.process) {
            this.isRestarting = true;
            try {
                console.log(`Restarting: Killing existing process PID ${this.process.pid}`);
                this.process.kill('SIGINT');
            } catch (err) {
                console.log(`Failed to kill process:`, err);
                this.isRestarting = false;
                this.start();
            }

        } else {
            this.start();
        }
    }

    private async isPortFree(port: number): Promise<boolean> {
        return new Promise((resolve) => {
            const server = net.createServer()
                .once('error', () => resolve(false))
                .once('listening', () => {
                    server.close();
                    resolve(true);
                })
                .listen(port);
        });
    }

    private async tryPortFree(port: number | string){
        if ( !( await this.isPortFree(Number(port)) ) ){
            console.warn(`[ZPM] Port ${port} is busy. Trying to clear it...`);
            exec(`sudo fuser -k -9 ${port}/tcp`, (err, stdout, stderr) => {
                console.log(`--port`, err, stdout, stderr)
            })  
        }
    }

    private stopWatchingFiles() {
        if (this.watcher) {
            console.error(`Already watching files, Killing watcher...`)
            this.watcher.close();
            this.watcher = null;
        }
    }

    

    private debounceRestart() {
        
        if (this.restartTimer) clearTimeout(this.restartTimer);
        console.log(`[ZPM] Restarting... (Attempt #${this.restartCount})`);
        console.log(`[ZPM] Restarting in ${this.backoffTime}s... (Attempt #${this.restartCount + 1})`);

        this.restartTimer = setTimeout(() => {
            this.restartCount++
            this.backoffTime = Math.min(this.backoffTime * 2, this.MAX_BACKOFF);
            this.restart();
        }, this.backoffTime);
    }

    private watchFiles() {

        this.stopWatchingFiles()
        const distDir = path.dirname(this.script)
        this.watcher = chokidar.watch(distDir, {
          ignored: [
            /node_modules/,
            this.pidFile,
          ],
          persistent: true,
          ignoreInitial: true,
          awaitWriteFinish: {
            stabilityThreshold: 2000, // Wait 500ms for build to stop "flickering"
            pollInterval: 1000
          },
        });

        this.watcher.on('all', (event, filePath) => {
            if (event === 'change' || event === 'add') {
                console.log(`File ${event}: ${basename(filePath)}. Building stability...`);
                this.restart(); 
            }
            else{
                console.log(`--chokidar`, event, filePath)
            }
        });

        // this.watcher.on('change', (filePath) => {
        //     console.log(`File changed: ${filePath}. Restarting ${this.appName}...`);
        //     this.debounceRestart();
        // });
        
        this.watcher.on('error', (error) => {
            console.log(`Watcher error: ${error}`);
        });

        this.watcher.on('ready', () => {
            console.log(`Watching ${distDir}`);
        })
    }
    
    private async startProcess() {

        // 1. Safety Check: Verify file exists before spawning
        if (!fs.existsSync(this.script)) {
            console.error(`Cannot start ${this.appName}: ${this.script} not found. Waiting for build...`);
            return;
        }

        await this.tryPortFree(this.port);

        console.log(`[ZPM] Starting: ${this.script}`);

        this.process = spawn('node', [this.script, ...this.args], {
          stdio: 'inherit',
          env: { ...process.env, NODE_ENV: this.isDevMode ? 'development' : 'production' },
          detached: false,
          shell: false
        });

        

        this.successTimer = setTimeout(() => {
            if (this.process) {
                this.backoffTime = 1000;
                this.restartCount = 0;
                console.log(`[ZPM] ${this.appName} is stable.`);
            }
        }, 5000);

        // 2. Monitor Lifecycle
        this.process.on('error', (err) => {
            console.error(`[ZPM] Failed to start`, err);
        });

        const startTime = Date.now();

        this.process.on('exit', (code, signal) => {

            const uptime = Date.now() - startTime;
            this.process = null;
            
            if (this.isRestarting) {
                console.log(`[ZPM] Process exited with code ${code} (Signal: ${signal})`);
                this.isRestarting = false;
                this.startProcess();
                return;
            }

            
            // 3. Simple Restart Logic
            if (code !== 0 && code !== null) {
                console.log(`[ZPM] App Crashed (Code: ${code}, Signal: ${signal})`);
                // 2. Detect "Incomplete Build" crashes
                // If it crashes in less than 1.5 seconds, it's almost certainly a 
                // MODULE_NOT_FOUND or a syntax error from a partial build.
                if (uptime < 1500) {
                    console.log(`App crashed immediately (${uptime}ms). Build likely incomplete or tsc-alias still running.`, 'error');
                    // We DON'T restart immediately. We wait for the next Chokidar event.
                    return; 
                }
                this.debounceRestart()
            }
        });

    }


}

export default ProcessManager   