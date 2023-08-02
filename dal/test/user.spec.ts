import { describe, before, after, it } from "node:test"
import assert from "node:assert/strict"
import { APIError, logger } from '@p0/common'
import { getDAL } from '../index'

import type * as M from 'mongodb'
import type { User } from '../index'


describe('User DAL suite', function () {

  let user: User.Self
  let _id: M.ObjectId
  let _id2: M.ObjectId
  let _id3: M.ObjectId
  const password = 'DarkerThanBlack'
  const hidden = ''
  let userDAL

  const DAL = getDAL({
    host: 'localhost',
    port: 27016,
    database: 'DAL-test'
  })

  before(async function() {
    await DAL.init()
    userDAL = DAL.getUserDAL()
    const collection = await userDAL.getColl()
    await collection.deleteMany({})

    user = {
      email: 'user@domain.com',
      lastName: 'Doe',
      firstName: 'John',
      password,
      isActive: true,
      role: 'User'
    }
  })

  after(async function() {
    await DAL.close()
  })

  it('should create new User', async function() {
    const u = await userDAL.create(user)
    assert.ok(u)
    assert.ok(u._id)
    _id = u._id
    assert.equal(u.email, user.email)
    assert.equal(u.password, hidden)
  })

  it('shouldn\'t create User with the same email', async function() {
    await assert.rejects(
      async function() {
        await userDAL.create(user)
      },
      (err: APIError) => {
        logger.test('userDAL.create APIError:', err)
        assert.ok(err)
        assert.equal(err.code, 400)
        return true
      }
    )
  })

  it('should retrieve User by id', async function() {
    const u = await userDAL.getById(_id)
    assert.ok(u)
    assert.ok(u._id)
    assert.equal(u._id.toString(), _id.toString())
    assert.equal(u.password, hidden)
  })

  it('should retrieve User by email', async function() {
    const u = await userDAL.getByEmail(user.email)
    logger.test('userDAL.getByEmail', u)
    assert.ok(u)
    assert.equal(u.email, user.email)
    assert.equal(u.password, hidden)
  })

  it('should throw if User not found', async function() {
    await assert.rejects(
      async function() {
        await userDAL.getByEmail('nobody@nowhere.no')
      },
      (err: APIError) => {
        assert.ok(err)
        assert.equal(err.name, 'API Error')
        assert.equal(err.code, 404)
        return true
      }
    )
  })

  it('should retrieve list of Users', async function () {
    let u = await userDAL.create({
      ...user,
      email: 'user2@domain.com'
    })
    assert.ok(u)
    assert.ok(u._id)
    _id2 = u._id
    u = await userDAL.create({
      ...user,
      email: 'user3@domain.com'
    })
    assert.ok(u)
    assert.ok(u._id)
    _id3 = u._id
    const list = await userDAL.getList()
    logger.test('userDAL.getList', list)
    assert.ok(list)
    assert.equal(list.length, 3)
  })

  it('should remove Users', async function () {
    await userDAL.delete(_id2)
    await userDAL.delete(_id3)

    const list = await userDAL.getList()
    logger.test('userDAL.getList', list)
    assert.ok(list)
    assert.equal(list.length, 1)
  })

  describe('User update/patch stuff:', () => {
    let u
    let notch

    it('should update/patch', async function() {
      u = await userDAL.update(_id, { role: 'Admin' })
      notch = Date.now()
      assert.equal(u.email, user.email)
      assert.equal(u.role, 'Admin')
      assert.equal(u.password, hidden)
    })
    it('updatedAt property should be updated correctly', async function() {
      assert.ok(u.updatedAt && (notch - u.updatedAt.getTime() < 100))
    })
  })

  describe('User auth stuff:', () => {
    let t
    let u
    let notch

    before(async function() {
      t = await userDAL.getById(_id)
    })

    it('should login with correct creds', async function() {
      u = await userDAL.login(t.email, password)
      notch = Date.now()
      assert.equal(u.email, t.email)
      assert.equal(u.password, hidden)
    })

    it('lastLogin property should be updated correctly', async function() {
      assert.ok(u.lastLogin && (notch - u.lastLogin.getTime() < 100))
    })
    it('updatedAt property should remain intact', async function() {
      assert.equal(u.updatedAt?.getTime(), t.updatedAt?.getTime())
    })
    it('shouldn\'t login with incorrect creds', async function() {
      const t = await userDAL.getById(_id)
      await assert.rejects(
        async function() {
          await userDAL.login( t.email, hidden)
        },
        (err: APIError) => {
          assert.ok(err)
          assert.equal(err.code, 401)
          return true
        }
      )
    })
  })


})
