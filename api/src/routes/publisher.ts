import express from 'express'
import { decorateResponse } from '../core/index.js'
import {
  runPublisherRouteHandler,
  patchUnpublishedRouteHandler
} from '../controllers/publisher.js'

import type { Response, NextFunction } from 'express'
import type { RequestExt } from '../core/index.js'

//  ---------------------------------

const router = express.Router()

router.post('/:appName', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await runPublisherRouteHandler(req)
    res.status(200).json(decorateResponse(data, req))
  } catch (err) {
    next(err)
  }
})

router.patch('/unpublished/:appName', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await patchUnpublishedRouteHandler(req)
    res.status(200).json(decorateResponse(data, req))
  } catch (err) {
    next(err)
  }
})

export { router }

