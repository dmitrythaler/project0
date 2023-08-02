import {
  APIError,
  logger,
  USERS_CREATED,
  USERS_UPDATED,
  USERS_DELETED
} from '@p0/common'
import { getDAL } from '@p0/dal'
import { jwt, ensureUser } from '../core/index.ts'
import { getWss } from '../services/wss.ts'

import type { RequestExt } from '../core/index.ts'
import type { User } from '@p0/dal'
import { TypeCopy/* , AppAction */ } from '@p0/common/types.ts'

//  ---------------------------------
export const getUsersList = async ({ ctx }: RequestExt): Promise<{ users: User.Self[] }> => {
  const currUser = ensureUser(ctx)
  const users = await getDAL().getUserDAL().getList()
  if (currUser.role !== 'Admin') {
    // only Admins can see all users
    const user = users.find(u => u.email === currUser.email)
    return { users: user ? [user] : [] }
  }
  return { users }
}

export const getUserByEmail = async ({ ctx, params }: RequestExt): Promise<{ user: User.Self }> => {
  const currUser = ensureUser(ctx)
  const userEmail = params.email

  if (currUser.role !== 'Admin' && currUser.email !== userEmail) {
    logger.error(`ACCESS VIOLATION: role ${currUser.role} has no enough rights, session ${ctx?.sessionId}`)
    throw new APIError(403)
  }

  const user = await getDAL().getUserDAL().getByEmail(userEmail)
  return { user }
}

export const postCreateUser = async ({ ctx, body }: RequestExt): Promise<{ user: User.Self }> => {
  const currUser = ensureUser(ctx)
  if (currUser.role !== 'Admin') {
    logger.error(`ACCESS VIOLATION: role ${currUser.role} has no enough rights, session ${ctx?.sessionId}`)
    throw new APIError(403)
  }

  const user = await getDAL().getUserDAL().create(body.data)
  getWss().broadcast({
    type: USERS_CREATED,
    payload: <TypeCopy<User.Self>>user
  })

  return { user }
}

export const patchUpdateUser = async ({ ctx, params, body }: RequestExt): Promise<{ user: User.Self }> => {
  const currUser = ensureUser(ctx)
  const userId = params.id

  if (currUser.role !== 'Admin') {
    if (currUser._id !== userId) {
      logger.error(`ACCESS VIOLATION: role ${currUser.role} has no enough rights, session ${ctx?.sessionId}`)
      throw new APIError(403)
    }
    delete body.data.role
    delete body.data.isActive
  }
  const user = await getDAL().getUserDAL().update(userId, body.data)
  getWss().broadcast({
    type: USERS_UPDATED,
    payload: <TypeCopy<User.Self>>user
  })
  return { user }
}

export const deleteUser = async ({ ctx, params }: RequestExt): Promise<void> => {
  const currUser = ensureUser(ctx)
  if (currUser.role !== 'Admin') {
    logger.error(`ACCESS VIOLATION: role ${currUser.role} has no enough rights, session ${ctx?.sessionId}`)
    throw new APIError(403)
  }

  const userId = params.id
  await getDAL().getUserDAL().delete(userId)
  getWss().broadcast({
    type: USERS_DELETED,
    payload: { _id: userId }
  })
}

export const postLoginUser = async ({ body }: RequestExt)
: Promise<{ user: User.Self, token: string, wsToken: string }> => {
  const { creds } = body.data
  const user = await getDAL().getUserDAL().login(creds.email, creds.password)
  const token = jwt.sign({ user })
  const wsToken = jwt.sign({ id: user._id })
  return { user, token, wsToken }
}

