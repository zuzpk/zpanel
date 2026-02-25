import { APP_VERSION, LOADING_MSG } from "./config";
import { FileItem, GitHubBranch, GitHubCommit, LinuxUser, VirtualHost, WorkerStats, ZuzApp } from "./types";

export enum Store {
    App = "app",
    User = "user",
    Apps = "apps",
    FileManager = "fm",
    Nginx = "nginx",
    Git = "git"
}

export const AppStore = {
    App : {
        version: APP_VERSION,
        debug: true,
        token: null,
        theme: `system`,
        loading: false,
        loadingMessage: LOADING_MSG,
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
        list: [] as ZuzApp[],
        dashboard: {
            loading: false,
            stats: null as WorkerStats | null
        }        
    },
    Git: {
        loading: true,
        deploying: false,
        repo: `` as string,
        branches: [] as GitHubBranch[],
        commits: [] as GitHubCommit[],
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
        currentBlock: null as null | VirtualHost,
        isRunning: false,
        versin: "0.0.0",
        blocks: [] as VirtualHost[]
    },
}