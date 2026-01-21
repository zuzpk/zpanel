import cache, { nginxStatsCache } from '@/cache';
import { execSyncSudo } from '@/lib';
import { NginxServerBlock } from '@/lib/types';
import { dynamic } from '@zuzjs/core';
import { Request, Response } from 'express';
import fs from "node:fs"

export const loadServersFromNginx = async (force = false) : Promise<dynamic> => {

    if ( !force ){
        const _items =  cache.nginx.getAll()
        if ( _items.length > 0 ){
            return {
                isRunning: nginxStatsCache.isRunning,
                version: nginxStatsCache.version,
                blocks: _items
            };
        }
    }

    const rawOutput = execSyncSudo(
        `/zpanel/bin/nginx-to-json.sh`
    )

    return JSON.parse(rawOutput.toString());

}

export const GetServerList = (req: Request, res: Response) => {

    loadServersFromNginx().then(servers => {
        nginxStatsCache.isRunning = servers.isRunning;
        nginxStatsCache.version = servers.version;
        cache.nginx.addAll(servers.blocks as NginxServerBlock[]);
        res.json({
            kind: `blockList`,
            ...servers
        });
    }).catch(err => {
        console.error(err);
        res.json({ error: `blockNotLoaded`, message: 'Failed to load server list' });
    });

}

export const LoadFileContent = (req: Request, res: Response) => {

    const block : NginxServerBlock | null = cache.nginx.getById(req.body.id)

    // console.log(`Loading block file for ID: ${req.body.id}`, block);

    if ( 
        block &&
        // fs.existsSync(block.path)
        fs.existsSync(block.path)
    ){
        const raw = fs.readFileSync(block.path, { encoding: `utf8` });
        return res.json({
            kind: `blockFile`,
            content: raw
        });
    }
    else{
        return res.json({ error: `blockNotLoaded`, message: 'Failed to load block file' });
    }
    

}