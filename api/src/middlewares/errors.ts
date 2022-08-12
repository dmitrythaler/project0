import type { Response, NextFunction } from 'express'
import { APIError, logger } from '@p0/common'
import type { RequestExt } from '../core/index.js'

export default (err, req_: RequestExt, res: Response, next_: NextFunction): void => {
  const apiError = err instanceof APIError ? err : new APIError(err)
  logger.error('Error:', apiError.plainObject())

  if (apiError.code === 401 || apiError.code === 403) {
    res.clearCookie('token').clearCookie('exp')
  }

  res
    .status(apiError.code)
    .json(apiError.plainObject({ message: true, stack: false }))
}


