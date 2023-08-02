import express from 'express'
import { decorateResponse } from '../core/index.ts'

import {
  getMediaList,
  getMediaById,
  postCreateMedia,
  patchUpdateMedia,
  deleteMedia,
  patchUndoCreateMedia,
} from '../controllers/media.ts'

import type { Response, NextFunction } from 'express'
import type { RequestExt } from '../core/index.ts'

//  ---------------------------------

const router = express.Router()

router.get('/list', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await getMediaList(req)
    res
      .status(200)
      .json(decorateResponse(data, req))
  } catch(err) {
    next(err)
  }
})

router.get('/:id', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await getMediaById(req)
    res
      .status(200)
      .json(decorateResponse(data, req))
  } catch(err) {
    next(err)
  }
})

router.post('/', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await postCreateMedia(req)
    res
      .status(200)
      .json(decorateResponse(data, req))
  } catch(err) {
    next(err)
  }
})

router.patch('/', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await patchUpdateMedia(req)
    res
      .status(200)
      .json(decorateResponse(data, req))
  } catch(err) {
    next(err)
  }
})

router.patch('/undo', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await patchUndoCreateMedia(req)
    res
      .status(200)
      .json(decorateResponse(data, req))
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await deleteMedia(req)
    res
      .status(200)
      .json(decorateResponse(data, req))
  } catch (err) {
    next(err)
  }
})

export { router }
