import type { Response, NextFunction } from 'express'
import {
  APIError,
  logger,
  TOKEN_COOKIE_NAME,
  EXPIRY_COOKIE_NAME
} from '@p0/common'
import type { RequestExt } from '../core/index.ts'

export default (err, req_: RequestExt, res: Response, next_: NextFunction): void => {
  const apiError = err instanceof APIError ? err : new APIError(err)
  logger.error('Error:', apiError.plainObject())

  if (apiError.code === 401 || apiError.code === 403) {
    res
      .clearCookie(TOKEN_COOKIE_NAME)
      .clearCookie(EXPIRY_COOKIE_NAME)
  } else if (apiError.code >= 500) {
    apiError.message = 'Application error'
  } else {
    apiError.message = 'Request error'
  }

  res
    .status(apiError.code)
    .json(apiError.plainObject({ message: true, stack: false }))
}


