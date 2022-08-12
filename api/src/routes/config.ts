import express from 'express'
import { decorateResponse } from '../core/index.js'
import {
  getConfig,
  putUpdateConfig
} from '../controllers/config.js'

import type { Response, NextFunction } from 'express'
import type { RequestExt } from '../core/index.js'

//  ---------------------------------

const router = express.Router()

router.get('/', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const config  = await getConfig(/* req */)
    res.status(200).json(decorateResponse({ config }, req))
  } catch (err) {
    next(err)
  }
})

router.put('/', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const config = await putUpdateConfig(req)
    res.status(200).json(decorateResponse({ config }, req))
  } catch (err) {
    next(err)
  }
})

export { router }

