import { Request, Response } from "express";
import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

const gitOptions : Partial<SimpleGitOptions> = {
    maxConcurrentProcesses: 6,
    binary: 'git',
    trimmed: false
}

export const clone = async (
    repoUri: string,
    baseDir: string,
    name?: string,
    branch?: string,
    sshKeyPath?: string,
    depth? : number,
) => {

    const git = simpleGit({
        baseDir,
        ...gitOptions
    });

    if (sshKeyPath) {
        git.env('GIT_SSH_COMMAND', `ssh -i ${sshKeyPath} -o StrictHostKeyChecking=no`);
    }

    return git.clone(
        repoUri, 
        name ?? `.`, 
        [ 
            `--depth=${depth ?? 1}`,
            `--branch=${branch ?? `main`}`,
            `--single-branch`
        ]
    )

}

export const CheckForUpdate = async (req: Request, resp: Response) => {

    // const git = simpleGit({
    //     baseDir: '/path/to/your/repo',
    //     binary: 'git',
    //     maxConcurrentProcesses: 6,
    //     trimmed: false
    // });

}