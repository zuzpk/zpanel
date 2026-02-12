// // @/lib/app-manager.ts
// import { spawn, execSync } from 'child_process';
// import fs from 'fs/promises';
// import path from 'path';
// import { Logger, execSyncSudo, log, runStreamedCommand, sudoDirExists } from "@/lib";
// import { APP_NAME } from '@/config';
// import { ZuzApp, ZuzAppStatus } from '@/lib/types';
// import cache from '@/cache';
// import { uuid, exists } from '@zuzjs/core';
// import { createSystemUser } from '../user';

// class AppManager {

//     private DATA_DIR = '/zpanel/usr/apps';

//     private validatePath(appDir: string) {
//         const forbiddenPaths = [
//             '/zpanel',
//             '/etc',
//             '/root',
//             `/var`
//         ];

//         // Resolve the absolute path to prevent "../" bypasses
//         const absolutePath = path.resolve(appDir);

//         for (const forbidden of forbiddenPaths) {
//             if (absolutePath === forbidden || absolutePath.startsWith(`${forbidden}/`)) {
//                 throw new Error(`SECURITY ALERT: Attempted to run command on protected directory: ${forbidden}`);
//             }
//         }
//     }

//     public async createApp(conf?: Partial<ZuzApp>): Promise<ZuzApp | null> {
//         try{

//             const appId = uuid(16);
//             const name = conf?.name || `app-${appId}`;
//             const domain = conf?.domain || `${name}.local`;
//             const service = await this.generateServiceName(name);

//             const systemUser = name.trim().replace(/[^a-z0-9-S+]/gi, '_').toLowerCase();
//             const userCreated = createSystemUser(systemUser);

//             const config: ZuzApp = {
//                 id: appId,
//                 name: name.trim(),
//                 service,
//                 pkg: null,
//                 domain: domain.trim(),
//                 description: `ZApp ${name}`,
//                 git: {
//                     url: ``,
//                     isPrivate: false,
//                     branch: ``,
//                     commit: ``
//                 },
//                 nodeVersion: `lts`,
//                 port: 0,
//                 user: userCreated ? systemUser : `root`,
//                 group: userCreated ? systemUser : `root`,
//                 path: `/home`,
//                 status: ZuzAppStatus.Unknown
//             }

//             await this.saveConfig(config);

//             return config
//         }
//         catch(err){
//             log.error(APP_NAME, "Error creating app config:", err);
//             return null
//         }
//     }

    
//     /**
//      * Helper to write the config back to the filesystem
//      */
//     private async saveConfig(config: ZuzApp) {
//         cache.apps.update(config);
//         const filePath = path.join(this.DATA_DIR, `${config.id}.json`);
//         await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf-8');
//     }

//     private logName(config: ZuzApp){ return `${config.name}:${config.id}`; }

//     private runAsUser(user: string, cmd: string){ return `sudo -u ${user} HOME=/home/${user} sh -c "${cmd}"`; }

//     private gitCmd(cmd: string, appDir: string) { 

//         this.validatePath(appDir);

//         return `sudo git -C "${appDir}" ${cmd}`; 
        
//     }

//     /**
//      * Reads all existing VHost JSON files from the data directory
//      */
//     public async listApps(): Promise<ZuzApp[]> {

//         // console.log(`Checking cache for apps:`, cache.apps.getAll())

//         if ( cache.apps.getAll().length > 0 ){
//             return cache.apps.getAll();
//         }

//         try {

//             // console.log(`Reading apps from disk...`)
//             // Ensure directory exists so it doesn't throw ENOENT
//             await fs.mkdir(this.DATA_DIR, { recursive: true });
        
//             const files = await fs.readdir(this.DATA_DIR);
//                 // Filter for .json files and read them in parallel
//             const apps = await Promise.all(
//                 files
//                 .filter((file: string) => file.endsWith('.json'))
//                 .map(async (file: string) => {
//                     try {
//                         const filePath = path.join(this.DATA_DIR, file);
//                         const content = await fs.readFile(filePath, 'utf-8');
//                         return JSON.parse(content) as ZuzApp;
//                     } catch (err) {
//                         log.error(APP_NAME, `Failed to parse config file ${file}:`, err);
//                         return null;
//                     }
//                 })
//             );

//             const _apps = apps.filter((c : any): c is ZuzApp => c !== null);

//             cache.apps.addAll(_apps);

//             return _apps

//         } catch (err) {
//             log.error(APP_NAME, "Error listing VHosts:", err);
//             return [];
//         }
//     }

//     public async updateSettings(conf: ZuzApp) : Promise<ZuzApp> {
//         const fromCache = cache.apps.getById(conf.id!)
//         /* 
//             TODO: if new service name is different than 
//                 - then generate service with that name
//         */
//         const config: ZuzApp = {
//             id: conf.id,
//             name: conf.name.trim(),
//             service: conf.service,
//             pkg: null,
//             domain: conf.domain.trim(),
//             description: conf.description ?? fromCache?.description ?? ``,
//             git: {
//                 ...fromCache?.git,
//                 url: conf.git?.url ?? fromCache?.git?.url ?? ``,
//                 isPrivate: conf.git?.isPrivate ?? fromCache?.git?.isPrivate ?? false,
//             },
//             nodeVersion: `lts`,
//             port: 0,
//             user: conf.user,
//             group: conf.user,
//             path: conf.path,
//             status: fromCache?.status ?? ZuzAppStatus.Unknown
//         }

//         await this.saveConfig(config);

//         return config
//     }

//     private async generateServiceName(appName: string): Promise<string> {
//         const sn = `zapp_${this.appName(appName)}.service`;
//         if ( 
//             await exists(`/etc/systemd/system/${sn}`) ||
//             cache.apps.getAll().find(a => a.service == sn)
//         ){
//             return this.generateServiceName(`${appName}-${Math.floor(Math.random() * 1000)}`);
//         }
//         return sn;
//     }

//     /**
//      * Changes ownership of the app directory to the app's user
//      */
//     private setAppDirectoryPermissions(appPath: string, username: string){
//         // Chown -R makes the user the owner of the folder and all subfolders/files
//         execSyncSudo(`chown -R ${username}:${username} ${appPath}`);
//         // Set permissions so only the owner can read/write/execute
//         execSyncSudo(`chmod -R 750 ${appPath}`);
//     };

//     /**
//      * This updates the config and performs a full rebuild.
//      * Handles first-time setup AND branch updates.
//      */
//     public async deployBranch(config: ZuzApp, branch: string, onData: (chunk: string) => void) {

//         log.info(config.id, `Initializing Deployment`, branch);

//         const serviceName = config.service;
//         const serviceFilePath = `/etc/systemd/system/${serviceName}`;
//         const appName = serviceName.replace(`.service`, ``);
//         const baseDir = config.path.trim().endsWith(`/${config.user}`) 
//             ? config.path 
//             : path.join(config.path, config.user);
//         const appDir = path.join(baseDir, appName);

//         try {
//             // 1. Setup Environment
//             this.broadcast(config.id, "#1 Preparing environment...", onData);
//             createSystemUser(config.user);
//             await fs.mkdir(baseDir, { recursive: true });

//             // 2. Source Update
//             if (!sudoDirExists(appDir)) {
//                 this.broadcast(config.id, `#2 Initial clone of ${branch}...`, onData);
//                 await runStreamedCommand(
//                     config.id,
//                     `sudo git clone -b ${branch} --single-branch ${config.git?.url} "${appDir}"`,
//                     onData
//                 );
//             } else {
//                 this.broadcast(config.id, `#2 Updating to ${branch}...`, onData);
//                 await runStreamedCommand(
//                     config.id,
//                     [
//                         this.gitCmd(`fetch origin`, appDir),
//                         this.gitCmd(`checkout ${branch}`, appDir),
//                         this.gitCmd(`reset --hard origin/${branch}`, appDir),
//                     ].join(' && '),
//                     onData
//                 );
//             }

//             // Fix permissions immediately after git operations so pnpm can work
//             execSyncSudo(`chown -R ${config.user}:${config.user} "${appDir}"`);

//             // Update local config state
//             const latestSha = execSync(this.gitCmd(`rev-parse HEAD`, appDir)).toString().trim();
//             config.git!.branch = branch;
//             config.git!.commit = latestSha;
//             await this.saveConfig(config);

//             // 3. Dependencies & Build
//             // Use --dir or --prefix instead of 'cd'
//             this.broadcast(config.id, "#3 Installing dependencies with pnpm...", onData);
//             await runStreamedCommand(
//                 config.id, 
//                 `sudo pnpm --dir "${appDir}" install`, 
//                 onData);
            
//             this.broadcast(config.id, "#4 Running build script...", onData);
//             await runStreamedCommand(
//                 config.id, 
//                 `sudo pnpm --dir "${appDir}" run build`, 
//                 onData);

//             // 4. Systemd Sync
//             this.broadcast(config.id, "#5 Synchronizing Systemd service...", onData);
//             const serviceContent = this.generateServiceFile(config, appDir);
//             const escapedContent = serviceContent.replace(/'/g, "'\\''");
            
//             // Use a safe heredoc or tee to write the file as root
//             execSyncSudo(`bash -c 'echo "${escapedContent}" > "${serviceFilePath}"'`);
//             execSyncSudo(`systemctl daemon-reload`);

//             // 5. Activation
//             this.broadcast(config.id, `#6 Starting service ${serviceName}...`, onData);
//             execSyncSudo(`systemctl enable ${serviceName}`);
//             execSyncSudo(`systemctl restart ${serviceName}`);

//             this.broadcast(config.id, `✅ Deployment successful! Live on ${branch} (${latestSha.substring(0, 7)})`, onData);

//         } catch (err: any) {
//             this.broadcast(config.id, `❌ Deployment failed: ${err.message}`, onData, "error");
//         }
//     }


//     public async __deployBranch(config: ZuzApp, branch: string, onData: (chunk: string) => void) {

//         log.info(config.id, `Intializing Deployment`, branch)

//         const serviceName = config.service;
//         const serviceFilePath = `/etc/systemd/system/${serviceName}`;
//         const appName = serviceName.replace(`.service`, ``)
//         const baseDir = config.path.trim().endsWith(`/${config.user}`) ?
//             config.path
//             : path.join(config.path, config.user)
//         const appDir = path.join(baseDir, appName)
//         this.broadcast(config.id, `#BaseDir: ${baseDir}`, onData);

//         try {
//             // 1. Initial Setup: Create User & Directory Parent
//             this.broadcast(config.id, "#1 Preparing environment...", onData);
//             createSystemUser(config.user)
//             await fs.mkdir(baseDir, { recursive: true });

//             // 2. Source: Clone (First time) or Fetch/Reset (Updates)
//             if (!sudoDirExists(appDir)) {
//                 this.broadcast(config.id, `#2 Initial clone of ${branch}...`, onData);
//                 await runStreamedCommand(
//                     config.id,
//                     `sudo git clone -b ${branch} --single-branch ${config.git?.url} ${appDir}`,
//                     onData
//                 );
//             } else {
//                 this.broadcast(config.id, `#2 Updating to ${branch}...`, onData);
                

//                 await runStreamedCommand(
//                     config.id,
//                     [
//                         this.gitCmd(`fetch origin`, appDir),
//                         this.gitCmd(`checkout ${branch}`, appDir),
//                         this.gitCmd(`reset --hard origin/${branch}`, appDir),
//                     ].join(' && '),
//                     onData
//                 );
//             }

//             // Update local config state
//             const latestSha = execSync([
//                 this.gitCmd(`rev-parse HEAD`, appDir)
//             ].join(` && `)).toString().trim();
//             config.git!.branch = branch;
//             config.git!.commit = latestSha;
//             await this.saveConfig(config);

//             // 3. Dependencies & Build
//             this.broadcast(config.id, "#3 Installing dependencies with pnpm...", onData);
//             await runStreamedCommand(
//                 config.id, 
//                 `sudo cd ${appDir} && sudo pnpm install`, 
//                 onData);
            
//             this.broadcast(config.id, "#4 Running build script...", onData);
//             await runStreamedCommand(
//                 config.id, 
//                 `sudo cd ${appDir} && sudo pnpm build`, 
//                 onData);

//             // 4. Systemd Service (Always re-generate to ensure environment variables/paths are fresh)
//             this.broadcast(config.id, "#5 Synchronizing Systemd service...", onData);
//             const serviceContent = this.generateServiceFile(config, appDir);
//             const escapedContent = serviceContent.replace(/'/g, "'\\''");
//             execSyncSudo(`bash -c 'echo "${escapedContent}" > "${serviceFilePath}"'`);
//             execSyncSudo(`systemctl daemon-reload`);

//             // 5. Activation
//             this.broadcast(config.id, `#6 Starting service ${serviceName}...`, onData);
//             execSyncSudo(`systemctl enable ${serviceName}`);
//             execSyncSudo(`systemctl restart ${serviceName}`);

//             this.broadcast(config.id, `✅ Deployment successful! Live on ${branch} (${latestSha.substring(0, 7)})`, onData);

//         } catch (err: any) {
//             this.broadcast(config.id, `❌ Deployment failed: ${err.message}`, onData, "error");
//             // throw err;
//         }
//     }

//     public async _deployBranch(config: ZuzApp, branch: string, onData: (chunk: string) => void) {
//         try {
//             // 1. Update the local config state
//             config.git!.branch = branch;
//             await this.saveConfig(config);
//             cache.apps.update(config);

//             this.broadcast(config.id, `🚀 Starting deployment for branch: ${branch}`, onData);

//             const appDir = path.join(config.path, config.name);

//             // 2. Fetch the specific branch and reset to origin/branch
//             // Use 'reset --hard' to ensure local changes don't block the update
//             await runStreamedCommand(
//                 config.id,
//                 [
//                     `cd ${appDir}`,
//                     `sudo -u ${config.user}`,
//                     `git fetch origin`,
//                     `sudo -u ${config.user} git checkout ${branch}`,
//                     `sudo -u ${config.user} git reset --hard origin/${branch}`,
//                 ].join(' && '),
//                 onData
//             );

//             // 3. Get the latest SHA to store in our records
//             const latestSha = execSync(`cd ${appDir} && git rev-parse HEAD`).toString().trim();
//             config.git!.commit = latestSha;
//             await this.saveConfig(config);

//             // 4. Standard Build Flow
//             await runStreamedCommand(config.id, `cd ${appDir} && sudo -u ${config.user} pnpm install`, onData);
//             await runStreamedCommand(config.id, `cd ${appDir} && sudo -u ${config.user} pnpm run build --if-present`, onData);

//             // 5. Restart the service to apply changes
//             const serviceName = config.service;
//             this.broadcast(config.id, `🔄 Restarting service: ${serviceName}`, onData);
//             execSyncSudo(`systemctl restart ${serviceName}`);

//             this.broadcast(config.id, `✅ Branch ${branch} (${latestSha.substring(0, 7)}) is now live!`, onData);

//         } catch (err: any) {
//             this.broadcast(config.id, `❌ Deployment failed: ${err.message}`, onData, "error");
//         }
//     }

//     /**
//      * Main deployment flow
//      */
//     public async deployApp(config: ZuzApp, onData: (chunk: string) => void) {
        
//         const appDir = path.join(config.path, config.name);
//         const serviceName = `zapp_${this.appName(config.name)}.service`
//         const serviceFilePath = `/etc/systemd/system/${serviceName}`;

//         const runStep = async (stepName: string, command: string) => {
//             this.broadcast(config.id, `Step: ${stepName}`, onData);
//             await runStreamedCommand(config.id, command, onData);
//         };

//         try {
//             // 1. Prep
//             this.broadcast(config.id, "Step 1: Creating system user...", onData);
//             execSync(`sudo useradd -m -s /bin/bash ${config.user} || true`);

//             // 2. Source
//             if (!(await this.exists(appDir))) {
//                 await runStep("Cloning", `sudo -u ${config.user} git clone ${config.git?.url} ${appDir}`);
//             } else {
//                 await runStep("Pulling", `cd ${appDir} && sudo -u ${config.user} git pull`);
//             }

//             // 3. Dependencies & Build
//             await runStep("Install", `cd ${appDir} && sudo -u ${config.user} npm install`);
//             await runStep("Build", `cd ${appDir} && sudo -u ${config.user} npm run build --if-present`);

//             // 4. Service Configuration
//             this.broadcast(config.id, "Step 5: Configuring Systemd...", onData);
//             const serviceContent = this.generateServiceFile(config, appDir);
//             const escapedContent = serviceContent.replace(/'/g, "'\\''");
//             execSyncSudo(`bash -c 'echo "${escapedContent}" > "${serviceFilePath}"'`);
//             execSyncSudo(`chmod 644 "${serviceFilePath}"`);
//             execSyncSudo(`chown root:root "${serviceFilePath}"`);
            
            
//             // 5. Activation
//             try {

//                 execSyncSudo('systemctl daemon-reload');
                
//                 await new Promise(resolve => setTimeout(resolve, 500));
                
//                 execSyncSudo(`systemctl enable ${serviceName}`);
//                 execSyncSudo(`systemctl start ${serviceName}`);

//                 this.broadcast(config.id, "🚀 Deployment Complete!", onData, "info");

//             } catch (err: any) {
//                 this.broadcast(config.id, `❌ Deployment Failed: ${err.message}`, onData, "error");
//                 throw err;
//             }


//         } catch (err: any) {
//             this.broadcast(config.id, `❌ Deployment Failed: ${err.message}`, onData, "error");
//             throw err;
//         }
//     }


//     private async createSafetySnapshot(appId: string, appDir: string, onData: (d: string) => void): Promise<string> {
//         const timestamp = Math.floor(Date.now() / 1000);
//         const branchName = `snapshot/${timestamp}`;
        
//         // 1. Logic to create the new snapshot
//         const snapshotCommands = [
//             `git -C "${appDir}" add -A`,
//             // We use || true so it doesn't crash if there are no changes to commit
//             `git -C "${appDir}" commit -m "Auto-snapshot" --no-verify || true`,
//             `git -C "${appDir}" branch "${branchName}"`,
//             `git -C "${appDir}" reset --soft HEAD~1 || true`
//         ];

//         // 2. Logic to delete snapshots older than 30 days (2592000 seconds)
//         // We parse the timestamp from the branch name to decide what to delete
//         const thirtyDaysAgo = timestamp - 2592000;
//         const cleanupCommand = `git -C "${appDir}" branch --list 'snapshot/*' | awk '{print $1}' | while read b; do 
//             ts=$(echo $b | cut -d'/' -f2); 
//             if [ "$ts" -lt "${thirtyDaysAgo}" ]; then 
//                 git -C "${appDir}" branch -D "$b"; 
//             fi; 
//         done`;

//         try {
//             this.broadcast(appId, `📸 Creating safety snapshot ${branchName}...`, onData);
            
//             // Execute Snapshot
//             execSyncSudo(snapshotCommands.join(' && '));
            
//             // Execute Cleanup (we don't 'await' or fail the deploy if cleanup fails)
//             try {
//                 execSyncSudo(cleanupCommand);
//             } catch (cleanupErr) {
//                 console.error("Snapshot cleanup failed, skipping...", cleanupErr);
//             }

//             return branchName;
//         } catch (e) {
//             console.error("Snapshot failed", e);
//             return "";
//         }
//     }
    

//     public broadcast(appId: string, msg: string, onData: (d: string) => void, level = "info") {
//         const formatted = `\r\n\x1b[36m[ZPanel]\x1b[0m ${msg}\r\n`;
//         onData(formatted);
//         log[level]?.(appId, msg);
//     }

//     private async exists(p: string) { return fs.access(p).then(() => true).catch(() => false); }
  
//     private appName(n: string){ return n.trim().replace(/[^a-z0-9-]/gi, '-').toLowerCase(); }

//     private generateServiceFile(config: ZuzApp, appDir: string) {

//         const { 
//             id, 
//             name, 
//             description, 
//             user, 
//             group, 
//             path,
//             nodeVersion,
//             port

//         } = config
//         const realAppPath = path

//         const serviceContent = [
//             `[Unit]`,
//             `Description=ZPanelApp:${this.appName(name)}${description ? ' - ' + description : ''}`,
//             `After=network.target`,
//             ``,
//             `[Service]`,
//             `Type=simple`,
//             `NotifyAccess=main`,
//             `ExecStart=/usr/bin/pnpm start`,
//             `User=${user || `root`}`,
//             `Group=${group || user || `root`}`,
//             `WorkingDirectory=${realAppPath}`,
//             `Restart=always`,
//             `Environment=PORT=${port ?? `3000`}`,
//             `Environment=NODE_ENV=production`,
//             ``,
//             `[Install]`,
//             `WantedBy=multi-user.target`.trim()
//         ].join(`\n`)

//         return serviceContent.trim()
    
//     }

//     // Add this to your AppManager class
//     public async switchVersion(config: ZuzApp, ref: string, onData: (chunk: string) => void) {
//         const appDir = path.join(config.path, config.name);
        
//         try {
//             this.broadcast(config.id, `🔄 Switching to version: ${ref.substring(0, 7)}`, onData);

//             // 1. Fetch and Checkout
//             await runStreamedCommand(
//                 config.id, 
//                 `cd ${appDir} && sudo -u ${config.user} git fetch && sudo -u ${config.user} git checkout ${ref}`, 
//                 onData
//             );

//             // 2. Re-install & Re-build (Dependencies might differ between versions)
//             await runStreamedCommand(config.id, `cd ${appDir} && sudo -u ${config.user} npm install`, onData);
//             await runStreamedCommand(config.id, `cd ${appDir} && sudo -u ${config.user} npm run build --if-present`, onData);

//             // 3. Restart Service
//             const serviceName = `zapp_${this.appName(config.name)}.service`;
//             execSyncSudo(`systemctl restart ${serviceName}`);
            
//             this.broadcast(config.id, "✅ Version switch successful!", onData);
//         } catch (err: any) {
//             this.broadcast(config.id, `❌ Switch failed: ${err.message}`, onData, "error");
//         }
//     }

//     public async refreshStatus(config: ZuzApp): Promise<ZuzAppStatus> {
//         try {
//             // Check if systemd service is active
//             const result = execSyncSudo(`systemctl is-active ${config.service} || true`).toString().trim();
            
//             let status = ZuzAppStatus.Stopped;
//             if (result === 'active') status = ZuzAppStatus.Running;
//             if (result === 'failed') status = ZuzAppStatus.Failed;

//             if (config.status !== status) {
//                 config.status = status;
//                 await this.saveConfig(config);
//             }
//             return status;
//         } catch {
//             return ZuzAppStatus.Unknown;
//         }
//     }

//     /**
//      * Completely removes an app from the system.
//      */
//     public async deleteApp(config: ZuzApp) {
//         const appDir = path.join(config.path, config.name);
//         const serviceName = config.service;

//         try {
//             // 1. Stop and Disable Service
//             log.info(this.logName(config), `Stopping service ${serviceName}...`);
//             execSyncSudo(`systemctl stop ${serviceName} || true`);
//             execSyncSudo(`systemctl disable ${serviceName} || true`);
            
//             // 2. Remove Systemd Service File
//             execSyncSudo(`rm -f /etc/systemd/system/${serviceName}`);
//             execSyncSudo(`systemctl daemon-reload`);

//             // 3. Remove App Directory
//             log.info(this.logName(config), `Removing directory ${appDir}...`);
//             execSyncSudo(`rm -rf ${appDir}`);

//             // 4. Remove Linux User (Optional - keep if you want to reuse)
//             // -r removes the home directory as well
//             if (config.user !== 'root') {
//                 log.info(this.logName(config), `Removing system user ${config.user}...`);
//                 execSyncSudo(`userdel -r ${config.user} || true`);
//             }

//             // 5. Remove JSON config & Cache
//             const filePath = path.join(this.DATA_DIR, `${config.id}.json`);
//             await fs.unlink(filePath);
//             cache.apps.remove(config.id);

//             return { success: true };
//         } catch (err: any) {
//             log.error(this.logName(config), `Delete failed: ${err.message}`);
//             throw err;
//         }
//     }

// }

// export default new AppManager();