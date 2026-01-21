"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckForUpdate = exports.UpdateAppStatus = exports.CreateApp = exports.AppList = exports.loadZuzApps = exports.buildZuzApp = exports.AppServiceModified = exports.AppServiceStatusSwitched = void 0;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const types_1 = require("../lib/types");
const cache_1 = __importDefault(require("../cache"));
const core_1 = require("@zuzjs/core");
const lib_1 = require("../lib");
const core_2 = require("../lib/core");
const git_1 = require("../app/git");
const isServiceActive = (service) => {
    try {
        (0, child_process_1.execSync)(`systemctl is-active --quiet ${service}`);
        return true;
    }
    catch {
        return false;
    }
};
const getAppPortFromSystemd = (workingDir) => {
    const serviceName = path_1.default.basename(workingDir);
    const serviceFile = `/etc/systemd/system/zapp_${serviceName}.service`;
    if (!fs_1.default.existsSync(serviceFile))
        return null;
    const content = fs_1.default.readFileSync(serviceFile, 'utf8');
    const match = content.match(/Environment=PORT=(\d+)/);
    return match && match[1] ? parseInt(match[1]) : null;
};
const getPortFromPackageJson = (workingDir) => {
    const pkgPath = path_1.default.join(workingDir, 'package.json');
    if (!fs_1.default.existsSync(pkgPath))
        return null;
    try {
        const pkg = JSON.parse(fs_1.default.readFileSync(pkgPath, 'utf8'));
        const startScript = pkg.scripts?.start || pkg.scripts?.dev;
        const portMatch = startScript?.match(/-p\s+(\d+)|PORT=(\d+)/);
        if (portMatch)
            return parseInt(portMatch[1] || portMatch[2]);
        const envPath = path_1.default.join(workingDir, '.env');
        if (fs_1.default.existsSync(envPath)) {
            const envContent = fs_1.default.readFileSync(envPath, 'utf8');
            const envMatch = envContent.match(/^PORT=(\d+)/m);
            if (envMatch && envMatch[1])
                return parseInt(envMatch[1]);
        }
    }
    catch { }
    return null;
};
const getPortFromEnv = (workingDir) => {
    const envPath = path_1.default.join(workingDir, '.env');
    if (fs_1.default.existsSync(envPath)) {
        const envContent = fs_1.default.readFileSync(envPath, 'utf8');
        const envMatch = envContent.match(/PORT=(\d+)/m);
        if (envMatch && envMatch[1])
            return +envMatch[1];
    }
    return null;
};
const getAppTypeFromPackageJson = (workingDir) => {
    const type = fs_1.default.existsSync(path_1.default.join(workingDir, 'next.config.ts')) ||
        fs_1.default.existsSync(path_1.default.join(workingDir, 'next.config.js')) ||
        fs_1.default.existsSync(path_1.default.join(workingDir, 'zuz.js'))
        ? `next` : `express`;
    return {
        port: type == `express` ?
            getPortFromEnv(workingDir) :
            getPortFromPackageJson(workingDir),
        type
    };
};
const getPublicHost = () => {
    if (process.env.PANEL_DOMAIN)
        return process.env.PANEL_DOMAIN;
    try {
        return (0, child_process_1.execSync)('curl -s ifconfig.me || hostname -I | awk "{print $1}"', { encoding: 'utf8' }).trim();
    }
    catch {
        return 'localhost';
    }
};
function isPortListening(port) {
    try {
        (0, child_process_1.execSync)(`ss -ltnp "sport = :${port}" | grep -q :${port}`);
        return true;
    }
    catch {
        return false;
    }
}
const guessSubdomainUrl = async (workingDir) => {
    const appName = path_1.default.basename(workingDir);
    const panelDomain = process.env.PANEL_DOMAIN || await getPublicHost();
    const candidates = [
        `http://${appName}.${panelDomain}`,
        `http://${appName}-${panelDomain.replace(/\./g, '-')}.vercel.app`,
    ];
    for (const url of candidates) {
        try {
            (0, child_process_1.execSync)(`curl -s -o /dev/null -I -m 3 "${url}"`);
            return url;
        }
        catch { }
    }
    return null;
};
const inferAppUrl = async (workingDir) => {
    try {
        const port = getAppPortFromSystemd(workingDir) || getPortFromPackageJson(workingDir) || 3000;
        const host = getPublicHost();
        if (isPortListening(port)) {
            return `http://${host}:${port}`;
        }
    }
    catch { }
    const subdomainUrl = await guessSubdomainUrl(workingDir);
    if (subdomainUrl)
        return subdomainUrl;
    const commonPorts = [3000, 3001, 4000, 5000];
    for (const port of commonPorts) {
        if (isPortListening(port)) {
            return `http://${getPublicHost()}:${port}`;
        }
    }
    return null;
};
const AppServiceStatusSwitched = async (req, resp) => {
    const { appId, service, status } = req.body;
    if ((service.startsWith(`zapp_`) || service.startsWith(`zpanel-`)) &&
        !service.includes(`@`)) {
        let app = cache_1.default.apps.getById(service);
        if (!app) {
            app = await (0, exports.buildZuzApp)(service);
        }
        const _status = types_1.ZuzAppStatus[(0, core_1._)(status).ucfirst()._] ?? types_1.ZuzAppStatus.Unknown;
        cache_1.default.apps.update({ ...app, status: _status });
        console.log(`AppServiceStatusSwitched:`, appId, service, status);
    }
    else
        console.log(`Invalid appId received in AppServiceStatusSwitched:`, appId, service, status);
};
exports.AppServiceStatusSwitched = AppServiceStatusSwitched;
const AppServiceModified = async (req, resp) => {
    console.log("AppServiceModified called", req.body);
};
exports.AppServiceModified = AppServiceModified;
const buildZuzApp = async (serviceName) => {
    const appId = serviceName.replace(/^zapp_/, '').replace(/\.service$/, '');
    const servicePath = `/etc/systemd/system/${serviceName}`;
    const serviceContent = fs_1.default.readFileSync(servicePath, 'utf8');
    const workingDirMatch = serviceContent.match(/^WorkingDirectory=(.+)$/m);
    const workingDir = workingDirMatch ? workingDirMatch[1] : null;
    let packageInfo = null;
    if (workingDir && fs_1.default.existsSync(`${workingDir}/package.json`)) {
        try {
            const pkg = JSON.parse(fs_1.default.readFileSync(`${workingDir}/package.json`, 'utf8'));
            packageInfo = {
                name: pkg.name || appId,
                version: pkg.version || 'unknown',
                description: pkg.description || '',
                isNextJs: (pkg.dependencies && pkg.dependencies.next) || (pkg.devDependencies && pkg.devDependencies.next) ? true : false
            };
        }
        catch { }
    }
    const isRunning = await isServiceActive(serviceName);
    return {
        id: (0, lib_1.Encode)(serviceName),
        service: serviceName,
        pkg: packageInfo,
        path: workingDir ?? '-',
        url: isRunning && workingDir ? await inferAppUrl(workingDir) : null,
        status: isRunning ? types_1.ZuzAppStatus.Running : types_1.ZuzAppStatus.Stopped
    };
};
exports.buildZuzApp = buildZuzApp;
const loadZuzApps = async (force = false) => {
    if (!force) {
        const _apps = cache_1.default.apps.getAll();
        if (_apps.length > 0) {
            return _apps;
        }
    }
    const services = (0, child_process_1.execSync)(`systemctl list-unit-files --type=service | grep '^zapp_' | awk '{print $1}'`, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    const apps = await Promise.all(services.map(async (serviceName) => {
        const _zapp = await (0, exports.buildZuzApp)(serviceName);
        cache_1.default.apps.update(_zapp);
        return _zapp;
    }));
    return apps;
};
exports.loadZuzApps = loadZuzApps;
const AppList = async (req, resp) => {
    try {
        const apps = await (0, exports.loadZuzApps)(false);
        return resp.send({
            kind: `appList`,
            apps
        });
    }
    catch (e) {
        return resp.send({
            error: `appsFetchFailed`,
            message: req.lang.appsFetchFailed
        });
    }
};
exports.AppList = AppList;
const CreateApp = async (req, resp) => {
    const { repo = '', isprivate = false, name = '', pem = '', service = '', desc = '', root = '', usr, group, } = req.body;
    let error = null;
    if ((0, core_1._)(name).isEmpty()) {
        error = req.lang?.appNameIsRequired || 'App name is required';
    }
    else if ((0, core_1._)(root).isEmpty()) {
        error = req.lang?.appRootIsRequired || 'Root directory is required';
    }
    let stat;
    try {
        stat = fs_1.default.statSync(root);
        if (!stat.isDirectory()) {
            error = req.lang?.appRootPathIsNotADirectory || 'Root path is not a directory';
        }
    }
    catch (err) {
        error = `Root path does not exist or is inaccessible: ${err.message}`;
    }
    if ((0, core_1._)(repo).isEmpty()) {
        if (!fs_1.default.existsSync(path_1.default.join(root, 'package.json'))) {
            error = req.lang?.appRootForExistingAppIsNotValid || 'Root directory must contain a package.json when no repository is provided';
        }
    }
    else {
        const gitUri = (0, core_2.isGitHubUrl)(repo);
        if (!gitUri.valid) {
            error = req.lang?.appRepoUrlInvalid || 'Invalid GitHub repository URL';
        }
        else if (fs_1.default.existsSync(path_1.default.join(root, 'package.json'))) {
            error = req.lang?.appRootForRepoIsNotEmpty || 'Cannot clone into directory that already contains package.json';
        }
    }
    if (error) {
        return resp.send({
            error: `appError`,
            message: error
        });
    }
    const appName = name.trim().replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    const appId = `zapp_${appName}`;
    const serviceName = service || `${appId}.service`;
    const serviceFilePathTmp = `/tmp/${serviceName}`;
    const serviceFilePath = `/etc/systemd/system/${serviceName}`;
    if (fs_1.default.existsSync(serviceFilePath)) {
        return resp.json({
            error: 'appError',
            message: `Service ${serviceName} already exists`,
        });
    }
    if ((0, core_1._)(repo).isEmpty()) {
        if (!fs_1.default.existsSync(path_1.default.join(root, 'node_modules'))) {
            (0, child_process_1.execSync)(`cd "${root}" && pnpm install --production`, { stdio: 'pipe' });
        }
    }
    else {
        try {
            await (0, git_1.clone)(repo, root, appName);
            (0, child_process_1.execSync)(`cd "${path_1.default.join(root, appName)}" && pnpm install --production`, { stdio: 'pipe' });
        }
        catch (err) {
            return resp.json({
                error: 'gitCloneFailed',
                message: `Failed to clone repository: ${err.message}`,
            });
        }
    }
    const realAppPath = (0, core_1._)(repo).isEmpty() ? root : path_1.default.join(root, appName);
    const appType = getAppTypeFromPackageJson(realAppPath);
    const serviceContent = [
        `[Unit]`,
        `Description=ZPanelApp:${appId}${desc ? ' - ' + desc : ''}`,
        `After=network.target`,
        ``,
        `[Service]`,
        `Type=notify`,
        `NotifyAccess=main`,
        `ExecStart=/usr/bin/pnpm start`,
        `User=${usr || `root`}`,
        `Group=${group || usr || `root`}`,
        `WorkingDirectory=${realAppPath}`,
        `Restart=always`,
        `Environment=PORT=${appType.port ?? `3000`}`,
        `Environment=NODE_ENV=production`,
        ``,
        `[Install]`,
        `WantedBy=multi-user.target`.trim()
    ].join(`\n`);
    try {
        const escapedContent = serviceContent.replace(/'/g, "'\\''");
        (0, core_2.execSyncSudo)(`bash -c 'echo "${escapedContent}" > "${serviceFilePath}"'`);
        (0, core_2.execSyncSudo)(`chmod 644 "${serviceFilePath}"`);
        (0, core_2.execSyncSudo)(`chown root:root "${serviceFilePath}"`);
    }
    catch (err) {
        return resp.json({
            error: 'serviceCreateFailed',
            message: `Failed to create service file: ${err.message}`,
        });
    }
    try {
        (0, core_2.execSyncSudo)('systemctl daemon-reload');
        await new Promise(resolve => setTimeout(resolve, 500));
        (0, core_2.execSyncSudo)(`systemctl enable ${serviceName}`);
        (0, core_2.execSyncSudo)(`systemctl start ${serviceName}`);
    }
    catch (err) {
        return resp.json({
            error: 'serviceStartFailed',
            message: `Failed to start service: ${err.message}`,
        });
    }
    await (0, exports.loadZuzApps)(true);
    return resp.send({
        kind: `appCreated`,
        message: `App "${appId}" created and started`,
        app: cache_1.default.apps.getById(serviceName),
    });
};
exports.CreateApp = CreateApp;
const UpdateAppStatus = async (req, resp) => {
    const { id } = req.body;
    const { splat } = req.params;
    const splatArr = Array.isArray(splat)
        ? splat
        : typeof splat === "string"
            ? splat.split("/")
            : [];
    const [, , action] = splatArr;
    try {
        (0, core_2.execSyncSudo)(`systemctl ${action} ${(0, core_2.Decode)(id)}`);
        return resp.send({
            kind: `app${(0, core_1._)(action).ucfirst()._}ed`,
            message: `App ${action}ed successfully`,
        });
    }
    catch (e) {
        return resp.send({
            error: `app${(0, core_1._)(action).ucfirst()._}Failed`,
            message: `Failed to ${action} app: ${e.message}`,
        });
    }
};
exports.UpdateAppStatus = UpdateAppStatus;
const CheckForUpdate = async (req, resp) => {
    console.log(req.body);
};
exports.CheckForUpdate = CheckForUpdate;
