import express from 'express'
import { jwt, decorateResponse } from '../core/index.js'

import { postLoginUser } from '../controllers/user.js'

import type { Response, NextFunction } from 'express'
import type { RequestExt } from '../core/index.js'
import type { User } from '@p0/dal'

//  ---------------------------------

const router = express.Router()

router.post('/', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const { user, token } = await postLoginUser(req)
    const { uuid, email, firstName, lastName, role, lastLogin } = <User.DBRecord>user
    const maxAge = jwt.getExpSec() * 1000
    res
      .status(200)
      .cookie('token', token, {
        httpOnly: true,
        maxAge
        // secure: process.env.NODE_ENV === "production",
      })
      .cookie('exp', maxAge + Date.now(), {
        maxAge
      })
      .json(decorateResponse({ user: { uuid, email, firstName, lastName, role, lastLogin } }, req))
  } catch(err) {
    next(err)
  }
})

router.delete('/', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    res
      .status(204)
      .clearCookie('token')
      .clearCookie('exp')
      .json(decorateResponse({}, req))
  } catch(err) {
    next(err)
  }
})

export { router }
