import express from 'express'
import { decorateResponse } from '../core/index.js'
import { getStatus } from '../controllers/status.js'

import type { Response, NextFunction } from 'express'
import type { RequestExt } from '../core/index.js'

//  ---------------------------------

const router = express.Router()

router.get('/', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await getStatus()
    res
      .status(200)
      .json(decorateResponse(data, req))
  } catch (err) {
    next(err)
  }
})

export { router }
