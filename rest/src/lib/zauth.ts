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

}