import { APIError } from '../error.ts'
import { assertDefined } from '../core.node.ts'
import type { UnknownObject } from '../types.ts'
import type {
  Role,
  EntityAction,
  WithIdsAndType,
  WithIdsTypeAndRole
} from './types.ts'

import type {
  Entity,
  Player,
  PlayerID,
  OrgID,
  SomeID
} from '../types.ts'


//  ---------------------------------

type Predicate<EID extends string> = (player: WithIdsTypeAndRole, entity: WithIdsAndType<EID> | WithIdsTypeAndRole, ea?: EntityAction) => boolean
type FilterPredicate = (player: WithIdsTypeAndRole) => UnknownObject
type ScopePermission<EID extends string> = boolean | Predicate<EID> | FilterPredicate

type RolePermissions<EID extends string> = {
  [key in EntityAction]?: ScopePermission<EID>
}

type Permissions = {
  [key in Role]?: RolePermissions<SomeID>
}

/**
 * predicates
 */

const isHimself: Predicate<SomeID> = (player, entity) => {
  assertDefined(entity, 'Entity parameter required for Predicate')
  return player._id === entity._id
}
const inSameOrg: Predicate<SomeID> = (player, entity) => {
  assertDefined(entity, 'Entity parameter required for Predicate')
  return !!player.orgId && (player.orgId === entity.orgId)
}
const isOwner: Predicate<SomeID> = (player, entity) => {
  assertDefined(entity, 'Entity parameter required for Predicate')
  return player._id === entity.ownerId
}

const __roleWeights: { [key in Role]: number } = {
  'User:Root': 100,
  'User:Admin': 4,
  'User:Manager': 3,
  'Client:Owner': 2,
  'Client:Manager': 1,
}

const isSuperior: Predicate<SomeID> = (player, entity) => {
  return (entity.type === 'Client' || entity.type === 'User') &&
    __roleWeights[(<WithIdsTypeAndRole>entity).role] < __roleWeights[player.role]
}

const inSameOrgFilter: FilterPredicate = (player) => {
  return { orgId: player.orgId }
}
// next 2 used nowhere, but let them be
const isHimselfFilter: FilterPredicate = (player) => {
  return { _id: player._id }
}
const isOwnerFilter: FilterPredicate = (player) => {
  return { ownerId: player._id }
}

/**
 * predicate composers
 */
const _And = <EID extends string>(fn1: Predicate<EID>, ...fns: Array<Predicate<EID>>) =>
  fns.reduce((prevFn, nextFn) => (...pars) => prevFn(...pars) && nextFn(...pars), fn1)
const _Or = <EID extends string>(fn1: Predicate<EID>, ...fns: Array<Predicate<EID>>) =>
  fns.reduce((prevFn, nextFn) => (...pars) => prevFn(...pars) || nextFn(...pars), fn1)
const _Not = <EID extends string>(fn1: Predicate<EID>): Predicate<EID> => (...pars) => !fn1(...pars)


/**
 * RBAC itself
 */

const globalPermissions: Permissions = {
  'User:Root': {
    '*:*': true,
    'User:Delete': _Not(isHimself)
  },
  'User:Admin': {
    'User:*': true,
    'User:Create': isSuperior,
    'User:Update': _Or(isSuperior, isHimself),
    'User:UpdateRole': _And(isSuperior, _Not(isHimself)),
    'User:Delete': _And(isSuperior, isOwner, _Not(isHimself)),
    'Client:*': true,
    'Client:Delete': false,
    'Client:Invite': false,
    'Client:Exclude': false,
    'Client:AcceptInvitation': false,
    'Client:RefuseInvitation': false,
    'Org:*': true,
    'Place:*': true,
    'Menu:*': true,
    'Media:*': true,
  },
  'User:Manager': {
    'User:*': true,
    'User:Update': _Or(isSuperior, isHimself),
    'User:UpdateRole': _And(isSuperior, isOwner, _Not(isHimself)),
    'User:Delete': _And(isSuperior, isOwner, _Not(isHimself)),
    'Client:*': true,
    'Client:UpdateRole': isOwner,
    'Client:Delete': false,
    'Client:Invite': false,
    'Client:Exclude': false,
    'Client:AcceptInvitation': false,
    'Client:RefuseInvitation': false,
    'Org:*': true,
    'Place:*': true,
    'Menu:*': true,
    'Media:*': true,
  },
  'Client:Owner': {
    'Client:*': inSameOrg,
    'Client:List': inSameOrgFilter,
    'Client:UpdateRole': _And(isSuperior, _Not(isHimself)),
    'Client:Delete': false,
    'Client:Invite': true,
    'Client:Exclude': _And(inSameOrg, _Not(isHimself)),
    'Client:AcceptInvitation': true,
    'Client:RefuseInvitation': true,
    'Org:*': inSameOrg,
    'Org:Create': true,
    'Org:List': inSameOrgFilter,
    'Place:*': inSameOrg,
    'Place:List': inSameOrgFilter,
    'Menu:*': inSameOrg,
    'Menu:List': inSameOrgFilter,
    'Media:*': inSameOrg,
    'Media:List': inSameOrgFilter,
  },
  'Client:Manager': {
    'Client:*': inSameOrg,
    'Client:List': inSameOrgFilter,
    'Client:Update': isHimself,
    'Client:UpdateRole': false,
    'Client:Delete': false,
    'Client:Invite': false,
    'Client:Exclude': false,
    'Client:AcceptInvitation': true,
    'Client:RefuseInvitation': true,
    'Org:*': inSameOrg,
    'Org:Create': true,
    'Org:List': inSameOrgFilter,
    'Org:Delete': false,
    'Place:*': inSameOrg,
    'Place:List': inSameOrgFilter,
    'Place:Delete': false,
    'Menu:*': inSameOrg,
    'Menu:List': inSameOrgFilter,
    'Media:*': inSameOrg,
    'Media:List': inSameOrgFilter,
  }
}

//  ---------------------------------
const runUserPermission =
  <E extends WithIdsAndType<SomeID>, U extends WithIdsTypeAndRole>
    (player: U, ea: EntityAction, entity?: E)
    : boolean | UnknownObject => {
  const [type, action] = ea.split(':')

  // special case - Entity:*
  if (action === '*') {
    throw new APIError(400, 'Wild action ("*") is not allowed in the permission check.')
  }

  // special case - wrong EntityAction on Entity, like "Media:Delete" against "Client"
  if (entity && entity.type !== type) {
    throw new APIError(400, `Wrong Entity:Action provided: "${ea}" for "${entity.type}"`)
  }

  const rolePerms = globalPermissions[player.role] || {}
  const perm = rolePerms[ea]              // Entity:Action - concrete
    ?? rolePerms[`${ea.split(':')[0]}:*`] // Entity:* - wild, default for entity
    ?? rolePerms['*:*']                   // special case for Root
    ?? false                              // found nothing - disallowed

  if (typeof perm === 'boolean') {
    return perm
  }
  // here the perm is Predicate or FilterPredicate function, the Entity required only for the first ones
  // run it and return result
  return perm(player, entity)
}

/**
 * Returns true if the Action on the Entity is allowed to the Player
 *
 * @param {WithIdsTypeAndRole} player - Player with Role
 * @param {EntityAction} ea - EntityAction like 'Media:Delete'
 * @param {WithIdsAndType} entity - any Entity, optional
 * @returns boolean
 * @throws in case of wild action like 'User:*'
 */
export const checkPermissions = <E extends WithIdsAndType<SomeID>, U extends WithIdsTypeAndRole>
  (player: U, ea: EntityAction, entity?: E): boolean => {
  return !!runUserPermission(player, ea, entity)
}

/**
 * Returns filter object for Entity List, or boolean for all-or-nothing cases
 *
 * @param {WithIdsTypeAndRole} player - Player with Role
 * @param {Entity} e - Entity
 * @returns boolean or object
 * @throws in case of wild action like 'User:*'
 */
export const createRBACFilter = <U extends WithIdsTypeAndRole>
  (player: U, e: Entity): boolean|UnknownObject => {
  return runUserPermission(player, `${e}:List`)
}

/**
 * Throws if the Action on the Entity is not allowed to the Player (or in case of wild action like 'User:*')
 *
 * @param {WithIdsTypeAndRole} player - Player with Role
 * @param {WithIdsAndType} entity - any Entity
 * @param {EntityAction} ea - EntityAction like 'Menu:Delete'
 */
export const assertPermissions = <E extends WithIdsAndType<SomeID>, U extends WithIdsTypeAndRole>(player: U, ea: EntityAction, entity?: E) => {
  if (!checkPermissions(player, ea, entity)) {
    throw new APIError(403, 'You do not have permission to perform this action.')
  }
}

