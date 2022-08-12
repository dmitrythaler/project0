import type { /* Request,  */Response, NextFunction } from 'express'
import { APIError/* , logger */ } from '@p0/common'
import { jwt } from '../core/index.js'
import type { Context, RequestExt } from '../core/index.js'

export default function (req: RequestExt, res: Response, next: NextFunction): void {

  //  retrieve token
  const token = req.cookies?.token
  if (!token) {
    return next(new APIError(401))
  }

  try {
    //  verify and update token if needed
    const { token: maybeNewToken, payload } = jwt.verifyAndMaybeRefresh(token)

    //  extend the request with the user data
    req.ctx = {
      ...req.ctx,
      user: payload.user as Context["user"],
      sessionId: payload.jti
    }

    if (token !== maybeNewToken) {
      //  token updated
      const maxAge = jwt.getExpSec() * 1000
      res
        .cookie('token', maybeNewToken, {
          maxAge,
          httpOnly: true
          // secure: process.env.NODE_ENV === "production",
        })
        .cookie('exp', maxAge + Date.now(), {
          maxAge,
          httpOnly: false
          // secure: process.env.NODE_ENV === "production",
        })
    }
  } catch (e) {
    return next(new APIError(401, (e as Error).toString()))
  }

  next()
}
