export type User = {
    loading: boolean,
    ID: string | null,
    oid?: number,
    utp?: UserType,
    name?: string,
    email?: string,
    cc?: string,
    status?: UserStatus
}

export enum UserType {
    Guest = 0,
    User = 1,
    Admin = 2
}

export enum UserStatus {
    InActive = 0,
    Active = 1,
    Banned = -1,
}

export enum DB {
    You = "you"
}

export enum PubEvent {

    OnSocketStatusChange = "SOCKET_STATUS_CHANGE",

    OpenDirectory = "OPEN_DIRECTORY_IN_FM",
    OnNginxConfFileCreated = "ON_NEW_NGINX_CONF_FILE_CREATED",
    OnFileCreated = "ON_NEW_FILE_CREATED",
    OnFileSaved = "ON_FILE_SAVED_CREATED",
    OnTargetDirChoosen = "ON_TARGET_DIR_CHOOSEN",

    OnTLog = "ON_TLOG",
    ConnectTLog = "CONNECT_TLOG",
}

export type GitAction = `deploy` | `push` | `pull`

export type AppSwitchMode = `start` | `stop` | `restart`

export enum ZuzAppStatus {
  Stopped = "stopped",
  Starting = "starting",
  Running = "running",
  Stopping = "stopping",
  Crashed = "crashed",
  Errored = "errored",
  Loading = "loading"
}

export interface ZuzAppPackage {
    name: string,
    version: string,
    description: string,
    isNextJs: boolean
}

// export interface ZuzApp {
//     id: string;
//     name: string;
//     service: string;
//     pkg: ZuzAppPackage | null;
//     domain: string;
//     description?: string;
//     git?: {
//         url: string;
//         isPrivate?: boolean;
//         pem?: string;
//         branch?: string;
//         commit?: string;
//         installationId?: string;
//         appId?: string;
//     },
//     nodeVersion: string;
//     port: number;
//     user: string;
//     group?: string;
//     path: string;
//     status: ZuzAppStatus;
// }

export interface ZuzApp {
    id: string;
    name: string;
    worker: string;
    pkg: ZuzAppPackage | null;
    domain: string;
    description?: string;
    git?: {
        url: string;
        isPrivate?: boolean;
        branch?: string;
        commit?: string;
        pem?: string;
        installationId?: string;
        appId?: string;
    },
    port: number;
    path: string;
    status: ZuzAppStatus;
}

export interface PageTitle {
    label: string,
    icon: string,
    link?: string
}

export interface PageAction {
    label: string,
    fn: () => void
}

export interface FileItem {
    token: string,
    path: string,
    label: string;
    isDir: boolean;
    size: number;   
    modified: number;
    content?: string;
}

export interface FileContextItem {
    enabled: boolean,
    label: string,
    icon?: string,
    action?: () => void
}

export interface LinuxUser {
  username: string;
  uid: number;
  gid: number;
  home: string;
  shell: string;
  fullName?: string;       // GECOS field (usually real name)
  groups: string[];        // All secondary groups
  isSystemUser: boolean;   // UID < 1000 or in /etc/default/useradd
  lastLogin?: string;      // Last login time (optional, requires lastlog)
  hasPassword: boolean;    // Whether account has password set (via /etc/shadow)
}

export interface VirtualHost {
    id: string,
    domain: string;
    listenPort: number;
    proxyHost?: string;
    proxyPort?: number;
    type: 'static' | 'proxy';
    websockets?: boolean;
    rootPath?: string;
    accessLog?: string;
    errorLog?: string;
}
// export interface NginxServerBlock {
//     id: string;
//     domain: string;
//     root: string;
//     isActive: boolean;
//     sslEnabled: boolean;
//     sslCertPath?: string;
//     sslKeyPath?: string;
//     path: string;
// }

export interface NginxStatus {
    isRunning: boolean;
    version?: string;
    activeConnections?: number;
    totalRequests?: number;
    blocks: VirtualHost[];
}

export interface GitHubBranch {
    name: string;
    sha: string;
    lastUpdate: number;
    isProtected: boolean;
}

export interface GitHubCommit {
    sha: string;
    message: string;
    author: string;
    date: string;
    url: string;
}