import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import net from 'net';
import { execSyncSudo, sudoWriteFile, log } from '@/lib';
import { APP_NAME } from '@/config';

export interface VirtualHost {
    id: string,
    domain: string;
    listenPort: number;
    proxyHost: string;
    proxyPort: number;
    type: 'static' | 'proxy';
    websockets?: boolean;
    rootPath?: string;
    accessLog?: string;
    errorLog?: string;
}

class VirtualHostManager {

    private DATA_DIR = '/zpanel/usr/vhosts';
    private NGINX_DIR = '/etc/nginx/conf.d';
    private START_PORT = 1000;
    private END_PORT = 9999;

    /**
     * Reads all existing VHost JSON files from the data directory
     */
    public async listVHosts(): Promise<VirtualHost[]> {
        try {
        // Ensure directory exists so it doesn't throw ENOENT
        await fs.mkdir(this.DATA_DIR, { recursive: true });
        
        const files = await fs.readdir(this.DATA_DIR);

        // console.log(`--files`, files)
        
        // Filter for .json files and read them in parallel
        const configs = await Promise.all(
            files
            .filter(file => file.endsWith('.json'))
            .map(async (file) => {
                try {
                    const filePath = path.join(this.DATA_DIR, file);
                    const content = await fs.readFile(filePath, 'utf-8');
                    return JSON.parse(content) as VirtualHost;
                } catch (err) {
                    console.error(`Failed to parse config file ${file}:`, err);
                    return null;
                }
            })
        );

            // Remove any null results from failed parses
            return configs.filter((c): c is VirtualHost => c !== null);
        } catch (err) {
            console.error("Error listing VHosts:", err);
            return [];
        }
    }

    private generateNginxTemplate(config: VirtualHost): string {
        const { domain, listenPort, proxyHost, proxyPort, websockets, accessLog, errorLog } = config;
        return `
# ZPanel Generated Config
server {
    listen ${listenPort};
    server_name ${domain};

    access_log ${path.join(accessLog || `/var/log/nginx`, `${domain.replace(/\./g, `_`)}_access.log`)};
    error_log ${path.join(errorLog || `/var/log/nginx`, `${domain.replace(/\./g, `_`)}_error.log`)};

    location / {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        ${websockets ? `
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;

        set $connection_upgrade '';
        if ($http_upgrade = "websocket"){
            set $connection_upgrade "upgrade";
        }
        ` : ''}

        proxy_pass http://${proxyHost}:${proxyPort};
    }
}
`.trim();
    }

    // public async restartNginx(){
    //     try{
    //         execSync('nginx -t');
    //         execSync('systemctl reload nginx');
    //     }catch(e){
    //         return e
    //     }
    // }

    public async syncVHost(config: VirtualHost) : Promise<{
        synced: boolean,
        error?: string
    }> {

        log.info(APP_NAME, `[syncVHost] Syncing virtual host: ${config.domain} on port ${config.listenPort} to proxy to ${config.proxyHost}:${config.proxyPort}`);

        const jsonPath = path.join(this.DATA_DIR, `${config.domain}.json`);
        const nginxPath = path.join(this.NGINX_DIR, `${config.domain}.conf`);

        try {
            await fs.mkdir(this.DATA_DIR, { recursive: true });
            await fs.writeFile(jsonPath, JSON.stringify(config, null, 2));
            const content = this.generateNginxTemplate(config);
            sudoWriteFile(nginxPath, content)
            
            execSyncSudo('nginx -t');
            execSyncSudo('systemctl reload nginx');
            return { synced: true };
        } catch (err: any) {
            log.error(APP_NAME, `[syncHostError]`, err)
            try{
                await fs.unlink(jsonPath);
                execSyncSudo(`rm -f "${nginxPath}"`);
                execSyncSudo('nginx -t');
                execSyncSudo('systemctl reload nginx');
            }catch(e){
                log.error(APP_NAME, `[syncHostRestartError]`, e)
            }
            return { synced: false, error: err.message };
        }
    }

    public async getNextAvailablePort(): Promise<number> {
        const existingConfigs = await this.listVHosts();
        const usedInZPanel = new Set(existingConfigs.map(c => c.proxyPort));

        for (let port = this.START_PORT; port <= this.END_PORT; port++) {
        if (usedInZPanel.has(port)) continue;
        if (await this.isPortAvailableOnSystem(port)) return port;
        }
        throw new Error("No available ports found in range.");
    }

    private isPortAvailableOnSystem(port: number): Promise<boolean> {
        return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => resolve(false));
        server.once('listening', () => {
            server.close();
            resolve(true);
        });
        server.listen(port, '127.0.0.1');
        });
    }
}

export default new VirtualHostManager();