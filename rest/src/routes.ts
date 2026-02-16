import {
    AppList,
    AppServiceModified,
    AppServiceStatusSwitched,
    ChangeAppMode,
    // CheckForUpdate,
    CreateApp,
    DeployGitBranch,
    ListGitBranches,
    ListGitCommits,
    PushGitBranch,
    UpdateAppSettings,
} from "@/app/apps";
import {
    CreateEmptyFile,
    CreateFolder,
    ListFilesAndFolders
} from "@/app/fm";
import {
    GetServerList,
    LoadFileContent,
    SaveVirtualHost
} from "@/app/nginx";
import {
    SaveWebPushToken,
    Signin,
    Signout,
    listLinuxGroups,
    listLinuxUsers
} from "@/app/user";
import { dynamic } from "@zuzjs/core";
import { Request, Response } from "express";

const Routes : dynamic = {
    WebSocket: {
        private: ['/ws', '/ws/terminal'],
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
        Test: async (req: Request, resp: Response) => {
            return resp.json({
                kind: `Ping`
            })
        }
    },
    Post: {
        A: {
            /** Authenticated routes */
            private: {
                Signout
            },
            Login: Signin,
            PushOauth: SaveWebPushToken,
        },
        Fm: {
            private: {
                Ls: ListFilesAndFolders,
                NewFile: CreateEmptyFile,
                NewFolder: CreateFolder,
            }
        },
        Users: {
            private: {
                Ls: listLinuxUsers,
                Groups: listLinuxGroups,
            }
        },

        Git: {
            private: {
                Commits: ListGitCommits,
                Branches: ListGitBranches,
                Deploy: DeployGitBranch,
                Push: PushGitBranch,
            }
        },

        Apps: {

            private: {

                List: AppList,
                // CheckForUpdate,
                Create: CreateApp,
                UpdateAppSettings,
                Switch: ChangeAppMode
                // Start: UpdateAppStatus,
                // Stop: UpdateAppStatus,
                // Restart: UpdateAppStatus,
                
            },

            //Can Be called from internal scripts
            internal: {
                /**
                 * When a service is started/stopped/restarted, call this to refresh the app list.
                 * /etc/systemd/system/zapp_*.service
                 * Called from /zpanel/bin/zapp-notify.sh
                 */
                AppServiceStatusSwitched,
                /**
                 * When a service is started/stopped/restarted, call this to refresh the app list.
                 * /etc/systemd/system/zapp_*.service
                 * Called from /zpanel/bin/zapp-watcher.sh
                 */
                AppServiceModified,
            }
        },
        Nginx: {
            private: {
                Ls: GetServerList,
                LoadFile: LoadFileContent,
                SaveVirtualHost
            }
        }
    }
}

export default Routes