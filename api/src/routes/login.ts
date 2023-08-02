import express from 'express'
import {
  TOKEN_COOKIE_NAME,
  EXPIRY_COOKIE_NAME
} from '@p0/common'
import { jwt, decorateResponse } from '../core/index.ts'

import authMw from '../middlewares/auth.ts'
import { postLoginUser } from '../controllers/user.ts'

import type { Response, NextFunction } from 'express'
import type { RequestExt } from '../core/index.ts'
import type { User } from '@p0/dal'

//  ---------------------------------

const router = express.Router()

router.post('/', async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const { user, token, wsToken } = await postLoginUser(req)
    const { _id, email, firstName, lastName, role, lastLogin } = <User.Self>user

    const maxAge = jwt.getExpSec() * 1000
    res
      .status(200)
      .cookie(TOKEN_COOKIE_NAME, token, {
        httpOnly: true,
        maxAge
      })
      .cookie(EXPIRY_COOKIE_NAME, maxAge + Date.now(), {
        maxAge
      })
      .json(decorateResponse({
        user: { _id, email, firstName, lastName, role, lastLogin },
        wsToken
      }, req))
  } catch(err) {
    next(err)
  }
})

router.delete('/', authMw, async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    res
      .status(204)
      .clearCookie(TOKEN_COOKIE_NAME)
      .clearCookie(EXPIRY_COOKIE_NAME)
      .json(decorateResponse({}, req))
  } catch(err) {
    next(err)
  }
})

export { router }
