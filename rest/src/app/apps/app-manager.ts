import { createSystemUser } from '@/app/user';
import cache from '@/cache';
import { APP_NAME } from '@/config';
import { execSyncSudo, log, runStreamedCommand, sudoDirExists } from '@/lib';
import { LOG_SYMBOLS } from '@/lib/logger';
import { AppSwitchMode, ZuzApp } from '@/lib/types';
import { _, dynamic, uuid } from '@zuzjs/core';
import { WorkerConfig, WorkerMode, WorkerStats, WorkerStatus, zpm } from "@zuzjs/pm";
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import pc from "picocolors";
import git from "./git-manager";

class AppManager {

    private DATA_DIR = '/zpanel/usr/apps';
    private PEM_DIR = '/zpanel/usr/keys';

    private async exists(p: string) { return fs.access(p).then(() => true).catch(() => false); }


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

    private appName(n: string){ return n.trim().replace(/[^a-z0-9-]/gi, '-').toLowerCase(); }

    private gitBuildPrivateUrl(accessToken: string | null, url: string): string {
        return `https://x-access-token:${accessToken}@${url.replace(/^https?:\/\//, '')}`;
    }

    private async getWorkerName(appName: string): Promise<string> {
        log.info(APP_NAME, `Getting worker name...`, appName)
        const sn = `${this.appName(appName)}-worker`;
        if ( 
            (await zpm.getProcessByName(sn) !== undefined) ||
            cache.apps.getAll().find(a => a.worker == sn)
        ){
            log.info(APP_NAME, `Worker "${appName}" Exist...`)
            return this.getWorkerName(`${appName}-${Math.floor(Math.random() * 1000)}`);
        }
        return sn;
    }

    /**
     * Helper to write the config back to the filesystem
     */
    private async saveConfig(config: ZuzApp) {

        log.info(APP_NAME, `Saving Config...`)

        cache.apps.update(config);
        const filePath = path.join(this.DATA_DIR, `${config.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf-8');

        log.info(APP_NAME, `AppConfig Saved...`)

    }
    
    public broadcast(appId: string, msg: string, onData: (d: string) => void, level = "info") {
        const formatted = `\r\n\x1b[36m[ZPanel]\x1b[0m ${msg}\r\n`;
        onData(formatted);
        log[level]?.(appId, msg);
    }

    public async updateConfig(conf: ZuzApp) : Promise<ZuzApp> {

        const fromCache = cache.apps.getById(conf.id!)
        /* 
            If new service name is different than 
            the old service name, then generate service with that name
        */
        const port = await this.guessAppPort(conf.id!, conf.path)

        if ( !fromCache ){
            log.info(APP_NAME, `[UpdateConfig] App not in cache...`);
        }
        else if ( 
            fromCache.worker !== conf.worker &&
            (await zpm.getProcessByName(fromCache.worker))
        ){
            log.info(APP_NAME, `[UpdateConfig] Worker name change for #${conf.id}: ${pc.red(conf.worker)}`);
            const _worker = await zpm.getProcessByName(fromCache.worker)
            log.info(APP_NAME, `[UpdateConfig] Old service file ${pc.red(fromCache.worker)} removed. Creating new...`);
            await zpm.replaceWorker(fromCache.worker, conf.worker, _worker!.status == WorkerStatus.Running)
        }
        
        const config: ZuzApp = {
            id: conf.id,
            name: conf.name.trim(),
            worker: conf.worker,
            pkg: null,
            domain: conf.domain.trim(),
            description: conf.description ?? fromCache?.description ?? ``,
            git: {
                ...fromCache?.git,
                pem: conf.git?.pem ?? fromCache?.git?.pem ?? ``,
                url: conf.git?.url ?? fromCache?.git?.url ?? ``,
                isPrivate: conf.git?.isPrivate ?? fromCache?.git?.isPrivate ?? false,
                installationId: conf.git?.installationId ?? fromCache?.git?.installationId ?? ``,
                appId: conf.git?.appId ?? fromCache?.git?.appId ?? ``
            },
            port,
            path: conf.path,
            status: fromCache?.status ?? WorkerStatus.Stopped
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

    public async getZPMConfig(config: ZuzApp) : Promise<WorkerConfig> {

        const pkgJsonPath = path.join(config.path, `package.json`)
        const pkgJson : dynamic = JSON.parse(await fs.readFile(pkgJsonPath, `utf8`))

        if ( 
            pkgJson.scripts.start.includes(`next`) || 
            pkgJson.dependencies.next
        )
        {
            // NextJS App
            return {
                name: config.worker,
                scriptPath: ``
            }
        }
        else{
            return {
                name: config.worker,
                scriptPath: path.join(config.path, `dist`, `zapp.js`),
                port: config.port,
                instances: 1,
                mode: WorkerMode.Fork,
                user: `zpanel`
                // logs: {
                //     wsUrl: ``,
                //     saveToFile: true
                // }
            }
            // log.info(APP_NAME, startMsg)
        }
    }

    public async createApp(conf?: Partial<ZuzApp>): Promise<ZuzApp | null> {
        try{

            log.info(APP_NAME, `Creating now...`)

            const appId = uuid(16);
            const name = conf?.name || `app-${appId}`;
            const domain = conf?.domain || `${name}.local`;
            const worker = await this.getWorkerName(name);

            createSystemUser(`zpanel`);

            const config: ZuzApp = {
                id: appId,
                name: name.trim(),
                worker,
                pkg: null,
                domain: domain.trim(),
                description: `ZApp ${name}`,
                git: {
                    url: ``,
                    isPrivate: false,
                    branch: ``,
                    commit: ``
                },
                port: 0,
                path: `/home`,
                status: WorkerStatus.Stopped
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
     * Reads all existing VHost JSON files from the data directory
     */
    public async listApps(id = `-`): Promise<ZuzApp[]> {

        
        if ( !id || id == `-` ){
            log.info(APP_NAME, `Fetching all apps...`);
            if ( cache.apps.getAll().length > 0 ){
                return cache.apps.getAll();
            }
        }
        else {
            log.info(id, `Finding App # ${id}...`);
            const ap = cache.apps.getById(id)
            if ( ap ){
                return [ap]
            }
        }
        

        try {

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

            return id == `-` ? _apps : _apps.filter(a => a.id == id);

        } catch (err) {
            log.error(APP_NAME, "Error listing VHosts:", err);
            return [];
        }
    }

    public async appDashboard(id: string) : Promise<WorkerStats | null> {

        log.info(APP_NAME, `[FetchingDashboard] # ${id}`);

        const app = cache.apps.getById(id)
    
        if ( !app ){
            log.info(APP_NAME, `[AppDashboard] App not in cache...`);
            console.log(cache.apps.getAll())
        }


        const stats = await zpm.stats(app?.worker)

        if (stats.length > 0){
            return stats[0]!
        }

        return null

    }


    /**
     * Updates the status of an app.
     * @param appId The ID of the app to update.
     * @param mode The new mode to set for the app.
     * @returns True if the update was successful, false otherwise.
     */
    public async UpdateAppStatus(appId: string, mode: AppSwitchMode) {
        const app = cache.apps.getById(appId);
        if (!app) {
            log.error(APP_NAME, `UpdateAppStatus failed: App with ID ${appId} not found in cache.`);
            return false;
        }
        try {

            await zpm.ensureDaemon()
            
            switch(mode){
                case "start":
                    log.info(APP_NAME, `[Starting]`, await zpm.start(await this.getZPMConfig(app)))
                    break;
                case "stop":
                    log.info(APP_NAME, `[Stoping]`, await zpm.stop(app.worker))
                    break;
                case "restart":
                    log.info(APP_NAME, `[Restarting]`, await zpm.restart(app.worker))
                    break;
            }
            
            app.status = mode === 'start' || mode === `restart` ? WorkerStatus.Running : WorkerStatus.Stopped;
            cache.apps.update(app);

            return true;
        } catch (err) {
            log.error(APP_NAME, `Failed to ${mode} app ${app.name} (${app.worker}) (${app.id}):`, err);
            return false;
        }
    }


    /** Git */
    
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


    /**
     * This updates the config and performs a full rebuild.
     * Handles first-time setup AND branch updates.
     */
    public async pushToBranch(
        config: ZuzApp, 
        branch: string, 
        commitMsg: string,
        force: number,
        onData: (chunk: string) => void
    ) {
        
        const appDir = config.path

        if ( 
            !sudoDirExists(appDir)
        ){
            this.broadcast(config.id, `${config.path} Not Exist.`, onData);
            return;
        }

        const init = git.initGitSafely(config.path)

        if ( init == `new` ){
            execSyncSudo(git.cmd(`branch -M ${branch}`, config.path))
            execSyncSudo(git.cmd(`remote add origin ${config.git?.url}`, config.path))
        }
        else{
            execSyncSudo(git.cmd(`checkout -b ${branch} || true`, config.path)); 
        }
        
        const pem = await this.getPemKey(config.id)
        let accessToken : string | null = null;

        if ( config.git?.isPrivate ){
            if ( !pem ){
                return this.broadcast(config.id, `❌ Deployment failed: PEM key required for private repo.`, onData, "error");
            }
            accessToken = await git.getAccessToken(
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
        
        await runStreamedCommand(
            config.id,
            [
                `sudo git config --global --add safe.directory "${appDir}"`,
                git.cmd(`remote set-url origin "${gitUrl}"`, appDir),
            ].join(` && `),
            onData
        );

        const gitignorePath = path.join(config.path, '.gitignore');
        if (!this.exists(gitignorePath)) {
            execSyncSudo(`echo "node_modules/\ndist/\n.env\n*.tsbuildinfo" > ${gitignorePath}`);
        }

        const commit = await git.safeCommit(config.path, _(commitMsg).isEmpty() ? undefined : commitMsg, true)

        if ( commit.status === false ){
            this.broadcast(config.id, commit.message, onData);
            return;
        }

        this.broadcast(config.id, `Resetting HEAD (SOFT)`, onData);
        execSyncSudo(git.cmd(`reset --soft HEAD`, appDir));

        await runStreamedCommand(
            config.id,
            git.cmd(`push -u origin ${branch}${force == 1 ? ` --force` : ``}`, appDir),
            onData
        );

        this.broadcast(config.id, `${LOG_SYMBOLS.success} Pushed successfully to ${branch}`, onData);

    }


    /**
     * This updates the config and performs a full rebuild.
     * Handles first-time setup AND branch updates.
     */
    public async deployBranch(
        config: ZuzApp, 
        branch: string, 
        autoStart: number,
        onData: (chunk: string) => void
    ) {

        const appDir = config.path;

        const pkgJsonExists = await this.exists(path.join(appDir, `package.json`))

        if ( 
            sudoDirExists(appDir) &&
            pkgJsonExists
        ){
            await this.createSafetySnapshot(config.id, appDir, onData);
        }

        log.info(config.id, `Initializing Deployment`, pc.green(branch));

        const pem = await this.getPemKey(config.id)
        let accessToken : string | null = null;

        if ( config.git?.isPrivate ){
            if ( !pem ){
                return this.broadcast(config.id, `❌ Deployment failed: PEM key required for private repo.`, onData, "error");
            }
            accessToken = await git.getAccessToken(
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
            
            // Setup Environment
            this.broadcast(config.id, "#1 Preparing environment...", onData);

            await runStreamedCommand(
                config.id,
                `sudo git config --global --add safe.directory "${appDir}"`,
                onData
            );

             // Source Update
            if (
                !sudoDirExists(appDir) || !pkgJsonExists
            ) {
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
                        git.cmd(`remote set-url origin "${gitUrl}"`, appDir),
                        git.cmd(`fetch origin`, appDir),
                        git.cmd(`checkout -B ${branch}`, appDir),
                        git.cmd(`reset --hard origin/${branch}`, appDir),
                    ].join(' && '),
                    onData
                );
            }

            const appPort = await this.guessAppPort(config.id!, appDir)
            this.broadcast(config.id, `⚡ Detected port ${pc.cyan(appPort)}`, onData);

            // Update local config state
            const latestSha = execSync(git.cmd(`rev-parse HEAD`, appDir)).toString().trim();
            config.git!.branch = branch;
            config.git!.commit = latestSha;
            config.path = appDir;
            config.port = appPort;
            await this.saveConfig(config);

            // Dependencies & Build
            // Use --dir or --prefix instead of 'cd'
            this.broadcast(config.id, "#3 Installing dependencies with pnpm...", onData);
            await runStreamedCommand(
                config.id, 
                `sudo pnpm --dir "${appDir}" install --force`, 
                onData);
            
            this.broadcast(config.id, "#4 Running build script...", onData);
            await runStreamedCommand(
                config.id, 
                `sudo pnpm --dir "${appDir}" run build`, 
                onData);

            // Fix permissions immediately after git operations so pnpm can work
            execSyncSudo(`chown -R zpanel:zpanel "${appDir}"`);

            if ( autoStart == 1 ){

                // 4. Systemd Sync
                this.broadcast(config.id, "#5 Synchronizing Workers...", onData);
                
                await zpm.ensureDaemon()
                const workerConfig = await this.getZPMConfig(config)
                try{ await zpm.stop(workerConfig.name) }catch(err){}
                const startMsg = await zpm.start(workerConfig)
                log.info(APP_NAME, startMsg)

            }

            // const pkgJsonPath = path.join(config.path, `package.json`)
            // const pkgJson : dynamic = JSON.parse(await fs.readFile(pkgJsonPath, `utf8`))

            // if ( 
            //     pkgJson.scripts.start.includes(`next`) || 
            //     pkgJson.dependencies.next
            // )
            // {
            //     // NextJS App
            // }
            // else{
            //     await zpm.ensureDaemon()
            //     const startMsg = await zpm.start({
            //         name: config.worker,
            //         scriptPath: path.join(config.path, `dist`, `zapp.js`),
            //         port: config.port,
            //         instances: 1,
            //         mode: WorkerMode.Fork,
            //         // logs: {
            //         //     wsUrl: ``,
            //         //     saveToFile: true
            //         // }
            //     })
            // }
            // fss.writeFileSync
            // execSyncSudo(`bash -c 'echo "${JSON.stringify(pkgJson)}" > "${pkgJsonPath}"'`);

            this.broadcast(config.id, `:: Deployment successful! Live on ${branch} (${latestSha.substring(0, 7)})`, onData);

            
        } catch (err: any) {
            this.broadcast(config.id, `:: Deployment failed: ${err.message}`, onData, "error");
        }
            
    }



}

export default new AppManager();