"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listLinuxGroups = exports.listLinuxUsers = exports.SaveWebPushToken = exports.RemoveWebPushToken = exports.Signout = exports.removeAuthCookies = exports.Signin = exports.getLinuxGroups = exports.extractUniqueGroupsFromUsers = exports.getLinuxUsers = exports.youser = exports.uname = void 0;
const config_1 = require("../config");
const lib_1 = require("../lib");
const zorm_1 = __importStar(require("../zorm"));
const core_1 = require("@zuzjs/core");
const dotenv_1 = __importDefault(require("dotenv"));
const node_fs_1 = __importDefault(require("node:fs"));
const child_process_1 = require("child_process");
const config_2 = require("../config");
dotenv_1.default.config();
const uname = (u) => u.fullname == `none` ? u.fullname.split(process.env.SEPERATOR)[0] : u.fullname || `Guest`;
exports.uname = uname;
const youser = async (u, cc) => {
    const [country, stamp] = (0, lib_1.withoutSeperator)(u.signin);
    return {
        ID: (0, lib_1.toHash)(u.ID),
        utp: u.utype,
        name: (0, exports.uname)(u),
        email: u.email.trim(),
        cc: cc || country,
        status: u.status
    };
};
exports.youser = youser;
const getLinuxUsers = () => {
    try {
        const passwdContent = node_fs_1.default.readFileSync('/etc/passwd', 'utf8');
        const lines = passwdContent.trim().split('\n');
        const groupMap = new Map();
        const groupContent = node_fs_1.default.readFileSync('/etc/group', 'utf8');
        groupContent.trim().split('\n').forEach(line => {
            const [name, , gid] = line.split(':');
            if (gid)
                groupMap.set(Number(gid), name ?? `-`);
        });
        let shadowLines = [];
        try {
            shadowLines = node_fs_1.default.readFileSync('/etc/shadow', 'utf8').trim().split('\n');
        }
        catch (e) {
            console.warn('Cannot read /etc/shadow (run as root for hasPassword info)');
        }
        const shadowMap = new Map();
        shadowLines.forEach(line => {
            const [username, passwordHash] = line.split(':');
            const hasPassword = !!passwordHash && passwordHash !== '!' && passwordHash !== '!!' && passwordHash !== '*';
            shadowMap.set(username ?? `-`, hasPassword);
        });
        const users = lines
            .filter(line => line.trim() && !line.startsWith('#'))
            .map(line => {
            const [username, , uidStr, gidStr, gecos, home, shell] = line.split(':');
            const uid = Number(uidStr);
            const gid = Number(gidStr);
            const primaryGroup = groupMap.get(gid) || `gid${gid}`;
            let groups = [primaryGroup];
            try {
                const groupOutput = (0, child_process_1.execSync)(`groups ${username}`, { encoding: 'utf8' }).trim();
                groups = groupOutput.split(' ');
            }
            catch { }
            const fullName = gecos?.split(',')[0] || undefined;
            const isSystemUser = uid < 1000;
            let lastLogin;
            try {
                const lastlog = (0, child_process_1.execSync)(`lastlog -u ${username}`, { encoding: 'utf8' }).trim();
                const match = lastlog.match(/(\w+\s+\d+\s+\d+:\d+:\d+\s+[\d-]+)/);
                if (match)
                    lastLogin = match[1];
            }
            catch { }
            const hasPassword = shadowMap.get(username ?? "") ?? false;
            return {
                username: username ?? '',
                uid,
                gid,
                home: home ?? '',
                shell: shell ?? '',
                fullName: fullName ?? '',
                groups: groups ?? [],
                isSystemUser,
                lastLogin: lastLogin ?? '',
                hasPassword,
            };
        })
            .filter(user => user.username && user.username.trim() !== '');
        return users;
    }
    catch (err) {
        console.error('Failed to list users:', err);
        throw new Error(`Cannot read user information: ${err instanceof Error ? err.message : String(err)}`);
    }
};
exports.getLinuxUsers = getLinuxUsers;
const extractUniqueGroupsFromUsers = (users) => {
    const groupSet = new Set();
    users.forEach(user => {
        user.groups.forEach((group) => {
            if (group && group.trim()) {
                groupSet.add(group.trim());
            }
        });
    });
    return Array.from(groupSet).sort();
};
exports.extractUniqueGroupsFromUsers = extractUniqueGroupsFromUsers;
const getLinuxGroups = () => {
    try {
        const content = node_fs_1.default.readFileSync('/etc/group', 'utf8');
        const lines = content.trim().split('\n');
        return lines
            .filter(line => line.trim() && !line.startsWith('#'))
            .map(line => {
            const [name, , gidStr, membersStr = ''] = line.split(':');
            const gid = Number(gidStr);
            const members = membersStr.split(',').filter(Boolean);
            return {
                name: name ?? '-',
                gid,
                members,
                isSystemGroup: gid < 1000,
            };
        })
            .sort((a, b) => b.name - a.name);
    }
    catch (err) {
        console.error('Failed to read /etc/group:', err);
        throw new Error(`Cannot list groups: ${err instanceof Error ? err.message : String(err)}`);
    }
};
exports.getLinuxGroups = getLinuxGroups;
const Signin = async (req, resp) => {
    const { userAgent, cfIpcountry: country } = (0, lib_1.headers)(req);
    const { usr: username, psw: password } = req.body;
    if (!username || (0, core_1._)(username).isEmpty() || !password || (0, core_1._)(password).isEmpty()) {
        return resp.send({
            error: `invalidData`,
            message: req.lang.emailPassRequired
        });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return resp.send({
            error: `invalidUser`,
            message: 'Invalid username'
        });
    }
    try {
        (0, child_process_1.execFileSync)(`${config_2.BASH_ROOT}auth`, [username, password], {
            timeout: 5000,
            stdio: 'ignore'
        });
        req.session.loggedIn = true;
        req.session.sender = username;
        req.session.isRoot = (username === 'root');
        return resp.send({
            kind: `oauth`,
            message: `Redirecting...`,
            user: {
                ID: 1,
                nm: req.session.sender,
                ir: req.session.isRoot
            },
        });
    }
    catch (err) {
        console.log(`Login failed: ${username}`, err);
        return resp.send({ error: 'invalidCredentials', message: 'Invalid username or password' });
    }
};
exports.Signin = Signin;
const removeAuthCookies = (resp) => {
    const _n = { ...config_1.SESS_COOKIE_SETTING };
    const _v = { ...config_1.SESS_COOKIE_SETTING_HTTP };
    delete _n.maxAge;
    delete _v.maxAge;
    resp.clearCookie(config_1.SESS_KEYS.ID, _n);
    Object.keys(config_1.SESS_KEYS).forEach((k) => {
        resp.clearCookie(config_1.SESS_PREFIX + config_1.SESS_KEYS[k], _v);
    });
    return resp;
};
exports.removeAuthCookies = removeAuthCookies;
const Signout = async (req, resp) => {
    const session = await zorm_1.default.delete(zorm_1.UsersSess).where({ ID: req.sessionID });
    if (session.deleted) {
        const _n = { ...config_1.SESS_COOKIE_SETTING };
        const _v = { ...config_1.SESS_COOKIE_SETTING_HTTP };
        delete _n.maxAge;
        delete _v.maxAge;
        resp.clearCookie(config_1.SESS_KEYS.ID, _n);
        Object.keys(config_1.SESS_KEYS).forEach((k) => {
            resp.clearCookie(config_1.SESS_PREFIX + config_1.SESS_KEYS[k], _v);
        });
        return resp.send({
            kind: `signoutSuccess`,
            message: req.lang.signoutSuccess
        });
    }
    return resp.send({
        error: `signoutFailed`,
        message: req.lang.signoutFailed
    });
};
exports.Signout = Signout;
const RemoveWebPushToken = async (endpoint) => {
    await zorm_1.default.delete(zorm_1.PushTokens)
        .where({ endpoint })
        .catch((err) => console.log(`[RemoveWebPushToken Failed]`, err));
};
exports.RemoveWebPushToken = RemoveWebPushToken;
const SaveWebPushToken = async (req, resp) => {
    const { userAgent, cfIpcountry: country } = (0, lib_1.headers)(req);
    const { token, em } = req.body;
    if (!em || (0, core_1._)(em).isEmpty() || !(0, core_1._)(em).isEmail()) {
        return resp.send({
            error: `invalidData`,
            message: req.lang.invalidEmail
        });
    }
    else {
        const u = await zorm_1.default.find(zorm_1.Users).where({ email: em.trim() });
        let uid = 0;
        let uname = ``;
        if (u.hasRows) {
            uname = u.row.fullname;
            uid = u.row.ID;
        }
        else {
            const geo = (0, lib_1.withSeperator)(country, Date.now());
            const ucode = (0, core_1.numberInRange)(111111, 999999);
            const utoken = (0, lib_1.toHash)(ucode);
            const password = (0, lib_1.Encode)(`p12345678`);
            let reff = 0;
            if (`__urf` in req.body) {
                reff = (0, lib_1.fromHash)(req.body.__urf) || 0;
            }
            const [name, tld] = em.toLowerCase().trim().split(`@`);
            uname = name;
            const user = await zorm_1.default
                .create(zorm_1.Users)
                .with({
                token: utoken,
                ucode: String(ucode),
                email: em,
                password,
                fullname: (0, lib_1.withSeperator)(name.trim()),
                reff,
                joined: geo,
                signin: geo
            });
            if (user.created) {
                uid = user.id;
            }
        }
        if (uid == 0) {
            return resp.send({
                error: `emailFailed`,
                message: `We are unable to register your email. Try again!`
            });
        }
        const hash = (0, core_1.MD5)(JSON.stringify(token));
        const exist = await zorm_1.default.find(zorm_1.PushTokens)
            .where({ uid, hash });
        if (!exist.hasRows) {
            await zorm_1.default.create(zorm_1.PushTokens)
                .with({
                uid,
                hash,
                endpoint: token.endpoint,
                p256dh: token.keys.p256dh,
                auth: token.keys.auth,
                stamp: String(Date.now()),
                status: 1
            });
        }
        (0, lib_1.sendPush)(token, {
            title: (0, core_1._)(req.lang.webPushWelcomeTitle).formatString(uname, config_1.APP_NAME)._,
            message: req.lang.webPushWelcomeMessage,
        });
        resp.send({
            kind: `pushSubscribed`,
            message: `Good Job! That was easy :)`
        });
    }
};
exports.SaveWebPushToken = SaveWebPushToken;
const listLinuxUsers = async (req, resp) => {
    const users = (0, exports.getLinuxUsers)();
    return resp.send({
        kind: `userList`,
        users,
        groups: (0, exports.extractUniqueGroupsFromUsers)(users)
    });
};
exports.listLinuxUsers = listLinuxUsers;
const listLinuxGroups = async (req, resp) => {
    return resp.send({
        kind: `groupList`,
        users: (0, exports.getLinuxGroups)()
    });
};
exports.listLinuxGroups = listLinuxGroups;
