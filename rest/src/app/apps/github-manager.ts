import { dynamic, time, withGet } from "@zuzjs/core"
import { execSyncSudo, log } from "@/lib"
import { APP_NAME } from "@/config"
import jwt from 'jsonwebtoken';

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

    

}

export default new GitHubService();