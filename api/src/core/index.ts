import { config } from './config.js'
import { APIError, logger } from '@p0/common'

import type { RequestExt, APIResponse, Context } from './types.js'
import type { Keyed } from '@p0/common'
import type { User } from '@p0/dal'


export { jwt } from './jwt.js'
export { config }

export type {
  Context,
  RequestExt,
  APIResponse,
  RouteHandler,
} from './types.js'

//  ---------------------------------

export const decorateResponse = (data: Keyed, req: RequestExt, code = 200): APIResponse => {
  return {
    code,
    meta: {
      createdAt: new Date(),
      apiVersion: config.api || '[unset]',
      url: `${req.protocol}://${req.hostname}:${config.port}${req.originalUrl}`,
      time: req?.ctx?.time ? Date.now() - <number>req.ctx.time : 0
    },
    // inject data
    ...data
  }
}

export const ensureUser = (ctx?: Context): User.DBRecord => {
  const currUser = ctx?.user
  if (!currUser) {
    // rather impossible
    logger.error(`ACCESS VIOLATION: user not logged in, session ${ctx?.sessionId}`)
    throw new APIError(403)
  }
  return currUser
}
