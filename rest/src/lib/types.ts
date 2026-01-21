import "express";

declare global {
    namespace Express {
        interface Request {
            lang?: Record<string, string>;
            user?: User | null,
            sender?: string | null
        }
    }
}

declare module "express-session" {
    interface SessionData {
        loggedIn?: boolean;
        sender?: string;
        isRoot?: boolean;
    }
}

export interface MulterRequest extends Request {
    file: any
}

export type UserCookies = {
    ID: string,
    Token: string,
    Data: string,
    Fingerprint: string,
    Session: string,
};

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

export type User = {
    ID: string,
    oid?: number,
    utp: UserType,
    name: string,
    email: string,
    cc: string | undefined,
    status: UserStatus
}

export enum ZuzAppStatus {
    Running = 'running',
    Stopped = 'stopped',
    Failed = 'failed',
    Restarting = 'restarting',
    Unknown = 'unknown'
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

export interface DirItem {
    token: string,
    path: string,
    label: string;
    isDir: boolean;
    size: number;   
    modified: number;
    content?: string;
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

export interface LinuxGroup {
  name: string;
  gid: number;
  members: string[];      // users who are secondary members
  isSystemGroup: boolean; // GID < 1000 or in standard range
}

export interface NginxServer {
    isRunning: boolean,
    version: string
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

export interface ICacheSection<T> {
  getAll: () => T[];
  getById: (uniqueId: string) => T | null;
  update: (item: T) => void;
  add: (item: T) => void;
  addAll: (item: T[]) => void;
  remove: (uniqueId: string) => void;
  clear: () => void;
}