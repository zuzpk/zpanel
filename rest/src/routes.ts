import { AppList, CreateApp, ListGitBranches, UpdateAppSettings } from "@/app/apps";
import { listLinuxGroups, listLinuxUsers, SaveWebPushToken, Signin, Signout } from "@/app/user";
import { dynamic } from "@zuzjs/core";
import { Request, Response } from "express";

const Routes : dynamic = {
    WebSocket: {
        private: ['/wss'],
        public: []
    },
    Get: {
        Ping: (req: Request, resp: Response) => resp.json({ kind: "pong" }),
        Auth: (req: Request, resp: Response) => resp.json(
            req.session.loggedIn ? 
                { 
                    kind: "authSuccess",
                    user: {
                        ID: 1,
                        nm: req.session.sender,
                        ir:  req.session.isRoot
                    },
                } 
                : { 
                    error: `oauth` 
                }
        ),
    },
    Post: {
        A: {
            /** Authenticated routes */
            private: {
                Signout
            },
            Login: Signin,
            PushOauth: SaveWebPushToken
        },
        Users: {
            private: {
                Ls: listLinuxUsers,
                Groups: listLinuxGroups,
            }
        },
        Git: {
            private: {
                // Commits: ListGitCommits,
                Branches: ListGitBranches,
                // Deploy: DeployGitBranch,
                // Push: PushGitBranch,
            }
        },
        Apps: {

            private: {

                List: AppList,
                Create: CreateApp,
                UpdateAppSettings,

            }

        }


    }
}

export default Routes