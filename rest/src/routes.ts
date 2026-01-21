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
    CheckForUpdate,
    CreateApp,
    UpdateAppStatus,
} from "@/app/apps";
import { 
    CreateFnF,
    ListFilesAndFolders 
} from "@/app/fm";
import { clone } from "@/app/git";
import { LoadFileContent, GetServerList } from "@/app/nginx";

const Routes : dynamic = {
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
        // Test: async (req: Request, resp: Response) => {

        //     loadServersFromNginx()

        //     return resp.json({
        //         kind: `testPing`
        //     })
        // }
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
                NewFile: CreateFnF,
            }
        },
        Users: {
            private: {
                Ls: listLinuxUsers,
                Groups: listLinuxGroups,
            }
        },
        Apps: {

            private: {

                List: AppList,
                CheckForUpdate,
                Create: CreateApp,
                
                Start: UpdateAppStatus,
                Stop: UpdateAppStatus,
                Restart: UpdateAppStatus,
                
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
                LoadFile: LoadFileContent
            }
        }
    }
}

export default Routes