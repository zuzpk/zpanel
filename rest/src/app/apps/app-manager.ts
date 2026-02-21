import cache from '@/cache';
import { APP_NAME } from '@/config';
import { log } from '@/lib';
import { AppSwitchMode, ZuzApp } from '@/lib/types';
import { uuid } from '@zuzjs/core';
import { WorkerStatus, zpm } from "@zuzjs/pm";
import fs from 'fs/promises';
import path from 'path';
import pc from "picocolors";

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

    private async getWorkerName(appName: string): Promise<string> {
        const sn = `${this.appName(appName)}-worker`;
        if ( 
            !(await zpm.getProcessByName(sn)) ||
            cache.apps.getAll().find(a => a.worker == sn)
        ){
            return this.getWorkerName(`${appName}-${Math.floor(Math.random() * 1000)}`);
        }
        return sn;
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
            // user: conf.user,
            // group: conf.user,
            path: conf.path,
            status: fromCache?.status ?? WorkerStatus.Stopped
        }

        await this.saveConfig(config);

        return config
    }

    /**
     * Helper to write the config back to the filesystem
     */
    private async saveConfig(config: ZuzApp) {
        cache.apps.update(config);
        const filePath = path.join(this.DATA_DIR, `${config.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf-8');
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

            switch(mode){
                case "start":
                    await zpm.startWorker(app.worker)
                    break;
                case "stop":
                    await zpm.stop(app.worker)
                    break;
                case "restart":
                    await zpm.restart(app.worker)
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


     /**
     * Reads all existing VHost JSON files from the data directory
     */
    public async listApps(id = `-`): Promise<ZuzApp[]> {

        
        if ( id == `-` ){
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


    public async createApp(conf?: Partial<ZuzApp>): Promise<ZuzApp | null> {
        try{

            const appId = uuid(16);
            const name = conf?.name || `app-${appId}`;
            const domain = conf?.domain || `${name}.local`;
            const worker = await this.getWorkerName(name);

            // const systemUser = name.trim().replace(/[^a-z0-9-S+]/gi, '_').toLowerCase();
            // const userCreated = createSystemUser(systemUser);

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

    public async pushToBranch(
        config: ZuzApp, 
        branch: string, 
        commitMsg: string,
        onData: (chunk: string) => void
    ) {
    }
    /**
     * This updates the config and performs a full rebuild.
     * Handles first-time setup AND branch updates.
     */
    public async deployBranch(
        config: ZuzApp, 
        branch: string, 
        onData: (chunk: string) => void
    ) {

    }


}

export default new AppManager();