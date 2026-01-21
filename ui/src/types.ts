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
    OpenDirectory = "OPEN_DIRECTORY_IN_FM",
    OnNginxConfFileCreated = "ON_NEW_NGINX_CONF_FILE_CREATED",
    OnFileCreated = "ON_NEW_FILE_CREATED",
    OnFileSaved = "ON_FILE_SAVED_CREATED",
}

export enum ZuzAppStatus {
    Running = 'running',
    Stopped = 'stopped',
    Failed = 'failed',
    Restarting = 'restarting',
    Unknown = 'unknown',
    Loading = 'loading'
}

export interface ZuzAppPackage {
    name: string,
    version: string,
    description: string,
    isNextJs: boolean
}

export interface ZuzApp {
    id: string,
    service: string,
    pkg: ZuzAppPackage | null,
    path: string,
    url: string | null,
    status: ZuzAppStatus
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

export interface NginxServerBlock {
    id: string;
    domain: string;
    root: string;
    isActive: boolean;
    sslEnabled: boolean;
    sslCertPath?: string;
    sslKeyPath?: string;
    path: string;
}

export interface NginxStatus {
    isRunning: boolean;
    version?: string;
    activeConnections?: number;
    totalRequests?: number;
    serverBlocks: NginxServerBlock[];
}