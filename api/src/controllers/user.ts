import {
  // logger,
  assertPermissions,
  createRBACFilter,
  makeBrandedValue
} from '@p0/common'
import { getDAL } from '@p0/dal'
import { jwt, ensureUser } from '../core/index.ts'

import type { RequestExt } from '../core/index.ts'
import type { User, UserList } from '@p0/dal'
import type { PlayerID } from '@p0/common/types'

//  ---------------------------------
export const getUsersList = async ({ ctx }: RequestExt): Promise<UserList> => {
  const currUser = ensureUser(ctx)
  const filter = createRBACFilter(currUser, 'User')
  if (filter === false) {
    return { data: [], meta: { total: 0 } }
  }
  if (filter === true) {
    return getDAL().getUserDAL().getList()
  }
  return getDAL().getUserDAL().getList({ filter })
}

export const getUserByEmail = async ({ ctx, params }: RequestExt): Promise<{ user: User }> => {
  const currUser = ensureUser(ctx)
  const userEmail = params.email
  const user = await getDAL().getUserDAL().getByEmail(userEmail)

  assertPermissions(currUser, 'User:Get', user)
  return { user }
}

export const postCreateUser = async ({ ctx, body }: RequestExt): Promise<{ user: User }> => {
  const currUser = ensureUser(ctx)
  const newUser: User = body.data
  assertPermissions(currUser, 'User:Create', newUser)

  return { user: await getDAL().getUserDAL().create(newUser) }
}

export const patchUpdateUser = async ({ ctx, params, body }: RequestExt): Promise<{ user: User }> => {
  const currUser = ensureUser(ctx)
  const userId = makeBrandedValue<PlayerID>(params.id)
  const userDAL = getDAL().getUserDAL()
  let user = await userDAL.getById(userId)

  assertPermissions(currUser, 'User:Update', user)
  if ((body.data.role && body.data.role !== user.role) ||
    (body.data.isActive ?? body.data.isActive !== user.isActive)) {
    assertPermissions(currUser, 'User:UpdateRole', body.data)
  }

  user = await userDAL.update(userId, body.data)
  return { user }
}

export const deleteUser = async ({ ctx, params }: RequestExt): Promise<void> => {
  const currUser = ensureUser(ctx)
  const userDAL = getDAL().getUserDAL()
  const userId = makeBrandedValue<PlayerID>(params.id)
  let user = await userDAL.getById(userId)
  assertPermissions(currUser, 'User:Delete', user)
  await userDAL.delete(userId)
}

export const postLoginUser = async ({ body }: RequestExt)
: Promise<{ user: User, token: string }> => {
  const { creds } = body.data
  const user = await getDAL().getUserDAL().login(creds.email, creds.password)
  const token = jwt.sign({ user })
  return { user, token }
}

