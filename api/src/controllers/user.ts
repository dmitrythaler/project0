import { APIError, Keyed, logger } from '@p0/common'
import { userDAL, UserRole } from '@p0/dal'
import { jwt, ensureUser } from '../core/index.js'
import { broadcast } from '../services/wss.js'

import type { RequestExt } from '../core/index.js'

//  ---------------------------------


export const getUsersList = async ({ ctx }: RequestExt): Promise<Keyed> => {
  const currUser = ensureUser(ctx)
  const users = await userDAL.getList()
  if (currUser.role !== UserRole.Admin) {
    // only Admins can see all users
    const him = users.find(u => u.email === currUser.email)
    return { users: [him] }
  }
  return { users }
}

export const getUserByEmail = async ({ ctx, params }: RequestExt): Promise<Keyed> => {
  const currUser = ensureUser(ctx)
  const userEmail = params.email

  if (currUser.role !== UserRole.Admin && currUser.email !== userEmail) {
    logger.error(`ACCESS VIOLATION: role ${currUser.role} has no enough rights, session ${ctx?.sessionId}`)
    throw new APIError(403)
  }

  const user = await userDAL.getByEmail(userEmail)
  return { user }
}

export const getUserById = async ({ ctx, params }: RequestExt): Promise<Keyed> => {
  const currUser = ensureUser(ctx)
  const userId = params.id

  if (currUser.role !== UserRole.Admin && currUser.uuid !== userId) {
    logger.error(`ACCESS VIOLATION: role ${currUser.role} has no enough rights, session ${ctx?.sessionId}`)
    throw new APIError(403)
  }

  const user = await userDAL.getById(userId)
  return { user }
}

export const postCreateUser = async ({ ctx, body }: RequestExt): Promise<Keyed> => {
  const currUser = ensureUser(ctx)
  if (currUser.role !== UserRole.Admin) {
    logger.error(`ACCESS VIOLATION: role ${currUser.role} has no enough rights, session ${ctx?.sessionId}`)
    throw new APIError(403)
  }

  const user = await userDAL.create(body.data)
  broadcast({
    source: 'USER',
    event: 'CREATE',
    data: {
      actorId: currUser.uuid,
      userId: user.uuid
    }
  })

  return { user }
}

export const patchUpdateUser = async ({ ctx, params, body }: RequestExt): Promise<Keyed> => {
  const currUser = ensureUser(ctx)
  const userId = params.id

  if (currUser.role !== UserRole.Admin) {
    if (currUser.uuid !== userId) {
      logger.error(`ACCESS VIOLATION: role ${currUser.role} has no enough rights, session ${ctx?.sessionId}`)
      throw new APIError(403)
    }
    delete body.data.role
    delete body.data.isActive
  }

  const user = await userDAL.update(userId, body.data)
  broadcast({
    source: 'USER',
    event: 'UPDATE',
    data: {
      actorId: currUser.uuid,
      userId
    }
  })
  return { user }
}

export const deleteUser = async ({ ctx, params }: RequestExt): Promise<Keyed> => {
  const currUser = ensureUser(ctx)
  if (currUser.role !== UserRole.Admin) {
    logger.error(`ACCESS VIOLATION: role ${currUser.role} has no enough rights, session ${ctx?.sessionId}`)
    throw new APIError(403)
  }

  const userId = params.id
  await userDAL.delete(userId)
  broadcast({
    source: 'USER',
    event: 'DELETE',
    data: {
      actorId: currUser.uuid,
      userId
    }
  })
  return {}
}

export const postLoginUser = async ({ body }: RequestExt): Promise<Keyed> => {
  const { creds } = body.data
  const user = await userDAL.login(creds.email, creds.password)
  const token = jwt.sign({ user })
  return { user, token }
}

