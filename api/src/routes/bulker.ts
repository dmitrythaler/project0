import express from 'express'
import { decorateResponse } from '../core/index.js'
import {
  getRulesList,
  getRuleById,
  postCreateRule,
  patchUpdateRule,
  deleteRule,
  patchApplyRule
} from '../controllers/bulker.js'
import { scheduledRules } from '../services/scheduled-rules.js'

import type { Response, NextFunction } from 'express'
import type { RequestExt } from '../core/index.js'

//  ---------------------------------

const router = express.Router()

router.get('/list/:id', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await getRulesList(req)
    res.status(200).json(decorateResponse(data, req))
  } catch (err) {
    next(err)
  }
})

router.get('/id/:id', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await getRuleById(req)
    res.status(200).json(decorateResponse(data, req))
  } catch(err) {
    next(err)
  }
})

router.post('/', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await postCreateRule(req)
    res.status(200).json(decorateResponse(data, req))
  } catch(err) {
    next(err)
  }
})

router.patch('/apply-scheduled', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    /* await */scheduledRules.run()
    res.status(200).json(decorateResponse({}, req))
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await patchUpdateRule(req)
    res.status(200).json(decorateResponse(data, req))
  } catch(err) {
    next(err)
  }
})

router.delete('/:id', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await deleteRule(req)
    res.status(200).json(decorateResponse(data, req))
  } catch(err) {
    next(err)
  }
})

router.patch('/apply/:id', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await patchApplyRule(req)
    res.status(200).json(decorateResponse(data, req))
  } catch (err) {
    next(err)
  }
})

export { router }
