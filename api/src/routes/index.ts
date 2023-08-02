import express from 'express'
import { /* logger,  */APIError } from '@p0/common'
import { config } from '../core/index.ts'
import errorMw from '../middlewares/errors.ts'

import type { /* Request,  */Response, NextFunction } from 'express'
import type { /* Context,  */RequestExt } from '../core/index.ts'

import authMw from '../middlewares/auth.ts'

import { router as statusRouter } from './status.ts'
import { router as loginRouter } from './login.ts'
import { router as userRouter } from './user.ts'
import { router as mediaRouter } from './media.ts'

const router = express.Router()

//  ---------------------------------

router.use(`/api/${config.api}/login`, loginRouter)
router.use(`/api/${config.api}/status`, authMw, statusRouter)
router.use(`/api/${config.api}/user`, authMw, userRouter)
router.use(`/api/${config.api}/media`, authMw, mediaRouter)

//  ---------------------------------
//  404

router.all('*', (req: RequestExt, res: Response, next: NextFunction) => {
  next(new APIError(404, `Resource not found, url ${req.url}`))
})

//  ---------------------------------
//  last one: errors MW
router.use(errorMw)

export default router
