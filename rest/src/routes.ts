import { dynamic } from "@zuzjs/core";
import { Request, Response } from "express";
import { 
    SaveWebPushToken, 
    Signin, 
    Signout,
    listLinuxUsers,
    listLinuxGroups
} from "@/app/user";
import { 
    AppList, 
    AppServiceModified, 
    AppServiceStatusSwitched, 
    // CheckForUpdate,
    CreateApp,
    DeployGitBranch,
    ListGitBranches,
    ListGitCommits,
    UpdateAppSettings,
    // UpdateAppStatus,
} from "@/app/apps";
import { 
    CreateEmptyFile,
    CreateFolder,
    ListFilesAndFolders 
} from "@/app/fm";
import { clone } from "@/app/git";
import { 
    LoadFileContent, 
    GetServerList, 
    SaveVirtualHost 
} from "@/app/nginx";
import { GitHubBranch } from "@/app/apps/github-manager";
import apm  from "@/app/apps/app-manager"
import cache from "@/cache";
import { log } from "@/lib";
import { APP_NAME } from "./config";

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
            }
        },

        Apps: {

            private: {

                List: AppList,
                // CheckForUpdate,
                Create: CreateApp,
                UpdateAppSettings,
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