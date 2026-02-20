import { APP_NAME } from '@/config';
import ProcessManager from '@/pm';
import path from 'path';
import "reflect-metadata";

const tag = APP_NAME;
const scriptPath = path.join(__dirname, '../dist/zapp.js');
const devMode = process.env.NODE_ENV !== 'production';

const pm = new ProcessManager({
    tag, scriptPath, devMode,
    port: process.env.APP_PORT!
});
pm.start()

process.on('SIGINT', () => {
  pm.stop();
  process.exit();
});