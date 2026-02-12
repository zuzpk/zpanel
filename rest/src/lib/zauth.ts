import { removeAuthCookies, youser } from "@/app/user"
import { APP_NAME, SESS_KEYS, SESS_PREFIX } from "@/config"
import { fromHash, headers, withSeperator } from "@/lib/core"
import zorm, { Users, UsersSess } from "@/zorm"
import { _ } from "@zuzjs/core"
import { NextFunction, Request, Response } from "express"

export const withZuzAuth = async (req: Request, res: Response, next: NextFunction) : Promise<any> => {
    
  if ( !req.session.loggedIn ){
    return res.send({
      error: `oauth`,
      stamp: Date.now(),
      message: req.lang!.unauthorized
    })
  }  

  next()
  // const { userAgent, cfIpcountry } = headers(req)
  // const country = cfIpcountry || `unknown`
  // const payload = req.body

  // const _auth : string[] = []
  // const _keys = Object.values(SESS_KEYS).reduce((arr, c) => {
  //   arr.push(c)
  //   return arr
  // }, [] as string[])
  // const _cookies = Object.keys(req.cookies).reduce((arr, c) => {
  //   arr.push(c.replace(SESS_PREFIX, ``))
  //   return arr
  // }, [] as string[])

  // if ( _keys.every((value) => _cookies.includes(value)) ){
    
  //   const uid = fromHash( req.cookies[SESS_PREFIX + SESS_KEYS.ID] )
  //   const sid = fromHash( req.cookies[SESS_PREFIX + SESS_KEYS.Session] )

  //   if ( uid == 0 || sid == 0 ){
  //     return res.send({ error: "oauth", message: "NotAccessible" });
  //   }

  //   const session = await zorm.find(UsersSess).where({ ID: sid, expiry: `>${Date.now()}`, status: 1 })
  //   const user = await zorm.find(Users).where({ ID: uid })

  //   if ( session.hasRows && user.hasRows ){
      
  //     if ( user.row!.status == -1 ){
  //       return res.send({
  //           error: `oauth`,
  //           message: _(req.lang!.youAreBanned).formatString( APP_NAME )
  //       })
  //     }

  //     await zorm.update(Users).where({ ID: uid }).with({ signin: withSeperator( country, Date.now() ) })
      
  //     req.user = await youser(user.row!)
  //     req.sender = user.row!
  //     req.sessionID = sid

  //     next();

  //   }
  //   else{

  //     return removeAuthCookies(res).send({ error: "oauth", message: req.lang!.unauthorized });
  //   }

  // }
  // else return removeAuthCookies(res).send({ error: "oauth", message: req.lang!.accessdenied });

}