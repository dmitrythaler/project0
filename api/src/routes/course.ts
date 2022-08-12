import express from 'express'
import { decorateResponse } from '../core/index.js'
import {
  getCoursesList,
  getCourseByName,
  getCourseById,
  postCreateCourse,
  patchUpdateCourse,
  patchCheckAccessLevel,
  deleteCourse
} from '../controllers/course.js'

import type { Response, NextFunction } from 'express'
import type { RequestExt } from '../core/index.js'

//  ---------------------------------

const router = express.Router()

router.get('/list', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await getCoursesList(req)
    res.status(200).json(decorateResponse(data, req))
  } catch (err) {
    next(err)
  }
})

router.get('/name/:name', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await getCourseByName(req)
    res.status(200).json(decorateResponse(data, req))
  } catch(err) {
    next(err)
  }
})

router.get('/id/:id', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await getCourseById(req)
    res.status(200).json(decorateResponse(data, req))
  } catch(err) {
    next(err)
  }
})

router.post('/', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await postCreateCourse(req)
    res.status(200).json(decorateResponse(data, req))
  } catch(err) {
    next(err)
  }
})

router.patch('/:id', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await patchUpdateCourse(req)
    res.status(200).json(decorateResponse(data, req))
  } catch(err) {
    next(err)
  }
})

router.patch('/check-access-level/:name', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await patchCheckAccessLevel(req)
    res.status(200).json(decorateResponse(data, req))
  } catch(err) {
    next(err)
  }
})

router.delete('/:id', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await deleteCourse(req)
    res.status(200).json(decorateResponse(data, req))
  } catch(err) {
    next(err)
  }
})

export { router }
