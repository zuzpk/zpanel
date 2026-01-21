"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZuzCache = exports.nginxStatsCache = void 0;
exports.nginxStatsCache = {
    isRunning: false,
    version: "0.0.0",
};
class CacheSection {
    keySelector;
    data = {};
    constructor(keySelector) {
        this.keySelector = keySelector;
    }
    getAll() {
        return Object.values(this.data);
    }
    getById(name) {
        return this.data[name] ?? null;
    }
    update(item) {
        const key = this.keySelector(item);
        if (!this.data[key]) {
            this.data[key] = item;
        }
        else {
            this.data[key] = { ...this.data[key], ...item };
        }
    }
    add(item) {
        const key = this.keySelector(item);
        if (!this.data[key]) {
            this.data[key] = item;
        }
        else {
            this.data[key] = { ...this.data[key], ...item };
        }
    }
    addAll(items) {
        items.forEach((item) => this.add(item));
    }
    remove(name) {
        delete this.data[name];
    }
    clear() {
        this.data = {};
    }
}
class ZuzCache {
    static instance;
    apps;
    nginx;
    constructor() {
        this.apps = new CacheSection((app) => app.service);
        this.nginx = new CacheSection((server) => server.id);
    }
    static getInstance() {
        if (!ZuzCache.instance) {
            ZuzCache.instance = new ZuzCache();
        }
        return ZuzCache.instance;
    }
    clearAll() {
        this.apps.clear();
        this.nginx.clear();
        console.log("Global cache cleared.");
    }
}
exports.ZuzCache = ZuzCache;
const cache = ZuzCache.getInstance();
exports.default = cache;
