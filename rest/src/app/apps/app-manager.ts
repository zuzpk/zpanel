import path from 'path';
import { Logger, execSyncSudo, log, runStreamedCommand, sudoDirExists } from "@/lib";
import { ZuzApp, ZuzAppStatus } from '@/lib/types';
import cache from '@/cache';
import fs from 'fs/promises';
import { APP_NAME } from '@/config';
import { uuid } from '@zuzjs/core';
import { createSystemUser } from '../user';
import { execSync } from 'child_process';
import pc from "picocolors"
import github from "./github-manager"

class AppManager {

    private DATA_DIR = '/zpanel/usr/apps';
    private PEM_DIR = '/zpanel/usr/keys';

    private async exists(p: string) { return fs.access(p).then(() => true).catch(() => false); }

    private validatePath(appDir: string) {
        const forbiddenPaths = [
            '/zpanel',
            '/etc',
            '/root',
            `/var`
        ];

        // Resolve the absolute path to prevent "../" bypasses
        const absolutePath = path.resolve(appDir);

        for (const forbidden of forbiddenPaths) {
            if (absolutePath === forbidden || absolutePath.startsWith(`${forbidden}/`)) {
                throw new Error(`SECURITY ALERT: Attempted to run command on protected directory: ${forbidden}`);
            }
        }
    }

    private async guessAppPort(appId: string, appDir: string): Promise<number> {

        const envPath = path.join(appDir, '.env');
        if ( await this.exists(envPath) ){
            try{
                const envContent = await fs.readFile(envPath, 'utf-8');
                const portMatch = envContent.match(/PORT=(\d+)/);
                if ( portMatch && portMatch[1] ){
                    return +portMatch[1];
                }
            }
            catch(err){
                log.warn(appId, "Failed to parse .env for port detection:", err);
            }
        }

        const pkgJsonPath = path.join(appDir, 'package.json');
        if ( await this.exists(pkgJsonPath) ){
            try{
                const pkgContent = await fs.readFile(pkgJsonPath, 'utf-8');
                const pkg = JSON.parse(pkgContent);
                if ( pkg && pkg.scripts && pkg.scripts.start ){
                    const startScript = pkg.scripts.start as string;
                    const portMatch = startScript.match(/--port\s+(\d+)/) 
                        || startScript.match(/-p\s+(\d+)/)
                        || startScript.match(/PORT=(\d+)/);
                    if ( portMatch && portMatch[1] ){
                        return +portMatch[1];                        
                    }
                }
            }
            catch(err){
                log.warn(appId, "Failed to parse package.json for port detection:", err);
            }
        }

        return 0

    }

    private gitCmd(cmd: string, appDir: string) { 
        this.validatePath(appDir);
        return `sudo git -C "${appDir}" ${cmd}`; 
    }

    private gitBuildPrivateUrl(accessToken: string | null, url: string): string {
        return `https://x-access-token:${accessToken}@${url.replace(/^https?:\/\//, '')}`;
    }


    public broadcast(appId: string, msg: string, onData: (d: string) => void, level = "info") {
        const formatted = `\r\n\x1b[36m[ZPanel]\x1b[0m ${msg}\r\n`;
        onData(formatted);
        log[level]?.(appId, msg);
    }

    /**
     * Reads all existing VHost JSON files from the data directory
     */
    public async listApps(): Promise<ZuzApp[]> {

        // console.log(`Checking cache for apps:`, cache.apps.getAll())

        if ( cache.apps.getAll().length > 0 ){
            return cache.apps.getAll();
        }

        try {

            // console.log(`Reading apps from disk...`)
            // Ensure directory exists so it doesn't throw ENOENT
            await fs.mkdir(this.DATA_DIR, { recursive: true });
        
            const files = await fs.readdir(this.DATA_DIR);
                // Filter for .json files and read them in parallel
            const apps = await Promise.all(
                files
                .filter((file: string) => file.endsWith('.json'))
                .map(async (file: string) => {
                    try {
                        const filePath = path.join(this.DATA_DIR, file);
                        const content = await fs.readFile(filePath, 'utf-8');
                        const zapp = JSON.parse(content) as ZuzApp;

                        const pem = await this.getPemKey(zapp.id);
                        // console.log(`Loaded PEM key for app ${zapp.name} (${zapp.id})`, pem);
                        if (pem) {
                            zapp.git!.pem = pem
                        }

                        return zapp
                    } catch (err) {
                        log.error(APP_NAME, `Failed to parse config file ${file}:`, err);
                        return null;
                    }
                })
            );

            const _apps = apps.filter((c : any): c is ZuzApp => c !== null);

            cache.apps.addAll(_apps);

            return _apps

        } catch (err) {
            log.error(APP_NAME, "Error listing VHosts:", err);
            return [];
        }
    }

    private appName(n: string){ return n.trim().replace(/[^a-z0-9-]/gi, '-').toLowerCase(); }

    private async generateServiceName(appName: string): Promise<string> {
        const sn = `zapp_${this.appName(appName)}.service`;
        if ( 
            await this.exists(`/etc/systemd/system/${sn}`) ||
            cache.apps.getAll().find(a => a.service == sn)
        ){
            return this.generateServiceName(`${appName}-${Math.floor(Math.random() * 1000)}`);
        }
        return sn;
    }

    private generateServiceFile(config: ZuzApp, appDir: string) {

        const { 
            id, 
            name, 
            description, 
            user, 
            group, 
            path,
            nodeVersion,
            port
        } = config
        const realAppPath = path

        const serviceContent = [
            `[Unit]`,
            `Description=ZPanelApp:${this.appName(name)}${description ? ' - ' + description : ''}`,
            `After=network.target`,
            ``,
            `[Service]`,
            `Type=simple`,
            `NotifyAccess=main`,
            `ExecStart=/usr/bin/pnpm start`,
            `User=${user || `root`}`,
            `Group=${group || user || `root`}`,
            `WorkingDirectory=${realAppPath}`,
            `Restart=always`,
            `Environment=PORT=${port ?? `3000`}`,
            `Environment=NODE_ENV=production`,
            ``,
            `[Install]`,
            `WantedBy=multi-user.target`.trim()
        ].join(`\n`)

        return serviceContent.trim()
    
    }

    private async createSafetySnapshot(appId: string, appDir: string, onData: (d: string) => void): Promise<string> {

        this.broadcast(appId, `Creating safety snapshot before deployment...`, onData);

        const timestamp = Math.floor(Date.now() / 1000);
        const branchName = `snapshot/${timestamp}`;
        
        // 1. create the new snapshot
        const snapshotCommands = [
            `git -C "${appDir}" add -A`,
            // We use || true so it doesn't crash if there are no changes to commit
            `git -C "${appDir}" commit -m "Auto-snapshot" --no-verify || true`,
            `git -C "${appDir}" branch "${branchName}"`,
            `git -C "${appDir}" reset --soft HEAD~1 || true`
        ];

        // 2. delete snapshots older than 30 days (2592000 seconds)
        // We parse the timestamp from the branch name to decide what to delete
        const thirtyDaysAgo = timestamp - 2592000;
        const cleanupCommand = `git -C "${appDir}" branch --list 'snapshot/*' | awk '{print $1}' | while read b; do 
            ts=$(echo $b | cut -d'/' -f2); 
            if [ "$ts" -lt "${thirtyDaysAgo}" ]; then 
                git -C "${appDir}" branch -D "$b"; 
            fi; 
        done`;

        try {
            this.broadcast(appId, `Creating safety snapshot ${branchName}...`, onData);
            
            // Execute Snapshot
            execSyncSudo(snapshotCommands.join(' && '));
            
            // Execute Cleanup (we don't 'await' or fail the deploy if cleanup fails)
            try {
                execSyncSudo(cleanupCommand);
            } catch (cleanupErr) {
                log.error(appId, "Snapshot cleanup failed, skipping...", cleanupErr);
            }

            return branchName;
        } catch (e) {
            log.error(appId, "Snapshot failed", e);
            return "";
        }
    }


    public async updateConfig(conf: ZuzApp) : Promise<ZuzApp> {
        const fromCache = cache.apps.getById(conf.id!)
        /* 
            TODO: if new service name is different than 
                - then generate service with that name
        */
        const config: ZuzApp = {
            id: conf.id,
            name: conf.name.trim(),
            service: conf.service,
            pkg: null,
            domain: conf.domain.trim(),
            description: conf.description ?? fromCache?.description ?? ``,
            git: {
                ...fromCache?.git,
                url: conf.git?.url ?? fromCache?.git?.url ?? ``,
                isPrivate: conf.git?.isPrivate ?? fromCache?.git?.isPrivate ?? false,
                installationId: conf.git?.installationId ?? fromCache?.git?.installationId ?? ``,
                appId: conf.git?.appId ?? fromCache?.git?.appId ?? ``
            },
            nodeVersion: `lts`,
            port: 0,
            user: conf.user,
            group: conf.user,
            path: conf.path,
            status: fromCache?.status ?? ZuzAppStatus.Unknown
        }

        await this.saveConfig(config);

        return config
    }

    public async getPemKey(appId: string) : Promise<string | null> {

        try{
            
            const pemPath = path.join(this.PEM_DIR, `.${appId}`);
            if (!await this.exists(pemPath)) return null;

            const pem = await fs.readFile(pemPath, 'utf-8');
            return pem;

        }
        catch(err){
            log.error(APP_NAME, `Error reading PEM key for app ${appId}:`, err);
            return null
        }

    }

    public async savePemKey(appId: string, pem: string) : Promise<boolean> {

        try{
            const config = cache.apps.getById(appId);
            if (!config) return false;

            await fs.mkdir(this.PEM_DIR, { recursive: true });
            const pemPath = path.join(this.PEM_DIR, `.${appId}`);

            await fs.writeFile(pemPath, pem, { encoding: 'utf-8', mode: 0o600 });

            return true;

        }
        catch(err){
            log.error(APP_NAME, `Error saving PEM key for app ${appId}:`, err);
            return false
        }

    }

    /**
     * Helper to write the config back to the filesystem
     */
    private async saveConfig(config: ZuzApp) {
        cache.apps.update(config);
        const filePath = path.join(this.DATA_DIR, `${config.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf-8');
    }

    public async createApp(conf?: Partial<ZuzApp>): Promise<ZuzApp | null> {
        try{

            const appId = uuid(16);
            const name = conf?.name || `app-${appId}`;
            const domain = conf?.domain || `${name}.local`;
            const service = await this.generateServiceName(name);

            const systemUser = name.trim().replace(/[^a-z0-9-S+]/gi, '_').toLowerCase();
            const userCreated = createSystemUser(systemUser);

            const config: ZuzApp = {
                id: appId,
                name: name.trim(),
                service,
                pkg: null,
                domain: domain.trim(),
                description: `ZApp ${name}`,
                git: {
                    url: ``,
                    isPrivate: false,
                    branch: ``,
                    commit: ``
                },
                nodeVersion: `lts`,
                port: 0,
                user: userCreated ? systemUser : `root`,
                group: userCreated ? systemUser : `root`,
                path: `/home`,
                status: ZuzAppStatus.Unknown
            }

            await this.saveConfig(config);

            return config
        }
        catch(err){
            log.error(APP_NAME, "Error creating app config:", err);
            return null
        }
    }

    /**
     * This updates the config and performs a full rebuild.
     * Handles first-time setup AND branch updates.
     */
    public async deployBranch(config: ZuzApp, branch: string, onData: (chunk: string) => void) {

        const serviceName = config.service;
        const serviceFilePath = `/etc/systemd/system/${serviceName}`;
        const appName = serviceName.replace(`.service`, ``);
        const baseDir = config.path == `/home` ? 
            path.join(`/home`, config.user) : path.dirname(config.path);
        const appDir = config.path == `/home` ? 
            path.join(baseDir, appName) : config.path;

        if ( sudoDirExists(appDir) ){
            await this.createSafetySnapshot(config.id, appDir, onData);
        }

        log.info(config.id, `Initializing Deployment`, pc.green(branch));


        const pem = await this.getPemKey(config.id)
        let accessToken : string | null = null;

        if ( config.git?.isPrivate ){
            if ( !pem ){
                return this.broadcast(config.id, `❌ Deployment failed: PEM key required for private repo.`, onData, "error");
            }
            accessToken = await github.getAccessToken(
                config.git.appId!, 
                config.git.installationId!, 
                pem
            )

            if ( !accessToken ){
                return this.broadcast(config.id, `❌ Deployment failed: Could not retrieve access token for GitHub App.`, onData, "error");
            }

        }

        const gitUrl = config.git?.isPrivate ? 
            this.gitBuildPrivateUrl(accessToken, config.git!.url)
            : config.git?.url;

        try {
            // 1. Setup Environment
            this.broadcast(config.id, "#1 Preparing environment...", onData);
            createSystemUser(config.user);
            await fs.mkdir(baseDir, { recursive: true });

            await runStreamedCommand(
                config.id,
                `sudo git config --global --add safe.directory "${appDir}"`,
                onData
            );
        
            // 2. Source Update
            if (!sudoDirExists(appDir)) {
                this.broadcast(config.id, `#2 Initial clone of ${branch}...`, onData);
                await runStreamedCommand(
                    config.id,
                    `sudo git clone -b ${branch} --single-branch ${gitUrl} "${appDir}"`,
                    onData
                );
            } else {
                this.broadcast(config.id, `#2 Updating to ${branch}...`, onData);
                await runStreamedCommand(
                    config.id,
                    [
                        this.gitCmd(`remote set-url origin "${gitUrl}"`, appDir),
                        this.gitCmd(`fetch origin`, appDir),
                        this.gitCmd(`checkout -B ${branch}`, appDir),
                        this.gitCmd(`reset --hard origin/${branch}`, appDir),
                    ].join(' && '),
                    onData
                );
            }

            // Fix permissions immediately after git operations so pnpm can work
            execSyncSudo(`chown -R ${config.user}:${config.user} "${appDir}"`);

            // Try guessing port from package.json (if exists)
            const appPort = await this.guessAppPort(config.id!, appDir)
            this.broadcast(config.id, `⚡ Detected port ${pc.cyan(appPort)}`, onData);

            // Update local config state
            const latestSha = execSync(this.gitCmd(`rev-parse HEAD`, appDir)).toString().trim();
            config.git!.branch = branch;
            config.git!.commit = latestSha;
            config.path = appDir;
            config.port = appPort;
            await this.saveConfig(config);

            // 3. Dependencies & Build
            // Use --dir or --prefix instead of 'cd'
            this.broadcast(config.id, "#3 Installing dependencies with pnpm...", onData);
            await runStreamedCommand(
                config.id, 
                `sudo pnpm --dir "${appDir}" install`, 
                onData);
            
            this.broadcast(config.id, "#4 Running build script...", onData);
            await runStreamedCommand(
                config.id, 
                `sudo pnpm --dir "${appDir}" run build`, 
                onData);

            // 4. Systemd Sync
            this.broadcast(config.id, "#5 Synchronizing Systemd service...", onData);
            const serviceContent = this.generateServiceFile(config, appDir);
            const escapedContent = serviceContent.replace(/'/g, "'\\''");
            
            // Use a safe heredoc or tee to write the file as root
            execSyncSudo(`bash -c 'echo "${escapedContent}" > "${serviceFilePath}"'`);
            execSyncSudo(`systemctl daemon-reload`);

            // 5. Activation
            this.broadcast(config.id, `#6 Starting service ${serviceName}...`, onData);
            execSyncSudo(`systemctl enable ${serviceName}`);
            execSyncSudo(`systemctl restart ${serviceName}`);

            this.broadcast(config.id, `:: Deployment successful! Live on ${branch} (${latestSha.substring(0, 7)})`, onData);

        } catch (err: any) {
            this.broadcast(config.id, `:: Deployment failed: ${err.message}`, onData, "error");
        }
    }

}

export default new AppManager();