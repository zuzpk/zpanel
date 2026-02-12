import { Logger } from '@/lib';
import { ChildProcess, exec, spawn } from 'child_process';
import chokidar, { FSWatcher } from 'chokidar';
import fs from 'fs';
import path from 'path';
import net from "net";

class ProcessManager {

    private appName: string;
    private script: string;
    private pidFile: string;
    private process: ChildProcess | null = null;
    private watcher: FSWatcher | null = null;
    private restartTimeout: NodeJS.Timeout | null = null;
    private isDevMode: boolean;
    private isRestarting = false;

    constructor(appName: string, script: string, isDevMode: boolean) {
        this.appName = appName;
        this.script = script;
        this.pidFile = path.join(__dirname, `..`, `${appName}.pid`);
        this.isDevMode = isDevMode;
    }

    public startApp() {
        this.startProcess();
        if (this.isDevMode) {
          this.watchFiles();
        }
    }

    private pingSystemd(state = 'READY=1') {
      const socketPath = process.env.NOTIFY_SOCKET;

      if (!socketPath) return;

      // systemd abstract sockets start with @, Node needs to replace it with \0
      const normalizedPath = socketPath.startsWith('@') 
        ? '\0' + socketPath.substring(1) 
        : socketPath;

      const client = net.createConnection(normalizedPath, () => {
        client.write(state + '\n');
        client.end();
      });

      client.on('error', (err) => {
        // We ignore ENOENT because it means the socket isn't there (not running in systemd)
        if ((err as any).code !== 'ENOENT') {
          console.error('Failed to notify systemd:', err.message);
        }
      });
    }
    
    private startProcess() {

        // 1. Safety Check: Verify file exists before spawning
        if (!fs.existsSync(this.script)) {
            Logger.error(`Cannot start ${this.appName}: ${this.script} not found. Waiting for build...`);
            this.debounceRestart(); // Try again in a second
            return;
        }

        Logger.error(`Starting ${this.appName}...`);

        this.process = spawn('node', [this.script], {
          stdio: ['inherit', 'inherit', 'pipe'],
          env: { ...process.env, NODE_ENV: this.isDevMode ? 'development' : 'production' },
          detached: false
        });

        // Capture the actual error message
        let lastError = '';
        this.process.stderr?.on('data', (data) => {
            const msg = data.toString();
            lastError += msg;
            process.stderr.write(data); // Still print it to console
        });
    
        // Save the PID to a file
        if (this.process && this.process.pid) {
            console.log(`Started ${this.appName} with PID ${this.process.pid}`);
            this.pingSystemd(`READY=1\nSTATUS=Managing ${this.appName} (PID: ${this.process.pid})`);
            fs.writeFileSync(this.pidFile, this.process.pid.toString());
        }
        
        this.process.on('exit', (code, signal) => {

          const wasRestarting = this.isRestarting;
          this.isRestarting = false;
          this.process = null;

          if (wasRestarting) {
              Logger.error(`${this.appName} stopped for restart. Spawning new process...`);
              // 200ms delay is usually plenty for the OS to free up the port
              setTimeout(() => this.startApp(), 1000);
              return;
          }
          
          if (code !== 0 || signal) {
            const reason = signal ? `killed by signal ${signal}` : `exit code ${code}`;
            Logger.error(`${this.appName} crashed. Reason: ${reason}`);
            if (lastError) {
                Logger.error(`Last error seen: ${lastError.split('\n').pop()}`); 
            }
            this.debounceRestart();
          } else {
            Logger.error(`${this.appName} exited gracefully.`);
          }
        });
        // this.process.on('exit', (code) => {
        //   if (code !== 0) {
        //     Logger.error(`${this.appName} crashed with exit code ${code}. Restarting...`);
        //     this.debounceRestart();
        //   } else {
        //     Logger.error(`${this.appName} exited gracefully.`);
        //   }
        // });
    
        this.process.on('error', (err) => {
          Logger.error(`Failed to start ${this.appName}:`, err);
        });
    }
    
    public stopApp() {
        if (this.process) {
          Logger.error(`Stopping ${this.appName}...`);
          this.process.kill();
          this.process = null;
          fs.unlinkSync(this.pidFile);
        }
        this.stopWatchingFiles();
    }
    
    public restartApp(isDevMode: boolean) {
        this.isDevMode = isDevMode;
      if (this.process) {
        this.isRestarting = true;
          try {
          Logger.error(`Restarting: Killing existing process PID ${this.process.pid}`);
          // SIGKILL is more forceful for dev mode to ensure the port is freed
          this.process.kill('SIGKILL'); 
          } catch (err) {
          Logger.error(`Failed to kill process:`, err);
          // If kill failed, we reset the flag and try to start anyway
          this.isRestarting = false;
          this.startApp();
        }
      } else {
        this.startApp();
    }
    }
    
    private watchFiles() {
        if (this.watcher) {
          Logger.error(`Already watching files, Killing watcher...`)
          this.stopWatchingFiles()
          // return; // Already watching files
        }
    
        this.watcher = chokidar.watch(path.dirname(this.script), {
          ignored: [
            /node_modules/,
            this.pidFile,
          ],
          persistent: true,
          ignoreInitial: true,
          awaitWriteFinish: {
            stabilityThreshold: 1000, // Wait 500ms for build to stop "flickering"
            pollInterval: 500
          },
        });
    
        this.watcher.on('change', (filePath) => {
          Logger.error(`File changed: ${filePath}. Restarting ${this.appName}...`);
          this.debounceRestart();
        });
    
        this.watcher.on('error', (error) => {
          Logger.error(`Watcher error: ${error}`);
        });
    }
    
    private stopWatchingFiles() {
        if (this.watcher) {
          this.watcher.close();
          this.watcher = null;
        }
    }
    
    private debounceRestart() {
        if (this.restartTimeout) {
          clearTimeout(this.restartTimeout);
        }
        this.restartTimeout = setTimeout(() => {
          this.restartApp(this.isDevMode);
        }, 2000); // Adjust the delay as needed
    }

}

export default ProcessManager;