import cache from "@/cache";
import { APP_NAME } from "@/config";
import { log } from "@/lib";
import { _ } from "@zuzjs/core";
import { WorkerStatus } from "@zuzjs/pm";
import { Request, Response } from "express";
import apm from "./app-manager";
import github, { GitHubBranch } from "./git-manager";

export const AppList = async (req: Request, resp: Response) => {

  apm.listApps(req.body.id ? req.body.id : `-`)
    .then(apps => resp.send({ 
      kind: `appList`, 
      apps,
    //   users: getLinuxUsers() 
    }))
    .catch(err => resp.send({ error: err.message || `Failed to list apps` }))

}

export const CreateApp = async (req: Request, resp: Response) => {
  const { name, domain } = req.body;

  if ( !name || _(name).isEmpty() ){
    return resp.send({ 
      error: `appNameMissing`,
      message: `App name is required` 
    });
  }

  log.info(APP_NAME, "Creating App", name);

  try{
    const config = await apm.createApp({ name, domain });
    if ( ! config ){
      log.error(APP_NAME, "apm.createApp Failed...");
      return resp.send({ 
        error: `appCreateFailed`,
        message: `App was not created...`
      });
    }
    cache.apps.add( config );
    return resp.send({
      kind: `appCreated`,
      message: `App created successfully`,
      appId: config.id
    })
  }
  catch(err: any){
    log.error(APP_NAME, "Error creating app:", err);
    return resp.send({ 
      error: `appCreateFailed`,
      message: err.message || `Failed to create app` 
    });
  }

}

export const UpdateAppSettings = async (req: Request, resp: Response) => {
  
  const { 
    appId, 
    name, 
    domain,
    repo, 
    isprivate,
    pem,
    installationId,
    gitAppId,
    worker,
    desc,
    root,
    branch,
    commit,
  } = req.body;

  if ( 
    isprivate && 
    (!pem || _(pem).isEmpty() )
  ){
    return resp.send({
      error: `repoUrlMissing`,
      message: `Key is required for private repos.`
    })
  }

  if ( isprivate ){
    await apm.savePemKey(appId, pem)
  }
  
  apm.updateConfig({
    
    id: appId,
    name: name.trim(),
    worker,
    pkg: null,
    domain: domain.trim(),
    description: desc,
    git: {
        url: repo,
        isPrivate: isprivate,
        pem: pem ?? ``,
        branch: branch ?? ``,
        commit: commit ?? ``,
        installationId: installationId ?? ``,
        appId: gitAppId ?? ``,
    },
    port: 0,
    // user: usr,
    // group: usr,
    path: root,
    status: WorkerStatus.Stopped, //Change this from cache
            
  })


  return resp.send({
    kind: `appUpdated`,
    message: `Settings updated.`
  })

}

export const Dashboard = async (req: Request, resp: Response) => {
  
  apm
    .appDashboard(req.body.appId)
    .then(st => {

      if ( st ){
        resp.send({
          kind: `appDashboard`,
          stats: st
        })
      }
      else{
        resp.send({
          error: `appNotFound`,
          message: `That app does not exist...`
        })
      }


    })
    .catch(err => {

      resp.send({
        error: `appNotFound`,
        message: `That app does not exist...`
      })

    })
}



export const ListGitBranches = async (req: Request, resp: Response) => {

    const { appId } = req.body
    const app = cache.apps.getById(appId)

    if ( !app ){
      return resp.send({
        error: `appNotFound`,
        message: `App not found or you don't have permission to access it.`
      })
    }
    if ( _(app.git?.url ?? ``).isEmpty() ){
      return resp.send({
        error: `urlNotFound`,
        message: `You have not added a valid github repo url. Goto settings to add it.`
      })
    }

    const pem = await apm.getPemKey(appId)

    if ( app.git?.isPrivate && !pem ){
      return resp.send({
        error: `pemNotFound`,
        message: `This repo is private but no PEM key found. Please add your PEM key in app settings to load branches and commits.`
      })
    }

    try{


      let accessToken : string | null = null;

      if ( app.git?.isPrivate && pem ){
        accessToken = await github.getAccessToken(
          app.git.appId!, 
          app.git.installationId!, 
          pem
        )
      }

      const branches = await github.getBranches(
        app.git?.url!,
        accessToken || undefined
      )

      
      return resp.send({
        kind: `appCommits`,
        branches
      })

    }
    catch (e: any) {
      log.error(APP_NAME, `ListGitCommitsError`, e)
      return resp.send({
        error: `commitsNotLoaded`,
        message: `Commits are not loaded with error: ${e.message}`
      })
    }

}

export const DeployGitBranch = async (req: Request, resp: Response) => {

  const { appId, branch } = req.body

  const app = cache.apps.getById(appId)

  if ( !app ){
    return resp.send({
      error: `appNotFound`,
      message: `App not found or you don't have permission to access it.`
    })
  }

  const b = branch as GitHubBranch

  return apm.deployBranch(
    app, 
    b.name, 
    str => log.info(appId, str)
  )
  .then(() => {
    log.info(APP_NAME, `Branch deployed successfully`, { appId, branch: b.name })
    return resp.send({
        kind: `branchDeployed`,
        message: `Target branch deployed`
      })
    })
    .catch(() => {
      log.error(APP_NAME, `DeployBranchError`, { appId, branch: b.name })
      return resp.send({
          error: `branchDeployFailed`,
          message: `Failed to deploy target branch`
        })
  })

}


export const PushGitBranch = async (req: Request, resp: Response) => {

  const { 
    appId, 
    //Commit message
    cmsg = ``,
    branch = `main`
  } = req.body

  const app = cache.apps.getById(appId)

  if ( !app ){
    return resp.send({
      error: `appNotFound`,
      message: `App not found or you don't have permission to access it.`
    })
  }

  return apm.pushToBranch(
    app, 
    branch,
    cmsg, 
    str => log.info(appId, str)
  )
  .then(() => {
    log.info(APP_NAME, `Pushed to ${branch} successfully`)
    return resp.send({
        kind: `branchPushed`,
        message: `Pushed to ${branch} successfully`
      })
    })
    .catch(() => {
      log.error(APP_NAME, `PushBranchError`)
      return resp.send({
          error: `branchPushFailed`,
          message: `Failed pushing to target branch`
        })
  })

}
