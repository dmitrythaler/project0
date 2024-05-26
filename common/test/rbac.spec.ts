import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { APIError } from "../error.ts"
import { checkPermissions, createRBACFilter } from '../rbac/index.ts'
import { genUUID } from '../core.node.ts'
import type { PlayerID, OrgID } from '../types.ts'
import type { WithIdsAndType, WithIdsTypeAndRole } from '../rbac/index.ts'

//  ---------------------------------

describe('RBAC Permissions suite', () => {

  const root: WithIdsTypeAndRole = {
    _id: genUUID<PlayerID>(),
    type: 'User',
    role: 'User:Root'
  }
  const admin: WithIdsTypeAndRole = {
    _id: genUUID<PlayerID>(),
    type: 'User',
    orgId: genUUID<OrgID>(),
    ownerId: genUUID<PlayerID>(),
    role: 'User:Admin'
  }
  const manager: WithIdsTypeAndRole = {
    _id: genUUID<PlayerID>(),
    type: 'User',
    orgId: genUUID<OrgID>(),
    ownerId: genUUID<PlayerID>(),
    role: 'User:Manager'
  }
  const clientManager: WithIdsTypeAndRole = {
    _id: genUUID<PlayerID>(),
    type: 'Client',
    orgId: genUUID<OrgID>(),
    ownerId: genUUID<PlayerID>(),
    role: 'Client:Manager'
  }
  const baseEntity: WithIdsAndType<PlayerID> = {
    _id: genUUID<PlayerID>(),
    type: 'Org',
    orgId: genUUID<OrgID>(),
    ownerId: genUUID<PlayerID>()
  }

  it('Any: shouldn\'t allow wild action', () => {
    assert.throws(
      function () {
        checkPermissions(root, 'User:*', { ...baseEntity, type: 'User' })
      },
      (err: APIError) => {
        assert.ok(err)
        assert.equal(err.code, 400)
        return true
      }
    )
  })
  it('Any: User:Delete, not allowed for self', () => {
    assert.ok(!checkPermissions(root, 'User:Delete', root))
  })
  it('Any: shouldn\'t allow wrong entity', () => {
    assert.throws(
      function () {
        checkPermissions(root, 'Client:Update', { ...baseEntity, type: 'User' })
      },
      (err: APIError) => {
        assert.ok(err)
        assert.equal(err.code, 400)
        return true
      }
    )
  })

  describe('Simple rules', () => {
    it('User:Admin: Client:*', () => {
      const entity = { ...clientManager }
      assert.ok(checkPermissions(admin, 'Client:Create', entity))
      assert.ok(checkPermissions(admin, 'Client:List', entity))
      assert.ok(checkPermissions(admin, 'Client:Get', entity))
    })
    it('User:Admin: Client:Delete', () => {
      assert.ok(!checkPermissions(admin, 'Client:Delete', clientManager))
    })
    it('User:Admin: User:Create', () => {
      const entity = { ...manager }
      assert.ok(checkPermissions(admin, 'User:Create', entity))
      entity.role = 'User:Admin'
      assert.ok(!checkPermissions(admin, 'User:Create', entity))
      entity.role = 'User:Root'
      assert.ok(!checkPermissions(admin, 'User:Create', entity))
    })
    it('Client:Manager: Org:*', () => {
      const entity = { ...baseEntity }
      assert.ok(checkPermissions(clientManager, 'Org:Create', entity))
      assert.ok(!checkPermissions(clientManager, 'Org:Get', entity))
      entity.orgId = clientManager.orgId
      assert.ok(checkPermissions(clientManager, 'Org:Get', entity))

    })
  })

  describe('Composite rules', () => {
    // 'User:Update': _Or(isSuperior, isHimself),
    it('User:Admin: User:Update', () => {
      const entity = { ...manager }
      assert.ok(checkPermissions(admin, 'User:Update', entity))
      entity.role = 'User:Admin'
      entity._id = admin._id
      assert.ok(checkPermissions(admin, 'User:Update', entity))
      entity._id = genUUID<PlayerID>()
      assert.ok(!checkPermissions(admin, 'User:Update', entity))
    })
    // 'User:UpdateRole': _And(isSuperior, _Not(isHimself)),
    it('User:Admin: User:UpdateRole', () => {
      const entity = { ...manager }
      assert.ok(checkPermissions(admin, 'User:UpdateRole', entity))
      entity.role = 'User:Admin'
      assert.ok(!checkPermissions(admin, 'User:UpdateRole', entity))
      entity.role = 'User:Manager'
      entity._id = admin._id
      assert.ok(!checkPermissions(admin, 'User:UpdateRole', entity))
    })
    // 'User:Delete': _And(isSuperior, isOwner, _Not(isHimself)),
    it('User:Admin: User:Delete', () => {
      const entity = { ...manager, ownerId: admin._id }
      assert.ok(checkPermissions(admin, 'User:Delete', entity))
      entity.role = 'User:Admin'
      assert.ok(!checkPermissions(admin, 'User:Delete', entity))
      entity.role = 'User:Manager'
      entity._id = admin._id
      assert.ok(!checkPermissions(admin, 'User:Delete', entity))
      entity._id = genUUID<PlayerID>()
      entity.ownerId = genUUID<PlayerID>()
      assert.ok(!checkPermissions(admin, 'User:Delete', entity))
    })
  })

  it('Create Filter', () => {
    let filter = createRBACFilter(clientManager, 'Menu')
    // console.log('+++', filter)
    assert.ok(typeof filter === 'object')
    assert.ok(filter.orgId === clientManager.orgId)

    filter = createRBACFilter(admin, 'User')
    assert.ok(filter === true)

    filter = createRBACFilter(clientManager, 'User')
    assert.ok(filter === false)
  })

})
