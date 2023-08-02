import type { /* Request,  */Response, NextFunction } from 'express'
import {
  APIError,
  TOKEN_COOKIE_NAME,
  EXPIRY_COOKIE_NAME,
  // logger,
} from '@p0/common'
import { jwt } from '../core/index.ts'
import type { Context, RequestExt } from '../core/index.ts'

export default function (req: RequestExt, res: Response, next: NextFunction): void {

  //  retrieve tokens
  if (!req.cookies) {
    return next(new APIError(401))
  }
  const token: string|undefined = req.cookies[TOKEN_COOKIE_NAME]
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
        .cookie(TOKEN_COOKIE_NAME, maybeNewToken, {
          maxAge,
          httpOnly: true
        })
        .cookie(EXPIRY_COOKIE_NAME, maxAge + Date.now(), {
          maxAge,
          httpOnly: false
        })
    }
  } catch (e) {
    return next(new APIError(401, (e as Error).toString()))
  }

  next()
}
