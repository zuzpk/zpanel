import { Request, Response } from "express";
import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ZuzAppStatus, ZuzApp, ZuzAppPackage } from "@/lib/types";
import cache from "@/cache";
import { _, dynamic } from "@zuzjs/core";
import { Encode } from "@/lib";
import { Decode, execSyncSudo, isGitHubUrl } from "@/lib/core";
import { clone } from "@/app/git";

const isServiceActive = (service: string): boolean => {
  try {
    execSync(`systemctl is-active --quiet ${service}`);
    return true;
  } catch {
    return false;
  }
}

// Helper: Get port from systemd service Environment=PORT=...
const getAppPortFromSystemd = (workingDir: string): number | null => {
  const serviceName = path.basename(workingDir); // or derive from path
  const serviceFile = `/etc/systemd/system/zapp_${serviceName}.service`;
  if (!fs.existsSync(serviceFile)) return null;

  const content = fs.readFileSync(serviceFile, 'utf8');
  const match = content.match(/Environment=PORT=(\d+)/);
  return match && match[1] ? parseInt(match[1]) : null;
}

// Helper: Get port from package.json scripts or .env
const getPortFromPackageJson = (workingDir: string): number | null => {
  const pkgPath = path.join(workingDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const startScript = pkg.scripts?.start || pkg.scripts?.dev;

    // Look for "next start -p 3001" or "node server.js" with PORT
    const portMatch = startScript?.match(/-p\s+(\d+)|PORT=(\d+)/);
    if (portMatch) return parseInt(portMatch[1] || portMatch[2]);

    // Fallback: check .env
    const envPath = path.join(workingDir, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envMatch = envContent.match(/^PORT=(\d+)/m);
      if (envMatch && envMatch[1]) return parseInt(envMatch[1]);
    }
  } catch {}
  return null;
}

const getPortFromEnv = (workingDir: string): number | null => {
  const envPath = path.join(workingDir, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envMatch = envContent.match(/PORT=(\d+)/m);
    if (envMatch && envMatch[1]) return +envMatch[1];
  } 
  return null
}

// Helper: Check if next app or express app from package.json scripts or .env
const getAppTypeFromPackageJson = (workingDir: string): {
  port: number | null,
  type: `next` | `express`
} => {

  const type = fs.existsSync(path.join(workingDir, 'next.config.ts')) ||
    fs.existsSync(path.join(workingDir, 'next.config.js')) ||
    fs.existsSync(path.join(workingDir, 'zuz.js'))
    ? `next` :  `express`

  return {
    port: type == `express` ?  
      getPortFromEnv(workingDir) :
      getPortFromPackageJson(workingDir),
    type
  }

}

// Helper: Get server's public hostname/IP
const getPublicHost = (): string => {
  // Priority: your panel domain (e.g., panel.zuz.com → use that)
  if (process.env.PANEL_DOMAIN) return process.env.PANEL_DOMAIN;

  // Fallback: public IP
  try {
    return execSync('curl -s ifconfig.me || hostname -I | awk "{print $1}"', { encoding: 'utf8' }).trim();
  } catch {
    return 'localhost';
  }
}

// Helper: Check if port is open
function isPortListening(port: number): boolean {
  try {
    execSync(`ss -ltnp "sport = :${port}" | grep -q :${port}`);
    return true;
  } catch {
    return false;
  }
}

// Optional: Guess subdomain (if using Nginx/Caddy with auto vhosts)
const guessSubdomainUrl = async (workingDir: string): Promise<string | null> => {
  const appName = path.basename(workingDir);
  const panelDomain = process.env.PANEL_DOMAIN || await getPublicHost();

  // Common patterns: appname.paneldomain.com or appname-domain.com
  const candidates = [
    `http://${appName}.${panelDomain}`,
    `http://${appName}-${panelDomain.replace(/\./g, '-')}.vercel.app`, // if using Vercel-like
  ];

  for (const url of candidates) {
    try {
      // Quick HEAD request
      execSync(`curl -s -o /dev/null -I -m 3 "${url}"`);
      return url;
    } catch {}
  }

  return null;
}

// Main function
const inferAppUrl = async (workingDir: string): Promise<string | null> => {
  // 1. Check for PORT in environment (most reliable)
  try {

    const port = getAppPortFromSystemd(workingDir) || getPortFromPackageJson(workingDir) || 3000;
    const host = getPublicHost(); // your server's public IP or domain

    // Test if port is actually listening
    if (isPortListening(port)) {
      return `http://${host}:${port}`;
    }
  } catch {}

  // 2. Check for subdomain/virtual host (Nginx/Apache/Caddy reverse proxy)
  const subdomainUrl = await guessSubdomainUrl(workingDir);
  if (subdomainUrl) return subdomainUrl;

  // 3. Fallback: direct port if common Next.js ports
  const commonPorts = [3000, 3001, 4000, 5000];
  for (const port of commonPorts) {
    if (isPortListening(port)) {
      return `http://${getPublicHost()}:${port}`;
    }
  }

  return null;
}

/**
 * When a service is started/stopped/restarted, call this to refresh the app list.
 * /etc/systemd/system/zapp_*.service
 * Called from /zpanel/bin/zapp-notify.sh
 */
export const AppServiceStatusSwitched = async (req: Request, resp: Response) => {
  const { appId, service, status } = req.body;
  if ( 
    (service.startsWith(`zapp_`) || service.startsWith(`zpanel-`) ) &&
    !service.includes(`@`)
  ){
    let app : ZuzApp | null = cache.apps.getById(service)
    if ( !app ){
      app = await buildZuzApp(service);
    }
    const _status = ZuzAppStatus[_(status).ucfirst()._] ?? ZuzAppStatus.Unknown;
    cache.apps.update({ ...app!, status: _status! });
    console.log(`AppServiceStatusSwitched:`, appId, service, status);
  }
  else console.log(`Invalid appId received in AppServiceStatusSwitched:`, appId, service, status);
}

/**
 * When a service is started/stopped/restarted, call this to refresh the app list.
 * /etc/systemd/system/zapp_*.service
 * Called from /zpanel/bin/zapp-watcher.sh
 */
export const AppServiceModified = async (req: Request, resp: Response) => {
  console.log("AppServiceModified called", req.body);
}

export const buildZuzApp = async (serviceName: string) : Promise<ZuzApp | null> => {
  // Extract app name: zapp_frontend-ts.service → frontend-ts
  const appId = serviceName.replace(/^zapp_/, '').replace(/\.service$/, '');

  // Read service file to get WorkingDirectory (deploy root)
  const servicePath = `/etc/systemd/system/${serviceName}`;
  const serviceContent = fs.readFileSync(servicePath, 'utf8');

  const workingDirMatch = serviceContent.match(/^WorkingDirectory=(.+)$/m);
  const workingDir = workingDirMatch ? workingDirMatch[1] : null;

  // Optional: Read package.json for name, version
  let packageInfo : ZuzAppPackage | null = null;
  if (workingDir && fs.existsSync(`${workingDir}/package.json`)) {
      try {
          const pkg = JSON.parse(fs.readFileSync(`${workingDir}/package.json`, 'utf8'));
          packageInfo = {
              name: pkg.name || appId,
              version: pkg.version || 'unknown',
              description: pkg.description || '',
              isNextJs: (pkg.dependencies && pkg.dependencies.next) || (pkg.devDependencies && pkg.devDependencies.next) ? true : false
          };
      } catch {}
  }

  // Check status
  const isRunning = await isServiceActive(serviceName);

  return {
      id: Encode(serviceName),
      service: serviceName,
      pkg: packageInfo,
      path: workingDir ?? '-',
      url: isRunning && workingDir ? await inferAppUrl(workingDir) : null, // optional: scan for port in code
      status: isRunning ? ZuzAppStatus.Running : ZuzAppStatus.Stopped
  };
}

export const loadZuzApps = async (force = false) : Promise<ZuzApp[]> => {

  if ( !force ){
    const _apps =  cache.apps.getAll()
    if ( _apps.length > 0 ){
      return _apps;
    }
  }
    
  const services = execSync(
      `systemctl list-unit-files --type=service | grep '^zapp_' | awk '{print $1}'`,
      { encoding: 'utf8' }
      ).trim().split('\n').filter(Boolean);

  
  const apps = await Promise.all(

      services.map( async (serviceName : string) => {

          const _zapp = await buildZuzApp(serviceName);

          cache.apps.update(_zapp!);

          return _zapp;

      })
  );

  return apps as ZuzApp[];

}

export const AppList = async (req: Request, resp: Response) => {

  try{
    const apps = await loadZuzApps(false)
    return resp.send({
        kind: `appList`,
        apps
    })
  }
  catch(e){
    return resp.send({
        error: `appsFetchFailed`,
        message: req.lang!.appsFetchFailed
    })
  }

}

export const CreateApp = async (req: Request, resp: Response) => {

  const {
    repo = '',           // GitHub URL (optional)
    isprivate = false,
    name = '',           // App ID / service name
    pem = '',            // SSH private key for private repo
    service = '',        // systemd service name (optional, default to name.service)
    desc = '',
    root = '',           // Working directory / app root path
    usr,
    group,
  } = req.body

  let error : string | null = null

  // ───────────────────────────────────────────────
  // 1. Basic validation
  // ───────────────────────────────────────────────
  if (_(name).isEmpty()) {
    error = req.lang?.appNameIsRequired || 'App name is required';
  } else if (_(root).isEmpty()) {
    error = req.lang?.appRootIsRequired || 'Root directory is required';
  }

  // ───────────────────────────────────────────────
  // 2. Validate root path
  // ───────────────────────────────────────────────
  let stat;
  try {
    stat = fs.statSync(root);
    if (!stat.isDirectory()) {
      error = req.lang?.appRootPathIsNotADirectory || 'Root path is not a directory';
    }
  } catch (err: any) {
    error = `Root path does not exist or is inaccessible: ${err.message}`;
  }

  // ───────────────────────────────────────────────
  // 3. Conflict check: cloning into non-empty directory
  // ───────────────────────────────────────────────
  if ( 
    _(repo).isEmpty()
  ) {
    if ( !fs.existsSync(path.join(root, 'package.json')) ){
      error = req.lang?.appRootForExistingAppIsNotValid || 'Root directory must contain a package.json when no repository is provided';
    }
  } 
  else {
    const gitUri = isGitHubUrl(repo);
    if (!gitUri.valid) {
      error = req.lang?.appRepoUrlInvalid || 'Invalid GitHub repository URL';
    }
    else if ( fs.existsSync(path.join(root, 'package.json')) ) {
      error = req.lang?.appRootForRepoIsNotEmpty || 'Cannot clone into directory that already contains package.json';
    }

  }

  if ( error ){
    return resp.send({
      error: `appError`,
      message: error
    })
  }

  // ───────────────────────────────────────────────
  // 4. Normalize service name
  // ───────────────────────────────────────────────
  const appName = name.trim().replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const appId = `zapp_${appName}`;
  const serviceName = service || `${appId}.service`;
  const serviceFilePathTmp = `/tmp/${serviceName}`;
  const serviceFilePath = `/etc/systemd/system/${serviceName}`;

  
  // Prevent overwriting existing service
  if (fs.existsSync(serviceFilePath)) {
    return resp.json({
      error: 'appError',
      message: `Service ${serviceName} already exists`,
    });
  }

  // ───────────────────────────────────────────────
  // 5. No Repo Provided: Scan existing app
  // ───────────────────────────────────────────────
  if (
    _(repo).isEmpty()
  ) {

    // Install dependencies
    if ( !fs.existsSync(path.join(root, 'node_modules')) ){
      execSync(`cd "${root}" && pnpm install --production`, { stdio: 'pipe' });
    }

  }

  // ───────────────────────────────────────────────
  // 6. Handle Git clone (if repo provided)
  // ───────────────────────────────────────────────
  else{
    try {
      
      await clone(
        repo,
        root,
        appName
      )

      // Install dependencies
      execSync(`cd "${path.join(root, appName)}" && pnpm install --production`, { stdio: 'pipe' });

    } catch (err: any) {

      return resp.json({
        error: 'gitCloneFailed',
        message: `Failed to clone repository: ${err.message}`,
      });

    }
  }

  const realAppPath = _(repo).isEmpty() ? root : path.join(root, appName)
  const appType = getAppTypeFromPackageJson(realAppPath)

  // ───────────────────────────────────────────────
  // Create systemd service
  // ───────────────────────────────────────────────
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
  ].join(`\n`)

  try {

    // Write the file directly as root
    const escapedContent = serviceContent.replace(/'/g, "'\\''");
    execSyncSudo(`bash -c 'echo "${escapedContent}" > "${serviceFilePath}"'`);
    
    execSyncSudo(`chmod 644 "${serviceFilePath}"`);
    execSyncSudo(`chown root:root "${serviceFilePath}"`);
    
  } catch (err: any) {
    return resp.json({
      error: 'serviceCreateFailed',
      message: `Failed to create service file: ${err.message}`,
    });
  }

  // ───────────────────────────────────────────────
  // Reload & start
  // ───────────────────────────────────────────────
  try {

    
    execSyncSudo('systemctl daemon-reload');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    execSyncSudo(`systemctl enable ${serviceName}`);
    execSyncSudo(`systemctl start ${serviceName}`);

  } catch (err: any) {
    return resp.json({
      error: 'serviceStartFailed',
      message: `Failed to start service: ${err.message}`,
    });
  }

  // ───────────────────────────────────────────────
  // Reload registry (cache)
  // ───────────────────────────────────────────────
  await loadZuzApps(true)

  return resp.send({
    kind: `appCreated`,
    message: `App "${appId}" created and started`,
    app: cache.apps.getById(serviceName),
  });


}

/**
 * Update the status of an app.
 * @start | @stop | @restart
 * @param req 
 * @param resp 
 */
export const UpdateAppStatus = async (req: Request, resp: Response) => {

  const { id } = req.body;
  const { splat } = req.params;
  const splatArr: string[] = Array.isArray(splat)
    ? splat
    : typeof splat === "string"
      ? splat.split("/")
      : [];
  const [,, action] = splatArr; // start | stop | restart

  try{

  execSyncSudo(`systemctl ${action} ${Decode(id)}`);

  return resp.send({
    kind: `app${_(action).ucfirst()._}ed`,
    message: `App ${action}ed successfully`,
  })

  }
  catch(e: any){
    return resp.send({
      error: `app${_(action).ucfirst()._}Failed`,
      message: `Failed to ${action} app: ${e.message}`,
    })
  }

}

/**
 * Check for updates in the apps by pulling latest from git repos.
 * @param req 
 * @param resp 
 */
export const CheckForUpdate = async (req: Request, resp: Response) => {

  console.log(req.body)

}