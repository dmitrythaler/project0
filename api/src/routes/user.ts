import express from 'express'
import { decorateResponse } from '../core/index.ts'

import {
  getUsersList,
  getUserByEmail,
  postCreateUser,
  patchUpdateUser,
  deleteUser
} from '../controllers/user.ts'

import type { Response, NextFunction } from 'express'
import type { RequestExt } from '../core/index.ts'

//  ---------------------------------

const router = express.Router()

router.get('/list', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await getUsersList(req)
    res
      .status(200)
      .json(decorateResponse(data, req))
  } catch(err) {
    next(err)
  }
})

router.get('/email/:email', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await getUserByEmail(req)
    res
      .status(200)
      .json(decorateResponse(data, req))
  } catch(err) {
    next(err)
  }
})

router.post('/', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await postCreateUser(req)
    res
      .status(200)
      .json(decorateResponse(data, req))
  } catch(err) {
    next(err)
  }
})

router.patch('/:id', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const data = await patchUpdateUser(req)
    res
      .status(200)
      .json(decorateResponse(data, req))
  } catch(err) {
    next(err)
  }
})

router.delete('/:id', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    await deleteUser(req)
    res
      .status(200)
      .json(decorateResponse({}, req))
  } catch (err) {
    next(err)
  }
})


export { router }
