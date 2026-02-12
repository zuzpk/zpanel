import ProcessManager from '@/pm';
import { exec } from 'child_process';
import path from 'path';
import "reflect-metadata";

const appName = 'zpanel';
const script = path.join(__dirname, '../dist/zapp.js');
const isDevMode = process.env.NODE_ENV !== 'production';

exec(`sudo fuser -k -9 ${process.env.APP_PORT}/tcp`, (err, stdout, stderr) => {
    console.log(err, stdout, stderr)
})

const processManager = new ProcessManager(appName, script, isDevMode);
processManager.startApp();