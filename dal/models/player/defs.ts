import bcrypt from 'bcrypt'
import {
  BCRYPT_ROUNDS_NUM,
  APIError,
  genUUID
} from '@p0/common'

import type { Entity, PlayerID, OrgID, WithDates } from '@p0/common/types'
import type { Role, WithIdsTypeAndRole } from '@p0/common/rbac'

//  ----------------------------------------------------------------------------------------------//

export interface Player extends WithIdsTypeAndRole, WithDates {
  email: string,
  fullName?: string,
  password: string,
  isActive: boolean,
  lastLogin?: Date
}

export interface User extends Player {
  type: 'User',
}

export type ClientInvitationStatus = 'Invited' | 'Accepted'/*  | 'Declined' */
export type OrgMembership = {
  orgId: OrgID
  orgName?: string
  role: Role
  status: ClientInvitationStatus
}

export interface Client extends Player {
  type: 'Client',
  orgs: OrgMembership[]
}

//  utils/pipes

const HIDDENPASSWORD = ''

export const validatePassword = <T extends Partial<Player>>(player: T): T => {
  //  TODO: extend these rules to good defined Policy
  if (!player.password) {
    throw new APIError(400, 'Password not provided')
  }
  if (player.password.length < 8) {
    throw new APIError(400, 'Password is too short')
  }
  return player
}

export const validateOrRemovePassword = <T extends Partial<Player>>(player: T): T => {
  if (player.password) {
    return validatePassword(player)
  }
  delete player.password
  return player
}

export const hashPassword = <T extends Partial<Player>>(player: T): T => {
  if (player.password && player.password !== HIDDENPASSWORD) {
    player.password = bcrypt.hashSync(player.password, BCRYPT_ROUNDS_NUM)
  }
  return player
}

export const hidePassword = <T extends Partial<Player>>(player: T): T => {
  if (player.password) {
    player.password = HIDDENPASSWORD
  }
  return player
}

export const setClientDefaults = <T extends Partial<Client>>(client: T): T => ({
  type: 'Client' as Entity,
  _id: genUUID<PlayerID>(),
  isActive: true,
  orgs: [],
  ...client
})

export const setUserDefaults = <T extends Partial<User>>(user: T): T => ({
  type: 'User' as Entity,
  _id: genUUID<PlayerID>(),
  isActive: true,
  ...user
})

