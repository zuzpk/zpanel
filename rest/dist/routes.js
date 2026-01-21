"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("./app/user");
const apps_1 = require("./app/apps");
const fm_1 = require("./app/fm");
const nginx_1 = require("./app/nginx");
const Routes = {
    Get: {
        Ping: (req, resp) => resp.json({ kind: "pong" }),
        Auth: (req, resp) => resp.json(req.session.loggedIn ?
            {
                kind: "authSuccess",
                user: {
                    ID: 1,
                    nm: req.session.sender,
                    ir: req.session.isRoot
                },
            }
            : {
                error: `oauth`
            }),
    },
    Post: {
        A: {
            private: {
                Signout: user_1.Signout
            },
            Login: user_1.Signin,
            PushOauth: user_1.SaveWebPushToken,
        },
        Fm: {
            private: {
                Ls: fm_1.ListFilesAndFolders,
                NewFile: fm_1.CreateFnF,
            }
        },
        Users: {
            private: {
                Ls: user_1.listLinuxUsers,
                Groups: user_1.listLinuxGroups,
            }
        },
        Apps: {
            private: {
                List: apps_1.AppList,
                CheckForUpdate: apps_1.CheckForUpdate,
                Create: apps_1.CreateApp,
                Start: apps_1.UpdateAppStatus,
                Stop: apps_1.UpdateAppStatus,
                Restart: apps_1.UpdateAppStatus,
            },
            internal: {
                AppServiceStatusSwitched: apps_1.AppServiceStatusSwitched,
                AppServiceModified: apps_1.AppServiceModified,
            }
        },
        Nginx: {
            private: {
                Ls: nginx_1.GetServerList,
                LoadFile: nginx_1.LoadFileContent
            }
        }
    }
};
exports.default = Routes;
