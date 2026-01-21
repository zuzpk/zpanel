import { APP_VERSION } from "./config";
import { FileItem, LinuxUser, NginxServerBlock, ZuzApp } from "./types";

export enum Store {
    App = "app",
    User = "user",
    Apps = "apps",
    FileManager = "fm",
    Nginx = "nginx",
}

export const AppStore = {
    App : {
        version: APP_VERSION,
        debug: true,
        token: null,
        theme: `system`
    },
    User : {
        loading: true,
        ID: -1,
        nm: ``,
        ir: false
    },
    Apps: {
        loading: true,
        error: null,
        users: [] as LinuxUser[],
        list: [] as ZuzApp[]
    },
    //FileManager
    FileManager: {
        loading: true,
        error: null,
        currentDir: `/home`,
        selectedItem: null as FileItem | null,
        items: [] as FileItem[]
    },
    Nginx: {
        loading: true,
        working: false,
        error: null,
        currentBlock: null as null | NginxServerBlock,
        isRunning: false,
        versin: "0.0.0",
        blocks: [] as NginxServerBlock[]
    },
}