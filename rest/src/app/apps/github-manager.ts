import { APP_NAME } from "@/config";
import { execSyncSudo, log } from "@/lib";
import { LOG_SYMBOLS } from "@/lib/logger";
import { dynamic, time, withGet } from "@zuzjs/core";
import jwt from 'jsonwebtoken';
import path from "node:path";

export interface GitHubCommit {
    sha: string;
    message: string;
    author: string;
    date: string;
    url: string;
}

export interface GitHubCommitResponse {
    sha: string;
    commit: {
        message: string;
        author: {
            name: string;
            date: string;
        }
    };
    html_url: string;
}

export interface GitHubBranchResponse {
    name: string;
    commit: {
        sha: string,
        url: string,
    },
    protected: boolean;
}

export interface GitHubBranch {
    name: string;
    sha: string;
    lastUpdate: number;
    isProtected: boolean;
}

class GitHubService {

    public validatePath(appDir: string) {
        const forbiddenPaths = [
            '/zpanel',
            '/etc',
            '/root',
            `/var`
        ];

        // Resolve the absolute path to prevent "../" bypasses
        const absolutePath = path.resolve(appDir);

        for (const forbidden of forbiddenPaths) {
            if (absolutePath === forbidden || absolutePath.startsWith(`${forbidden}/`)) {
                throw new Error(`SECURITY ALERT: Attempted to run command on protected directory: ${forbidden}`);
            }
        }
    }

    public cmd(cmd: string, appDir: string) { 
        this.validatePath(appDir);
        return `sudo git -C "${appDir}" ${cmd}`; 
    }

    /**
     * Parses a git URL to extract "owner/repo"
     * Supports: https://github.com/owner/repo.git or https://github.com/owner/repo
     */
    private parseRepo(url: string): { owner: string; repo: string } {
        const parts = url.replace('.git', '').split('/');
        return {
            repo: parts.pop() || '',
            owner: parts.pop() || ''
        };
    }

    public getAccessToken = async (
        githubAppId: string,
        githubInstallationId: string,
        privateKey: string
    ) : Promise<string | null> => {

        const now = Math.floor(Date.now() / 1000);
        const payload = {
            iat: now,
            exp: now + (10 * 60),
            iss: githubAppId
        };
        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

        try{ 

            const get = await fetch(
                `https://api.github.com/app/installations/${githubInstallationId}/access_tokens`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/vnd.github.v3+json'
                    },
                })

            const response: dynamic = await get.json() as dynamic;

            if ( response.status == `404` ){
                const res = await fetch('https://api.github.com/app/installations', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/vnd.github.v3+json',
                        'X-GitHub-Api-Version': '2022-11-28' // recommended in 2026
                    }
                });

                console.log(response.message)
                console.log(`AvailableInstallations`, await res.json())
                
                return null
            }

            return response.token;

        }catch(err){
            console.error('Error fetching GitHub token:', err);
            return null
        }

    }


    private getHeaders(token?: string) {
        return {
            'Accept': 'application/vnd.github.v3+json',
            ...(token ? { 'Authorization': `token ${token}` } : {})
        };
    }

    public async getBranches(
        gitUrl: string, 
        token?: string
    ): Promise<GitHubBranch[]> {
        
        const { owner, repo } = this.parseRepo(gitUrl);
        
        try{
            const branches : GitHubBranchResponse[] = await withGet<GitHubBranchResponse[]>(
                `https://api.github.com/repos/${owner}/${repo}/branches`,
                60, 
                true,
                this.getHeaders(token)
            )

            const list = await Promise.all(branches.map(async (branch) => {
                // We can get the commit date from the branch's latest commit without fetching the whole history
                // Use your cache helper (withGet) here too
                const commitInfo = await withGet<any>(branch.commit.url, 60, true, this.getHeaders(token));
                
                return {
                    name: branch.name,
                    sha: commitInfo.sha,
                    lastUpdate: new Date(commitInfo.commit.author.date).getTime(),
                    isProtected: branch.protected,
                };
            }));

            return list.sort((a, b) => b.lastUpdate - a.lastUpdate);

        }catch(error){
            log.error(APP_NAME, `GitHubService.getBranchesError`, error);
            return [];      
        }

    }

    public async getCommits(gitUrl: string, branch = 'main', token?: string): Promise<GitHubCommit[]> {

        try{
            const { owner, repo } = this.parseRepo(gitUrl);
            const commits : GitHubCommitResponse[] = await withGet<GitHubCommitResponse[]>(
                `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}`,
                60,
                true,
                this.getHeaders(token)
            )
        
            return commits.map(c => ({
                sha: c.sha,
                message: c.commit.message,
                author: c.commit.author.name,
                date: time(new Date(c.commit.author.date).getTime(), `llll`),
                url: c.html_url
            }))

        }catch(error){
            log.error(APP_NAME, `GitHubService.getCommitsError`, error);
            return [];      
        }

    }

    public isGitInitialized(dirPath: string): boolean{
        try {
            // We use -C to run the command as if we were inside that directory
            execSyncSudo(this.cmd(`rev-parse --is-inside-work-tree`, dirPath));
            return true;
        } catch (error) {
            // Git returns an exit code of 128 if not in a repo, triggering the catch
            return false;
        }
    };

    public initGitSafely(dirPath: string): 'new' | 'old' | 'error' {
        try {
            // Check if this specific folder is the ROOT of a git repo
            // --git-dir looks specifically for the .git folder in the target path
            const gitDir = path.join(dirPath, '.git');
            execSyncSudo(`test -d "${gitDir}"`);
            
            log.info(APP_NAME, `Directory already initialized: ${dirPath}`);
            return 'old';
        } catch (e) {
            // If the folder check fails, it's not a repo root, so init it
            log.warn(APP_NAME, `Initializing new repository in: ${dirPath}`);
            try {
                // Use -C to ensure the command context is correct
                execSyncSudo(this.cmd(`init`, dirPath));
                
                return 'new';
            } catch (initError) {
                log.error(APP_NAME, `Failed to initialize git: ${initError}`);
                return 'error';
            }
        }
    }

    /**
     * Safely commits changes with a fallback message.
     * @param dirPath Project directory
     * @param message Optional custom message
     */
    public async safeCommit(
        dirPath: string, 
        message?: string, 
        ignoreInit : boolean = false
    ): Promise<{
        status: boolean,
        message: string
    }> {
        try {

            if ( ignoreInit == false ){
                // Ensure we are in a git repo
                const gitStatus = this.initGitSafely(dirPath);
                if (gitStatus === 'error') return { status: false, message: `Git not initialized` };
            }

            // Stage all changes
            execSyncSudo(this.cmd(`add .`, dirPath));

            // Check if there is actually anything to commit
            // git diff-index returns 1 if there are changes, 0 if clean
            try {
                execSyncSudo(this.cmd(`diff-index --quiet HEAD --`, dirPath));
                log.info(APP_NAME, `${LOG_SYMBOLS.info} Nothing to commit, working tree clean.`);
                return {
                    status: false,
                    message: `Nothing to commit, working tree clean.`
                }
            } catch {
                // Error means changes were found, proceed to commit
            }

            // Fallback message logic
            const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            const finalMessage = message || `Patch ${timestamp} [PM]`;

            // Commit with escaped message
            // We use double quotes and escape existing quotes to prevent shell injection
            const escapedMsg = finalMessage.replace(/"/g, '\\"');
            execSyncSudo(this.cmd(`commit -m "${escapedMsg}"`, dirPath));

            log.info(APP_NAME, `${LOG_SYMBOLS.success} Changes committed: ${finalMessage}`);
            return {
                status: true,
                message: `Committed`
            }

        } catch (err) {
            log.error(APP_NAME, `${LOG_SYMBOLS.error} Commit failed: ${err}`);
            return {
                status: false,
                message: `Commit failed: ${err}`
            }
        }
    }
    

}

export default new GitHubService();