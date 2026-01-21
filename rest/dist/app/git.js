"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckForUpdate = exports.clone = void 0;
const simple_git_1 = require("simple-git");
const gitOptions = {
    maxConcurrentProcesses: 6,
    binary: 'git',
    trimmed: false
};
const clone = async (repoUri, baseDir, name, branch, sshKeyPath, depth) => {
    const git = (0, simple_git_1.simpleGit)({
        baseDir,
        ...gitOptions
    });
    if (sshKeyPath) {
        git.env('GIT_SSH_COMMAND', `ssh -i ${sshKeyPath} -o StrictHostKeyChecking=no`);
    }
    return git.clone(repoUri, name ?? `.`, [
        `--depth=${depth ?? 1}`,
        `--branch=${branch ?? `main`}`,
        `--single-branch`
    ]);
};
exports.clone = clone;
const CheckForUpdate = async (req, resp) => {
};
exports.CheckForUpdate = CheckForUpdate;
