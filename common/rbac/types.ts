import type {
  Entity,
  Player,
  PlayerID,
  OrgID,
  // MediaID,
  // SomeID
} from '../types.ts'

/**
 * type definitions
 */

type ConcreteAction = 'List' | 'Create' | 'Get' | 'Update' | 'Delete'
type WildAction = '*'
type ClientAction = 'Invite' | 'AcceptInvitation' | 'RefuseInvitation' | 'Exclude'
type Action = ConcreteAction | WildAction

type RootEntityAction = '*:*'
type UpdateRoleEntityAction = 'User:UpdateRole' | 'Client:UpdateRole'
type ClientEntityAction = `Client:${ClientAction}`

export type Role = 'User:Root' | 'User:Admin' | 'User:Manager' | 'Client:Owner' | 'Client:Manager'
export type EntityAction = `${Entity}:${Action}` | RootEntityAction | UpdateRoleEntityAction | ClientEntityAction

export type WithIdsAndType<EID extends string> = {
  readonly type: Entity
  _id: EID
  ownerId?: PlayerID
  orgId?: OrgID
  orgName?: string
}

export type WithIdsTypeAndRole = WithIdsAndType<PlayerID> & {
  type: Player
  role: Role
}
