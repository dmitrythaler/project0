import express from 'express'
import { decorateResponse } from '../core/index.ts'
import { getStatus } from '../controllers/status.ts'

import type { Response, NextFunction } from 'express'
import type { RequestExt } from '../core/index.ts'

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
