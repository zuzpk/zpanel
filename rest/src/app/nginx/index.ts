import cache, { nginxStatsCache } from '@/cache';
import { execSyncSudo } from '@/lib';
import { NginxServerBlock } from '@/lib/types';
import { dynamic, MD5 } from '@zuzjs/core';
import { Request, Response } from 'express';
import vhm from "./vhostmanager"

export interface NginxStatus {
    isRunning: boolean;
    version: string;
    activeConnections?: number;
    totalRequests?: number;
}

// export const loadServersFromNginx = async (force = false) : Promise<dynamic> => {

//     if ( !force ){
//         const _items =  cache.nginx.getAll()
//         if ( _items.length > 0 ){
//             return {
//                 isRunning: nginxStatsCache.isRunning,
//                 version: nginxStatsCache.version,
//                 blocks: _items
//             };
//         }
//     }

//     const rawOutput = execSyncSudo(
//         `/zpanel/bin/nginx-to-json.sh`
//     )

//     return JSON.parse(rawOutput.toString());

// }

export const nginxStatus = async () : Promise<NginxStatus> => {
    try{
        return JSON.parse(execSyncSudo(`sh /zpanel/bin/nginx-status.sh`)) as NginxStatus
    }
    catch(e){
        console.log(`[NginxStatus]`, e)
        return {
            isRunning: false,
            version: `0.0.0`
        }
    }
}

export const GetServerList = (req: Request, res: Response) => {

    

    vhm.listVHosts()
        .then(async list => {
            res.send({
                kind: `servers`,
                ...(await nginxStatus()),
                blocks: list
            });
        })
        .catch(err => {
            console.error(err);
            res.json({ error: `serversNotLoaded`, message: 'Failed to load server list' });
        });
//     loadServersFromNginx().then(servers => {
//         nginxStatsCache.isRunning = servers.isRunning;
//         nginxStatsCache.version = servers.version;
//         cache.nginx.addAll(servers.blocks as NginxServerBlock[]);
//         res.json({
//             kind: `blockList`,
//             ...servers
//         });
//     }).catch(err => {
//         console.error(err);
//         res.json({ error: `blockNotLoaded`, message: 'Failed to load server list' });
//     });

}

export const SaveVirtualHost = async (req: Request, res: Response) => {

    const { 
        id, 
        domain,  
        port,
        proxyHost,
        proxyPort,
        type,
        websockets,
        rootPath,
        accessLog,
        errorLog,
    } = req.body

    const sync = await vhm.syncVHost({
        id: id == `-` ? MD5(domain) : id,
        domain,
        listenPort: +port,
        proxyHost,
        proxyPort: +(proxyPort || 3000),
        type,
        websockets: websockets == `1`,
        rootPath,
        accessLog,
        errorLog
    })
    
    if ( sync.synced ){
        return res.send({
            kind: `vhostSynced`,
            message: `VirtualHost "${domain}" saved and synced...`
        })
    }

    return res.send({
        error: `vhostSyncFailed`,
        message: `VirtualHost "${domain}" was not saved..`
    })

}

export const LoadFileContent = (req: Request, res: Response) => {

//     const block : NginxServerBlock | null = cache.nginx.getById(req.body.id)

//     // console.log(`Loading block file for ID: ${req.body.id}`, block);

//     if ( 
//         block &&
//         // fs.existsSync(block.path)
//         fs.existsSync(block.path)
//     ){
//         const raw = fs.readFileSync(block.path, { encoding: `utf8` });
//         return res.json({
//             kind: `blockFile`,
//             content: raw
//         });
//     }
//     else{
        return res.json({ error: `blockNotLoaded`, message: 'Failed to load block file' });
//     }
    

}