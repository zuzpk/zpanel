import { ADMIN_EMAIL, APP_NAME, APP_URL, SESS_COOKIE_SETTING, SESS_COOKIE_SETTING_HTTP, SESS_DURATION, SESS_KEYS, SESS_PREFIX } from "@/config"
import { Decode, Encode, fromHash, headers, Logger, sendMail, sendPush, toHash, withoutSeperator, withSeperator } from "@/lib"
import { User, UserStatus, UserType, LinuxUser, LinuxGroup } from "@/lib/types"
import zorm, { PushTokens, Users, UsersSess } from "@/zorm"
import { _, dynamic, MD5, numberInRange } from "@zuzjs/core"
import de from "dotenv"
import { Request, Response } from "express"
import fs from "node:fs"
import { execSync, execFileSync } from 'child_process';
import { BASH_ROOT } from "../config"

de.config()

export const uname = (u: Users) : string => u.fullname == `none` ? u.fullname.split(process.env.SEPERATOR!)[0]! : u.fullname || `Guest`

export const youser = async ( u: Users, cc?: string ) : Promise<User> => {
    
    const [ country, stamp ] = withoutSeperator(u.signin)

    return {
        ID: toHash(u.ID),
        utp: u.utype as unknown as UserType,
        name: uname(u),
        email: u.email.trim(),
        cc: cc || country,
        status: u.status as UserStatus
    }

}

export const getLinuxUsers = (): LinuxUser[] => {
  try {
    
    const passwdContent = fs.readFileSync('/etc/passwd', 'utf8');
    const lines = passwdContent.trim().split('\n');

    // Read /etc/group to map GIDs to group names
    const groupMap = new Map<number, string>();
    const groupContent = fs.readFileSync('/etc/group', 'utf8');
    groupContent.trim().split('\n').forEach(line => {
      const [name, , gid] = line.split(':');
      if (gid) groupMap.set(Number(gid), name ?? `-`);
    });

    // Read /etc/shadow (needs root) to check if password is set
    let shadowLines: string[] = [];
    try {
      shadowLines = fs.readFileSync('/etc/shadow', 'utf8').trim().split('\n');
    } catch (e) {
      console.warn('Cannot read /etc/shadow (run as root for hasPassword info)');
    }

    const shadowMap = new Map<string, boolean>();
    shadowLines.forEach(line => {
      const [username, passwordHash] = line.split(':');
      // ! or !! or empty means no password / locked
      const hasPassword = !!passwordHash && passwordHash !== '!' && passwordHash !== '!!' && passwordHash !== '*';
      shadowMap.set(username ?? `-`, hasPassword);
    });

    // Parse users
    const users: LinuxUser[] = lines
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => {
        const [username, , uidStr, gidStr, gecos, home, shell] = line.split(':');

        const uid = Number(uidStr);
        const gid = Number(gidStr);

        // Primary group name
        const primaryGroup = groupMap.get(gid) || `gid${gid}`;

        // All groups (primary + secondary)
        let groups: string[] = [primaryGroup];
        try {
          const groupOutput = execSync(`groups ${username}`, { encoding: 'utf8' }).trim();
          groups = groupOutput.split(' ');
        } catch {}

        // Full name from GECOS (usually first field)
        const fullName = gecos?.split(',')[0] || undefined;

        // System user? (common convention: UID < 1000 or 100)
        const isSystemUser = uid < 1000;

        // Last login (optional - requires lastlog command)
        let lastLogin: string | undefined;
        try {
          const lastlog = execSync(`lastlog -u ${username}`, { encoding: 'utf8' }).trim();
          const match = lastlog.match(/(\w+\s+\d+\s+\d+:\d+:\d+\s+[\d-]+)/);
          if (match) lastLogin = match[1];
        } catch {}

        // Has password set?
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
      .filter(user => user.username && user.username.trim() !== ''); // skip empty lines

    return users;
  } catch (err) {
    console.error('Failed to list users:', err);
    throw new Error(`Cannot read user information: ${err instanceof Error ? err.message : String(err)}`);
  }
};

/**
 * Extracts all unique group names from the groups field of all users
 * Useful when you already have user list and want groups without reading /etc/group
 */
export const extractUniqueGroupsFromUsers = (users: LinuxUser[]): string[] => {

  const groupSet = new Set<string>();

  users.forEach(user => {
    user.groups.forEach((group:string) => {
      if (group && group.trim()) {
        groupSet.add(group.trim());
      }
    });
  });

  return Array.from(groupSet).sort(); // alphabetical order
};

export const getLinuxGroups = (): LinuxGroup[] => {
  try {
    const content = fs.readFileSync('/etc/group', 'utf8');
    const lines = content.trim().split('\n');

    return lines
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => {
        const [name, , gidStr, membersStr = ''] = line.split(':');
        const gid = Number(gidStr);
        const members = membersStr.split(',').filter(Boolean);

        return {
          name: name ?? '-', // Ensure name is always a string
          gid,
          members,
          isSystemGroup: gid < 1000, // common convention (adjust if needed)
        };
      })
      .sort((a: dynamic, b: dynamic) => b.name - a.name); // alphabetical sort
  } catch (err) {
    console.error('Failed to read /etc/group:', err);
    throw new Error(`Cannot list groups: ${err instanceof Error ? err.message : String(err)}`);
  }
};

export const Signin = async (req: Request, resp: Response) => {

    const { userAgent, cfIpcountry : country } = headers(req)
    
    const { usr: username, psw: password } = req.body

    if ( !username || _(username).isEmpty() || !password || _(password).isEmpty() ){
        return resp.send({
            error: `invalidData`,
            message: req.lang!.emailPassRequired
        })
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return resp.send({ 
            error: `invalidUser`, 
            message: 'Invalid username' 
        });
    }

    try {
        // This will throw if auth fails
        execFileSync(`${BASH_ROOT}auth`, [username, password], {
            timeout: 5000,           // Prevent hanging
            stdio: 'ignore'          // Don't leak output
        });

        // Success → create session
        req.session.loggedIn = true
        req.session.sender = username;
        req.session.isRoot = (username === 'root');

        return resp.send({ 
            kind: `oauth`, 
            message: `Redirecting...`,
            user: {
                ID: 1,
                nm: req.session.sender,
                ir:  req.session.isRoot
            },
        });

    } catch (err) {
        console.log(`Login failed: ${username}`, err);
        return resp.send({ error: 'invalidCredentials', message: 'Invalid username or password' });
    }
        
    // const user = await zorm.find(Users).where({ email: em.trim().toLowerCase() })
    // if ( !user.hasRows ){
    //     return resp.send({
    //         error: `invalidEmail`,
    //         message: req.lang!.unknownEmail
    //     })
    // }

    // const u = user.row!

    // if ( u.password != Encode(psw) ){   
    //     return resp.send({
    //         error : 'invalidPassword',
    //         message : req.lang!.wrongPassword
    //     })
    // }
    
    // if ( u.status == -1 ){
    //     return resp.send({
    //         error: `accountBanned`,
    //         message: _(req.lang!.youAreBanned).formatString( APP_NAME )
    //     })
    // }
    
    // const geo = withSeperator( country, Date.now() )

    // return zorm.update(Users)
    //     .with({ signin: geo })
    //     .where({ ID: u.ID })
    //     .then(async (result) => {
    //         const { ID, email, password } = result.record as Users
    //         const session = await zorm.create(UsersSess).with({
    //             uid: ID,
    //             token: Encode(withSeperator(ID, email, password, Date.now())),
    //             expiry: String(Date.now() + SESS_COOKIE_SETTING.maxAge!),
    //             uinfo: geo
    //         })
    //         const _you = await youser(result.record as Users, country)
    //         resp.cookie(SESS_KEYS.ID, toHash(result.record!.ID), SESS_COOKIE_SETTING)
    //         resp.cookie(SESS_PREFIX + SESS_KEYS.ID, toHash(result.record!.ID), SESS_COOKIE_SETTING_HTTP)
    //         resp.cookie(SESS_PREFIX + SESS_KEYS.Data, _you, SESS_COOKIE_SETTING_HTTP)
    //         resp.cookie(SESS_PREFIX + SESS_KEYS.Fingerprint, toHash(result.record!.ID), SESS_COOKIE_SETTING_HTTP)
    //         resp.cookie(SESS_PREFIX + SESS_KEYS.Session, toHash(session.id!), SESS_COOKIE_SETTING_HTTP)
    //         resp.cookie(SESS_PREFIX + SESS_KEYS.Token, jwt.sign(
    //             {
    //                 em: result.record!.email.trim(),
    //                 cc: country,
    //                 ts: Date.now()
    //             }, 
    //             process.env.ENCRYPTION_KEY!,
    //             {
    //                 audience: APP_NAME.replace(/\s+/g, `-`).toLowerCase(),
    //                 issuer: APP_NAME,
    //                 expiresIn: Date.now() + SESS_DURATION
    //             }
    //         ), SESS_COOKIE_SETTING_HTTP)

    //         return resp.send({
    //             kind: `oauth`,
    //             u: _you
    //         })

    //     })
    //     .catch((err) => {
    //         Logger.error(`[signinErrored]`, err)
    //         return resp.send({
    //             error: `oauth`,
    //             message: req.lang!.signinFailed
    //         })
    //     })

}

export const removeAuthCookies = (resp: Response) : Response => {

    const _n = { ...SESS_COOKIE_SETTING }
    const _v = { ...SESS_COOKIE_SETTING_HTTP }
    delete _n.maxAge
    delete _v.maxAge

    resp.clearCookie(SESS_KEYS.ID, _n)
    Object.keys(SESS_KEYS).forEach((k) => {
        resp.clearCookie(SESS_PREFIX + SESS_KEYS[k], _v)
    })

    return resp
}

export const Signout = async (req: Request, resp: Response) => {

    const session = await zorm.delete(UsersSess).where({ ID: req.sessionID! })

    if ( session.deleted ){

        const _n = { ...SESS_COOKIE_SETTING }
        const _v = { ...SESS_COOKIE_SETTING_HTTP }
        delete _n.maxAge
        delete _v.maxAge

        resp.clearCookie(SESS_KEYS.ID, _n)
        Object.keys(SESS_KEYS).forEach((k) => {
            resp.clearCookie(SESS_PREFIX + SESS_KEYS[k], _v)
        })

        return resp.send({
            kind: `signoutSuccess`,
            message: req.lang!.signoutSuccess
        })

    }

    return resp.send({
        error: `signoutFailed`,
        message: req.lang!.signoutFailed
    })

}

export const RemoveWebPushToken = async (endpoint: string) => {

    await zorm.delete(PushTokens)
        .where({ endpoint })
        .catch((err: any) => console.log(`[RemoveWebPushToken Failed]`, err))
}

export const SaveWebPushToken = async (req: Request, resp: Response) : Promise<any> => {

    const { userAgent, cfIpcountry : country } = headers(req)
    const { token, em } = req.body

    if ( !em || _(em).isEmpty() || !_(em).isEmail() ){
        return resp.send({
            error: `invalidData`,
            message: req.lang!.invalidEmail
        })
    }

    else{

        const u = await zorm.find(Users).where({ email: em.trim() })
        let uid = 0
        let uname = ``
        if ( u.hasRows ){
            uname = u.row.fullname
            uid = u.row.ID;
        }
        else{

            const geo = withSeperator( country, Date.now() )
            const ucode = numberInRange(111111, 999999)
            const utoken = toHash(ucode);
            const password = Encode(`p12345678`)

            let reff = 0
            if ( `__urf` in req.body ){
                reff = fromHash(req.body.__urf) || 0
            }

            const [ name, tld ] = em.toLowerCase().trim().split(`@`)
            uname = name
            const user = await zorm
                .create(Users)
                .with({
                    token: utoken, 
                    ucode: String(ucode),
                    email: em,
                    password,
                    fullname: withSeperator(name.trim()),
                    reff,
                    joined: geo,
                    signin: geo
                })

            if ( user.created ){
                uid = user.id!
            }
        }

        if ( uid == 0 ){
            return resp.send({
                error: `emailFailed`,
                message: `We are unable to register your email. Try again!`
            })
        }

        const hash = MD5(JSON.stringify(token))
        const exist = await zorm.find(PushTokens)
        .where({ uid, hash })
        
        if ( !exist.hasRows ){

            await zorm.create(PushTokens)
            .with({
                uid,
                hash,
                endpoint: token.endpoint,
                p256dh: token.keys.p256dh,
                auth: token.keys.auth,
                stamp: String(Date.now()),
                status: 1
            })

            // console.log(`[WebPushSaveResult]`, save)
        }

        sendPush(
            token,
            {
                title: _(req.lang!.webPushWelcomeTitle).formatString(uname, APP_NAME)._,
                message: req.lang!.webPushWelcomeMessage!,
            }
        )

        resp.send({
            kind: `pushSubscribed`,
            message: `Good Job! That was easy :)`
        })

    }
}

/** List All Linux Users */
export const listLinuxUsers = async (req: Request, resp: Response) : Promise<any> => {
    const users = getLinuxUsers()
    return resp.send({
        kind: `userList`,
        users,
        groups: extractUniqueGroupsFromUsers(users)
    })
}

/** List All Linux Groups */
export const listLinuxGroups = async (req: Request, resp: Response) : Promise<any> => {
    return resp.send({
        kind: `groupList`,
        users: getLinuxGroups()
    })
}
