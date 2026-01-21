import fs from 'node:fs';
import path from 'node:path';
import { Request, Response } from "express"
import { DirItem } from '@/lib/types';
import { dynamic } from "@zuzjs/core"
import { Encode } from '@/lib/core';
import { spawn } from "child_process"

/**
 * Lists all direct children (files and directories) in the given path.
 * Returns array of objects with { label, isDir, size, modified }
 * 
 * @param dirPath - Directory path (absolute or relative). Defaults to current directory.
 * @returns Array of DirItem objects
 * @throws Error if path doesn't exist, isn't a directory, or permission denied
 */
export const listDirectory = (dirPath: string = '.'): DirItem[] => {

  const resolvedPath = path.resolve(dirPath);

  try {
    const dirStat = fs.statSync(resolvedPath);
    if (!dirStat.isDirectory()) {
    //   throw new Error(`Not a directory: ${dirPath}`);
      return []
    }

    const entries = fs.readdirSync(resolvedPath, { withFileTypes: true });

    return entries.map((entry: dynamic) => {
      const fullPath = path.join(resolvedPath, entry.name);
      let stats: fs.Stats;

      try {
        stats = fs.statSync(fullPath);
      } catch (err) {
        // In rare cases (e.g. broken symlink), fallback to safe defaults
        return {
          token: Encode(fullPath),
          path: fullPath,
          label: String(entry.name),
          isDir: entry.isDirectory(),
          size: 0,
          modified: 0,
          content: ``
        };
      }

      const isDir = stats.isDirectory();

      return {
        token: Encode(fullPath),
        path: fullPath,
        label: entry.name,
        isDir,
        size: isDir ? 0 : stats.size,
        modified: stats.mtime.getTime(),
        content: ``
      };
    });
  } catch (err: any) {
    // if (err.code === 'ENOENT') {
    //   throw new Error(`Path does not exist: ${dirPath}`);
    // }
    // if (err.code === 'EACCES') {
    //   throw new Error(`Permission denied: ${dirPath}`);
    // }
    // throw err;
    return []
  }
}

export const ListFilesAndFolders = async (req: Request, resp: Response) => {

    const { d } = req.body

    return resp.send({
        kind: `ffList`,
        items: listDirectory(d)
          .sort((a: any, b: any) => {
            if ( a.isDir !== b.isDir ){
              return a.isDir ? -1 : 1
            }
            else 
              return b.label - a.label
          })
    })

}

export const CreateFnF = async (req: Request, resp: Response) => {

  const { d, n } = req.body
  const target = path.join( d, n )
  if ( fs.existsSync(target) ){
    return resp.send({
      error: `fileExist`,
      message: `A file with that name already exist`
    })
  }

  const child = spawn(`sudo`, [`/zpanel/bin/touch-file.sh`, target])

  child.on(`exit`, code => {
    if ( code == 0 ){
      resp.send({
        kind: `fileCreated`,
        message: `Nice and easy :) File created successfully.`
      })
    }
    else{
      resp.send({
        error: `fileError`,
        message: `File was not created. Try again in few.`
      })
    }
  })

  child.on('error', err => {
    resp.send({
      error: `fileError`,
      message: `Failed to create file: ${err.message}`
    });
  });

  return; // Ensure function always returns

}
