import express from 'express'
import { /* logger,  */APIError } from '@p0/common'
import { config } from '../core/index.js'
import errorMw from '../middlewares/errors.js'

import type { /* Request,  */Response, NextFunction } from 'express'
import type { /* Context,  */RequestExt } from '../core/index.js'

import authMw from '../middlewares/auth.js'

import { router as statusRouter } from './status.js'
import { router as loginRouter } from './login.js'
import { router as courseRouter } from './course.js'
import { router as userRouter } from './user.js'
import { router as publisherRouter } from './publisher.js'
import { router as bulkerRouter } from './bulker.js'
import { router as configRouter } from './config.js'

const router = express.Router()

//  ---------------------------------

router.use(`/api/${config.api}/login`, loginRouter)
router.use(`/api/${config.api}/status`, authMw, statusRouter)
router.use(`/api/${config.api}/course`, authMw, courseRouter)
router.use(`/api/${config.api}/user`, authMw, userRouter)
router.use(`/api/${config.api}/publisher`, authMw, publisherRouter)
router.use(`/api/${config.api}/bulker`, authMw, bulkerRouter)
router.use(`/api/${config.api}/config`, authMw, configRouter)

//  ---------------------------------
//  404

router.all('*', (req: RequestExt, res: Response, next: NextFunction) => {
  next(new APIError(404, `Resource not found, url ${req.url}`))
})

//  ---------------------------------
//  last one: errors MW
router.use(errorMw)

export default router
