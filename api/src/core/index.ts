import { config } from './config.ts'
import { APIError, logger } from '@p0/common'

import type { RequestExt, APIResponse, Context } from './types.ts'
import type { User } from '@p0/dal'

export { jwt } from './jwt.ts'
export { config }

export type {
  Context,
  RequestExt,
  APIResponse,
  RouteHandler,
} from './types.ts'

//  ---------------------------------

export const decorateResponse = (data: Record<string, unknown>, req: RequestExt, code = 200): APIResponse => {
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

// no use, auth middleware already ensured it ...
export const ensureUser = (ctx?: Context): User.Self => {
  const currUser = ctx?.user
  if (!currUser) {
    // rather impossible
    logger.error(`ACCESS VIOLATION: user not logged in, session ${ctx?.sessionId}`)
    throw new APIError(403)
  }
  return currUser
}
