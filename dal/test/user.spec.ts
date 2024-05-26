import { describe, before, after, it } from "node:test"
import assert from "node:assert/strict"

import { APIError, logger, genUUID } from '@p0/common'
import { startContainer, stopContainer } from './fixture.ts'
import { UserDAL, getDAL } from '../index.ts'
import { setUserDefaults } from '../models/player/defs.ts'

// import type * as M from 'mongodb'
import type { User } from '../index.ts'
import type { PlayerID } from '@p0/common/types'

//  ---------------------------------

describe('User DAL suite', function () {

  let user: User
  let _id: PlayerID
  let _id2: PlayerID
  let _id3: PlayerID
  const password = 'DarkerThanBlack'
  const hidden = ''
  let DAL: ReturnType<typeof getDAL>
  let userDAL: UserDAL

  before(async function() {
    const cont = await startContainer()

    DAL = getDAL({
      host: 'localhost',
      port: cont.getFirstMappedPort(),
      database: 'DAL-test',
      migrate: false
    })

    await DAL.init()
    userDAL = DAL.getUserDAL()
    const collection = await userDAL.getColl()
    await collection.deleteMany()

    user = setUserDefaults({
      email: 'user@domain.com',
      fullName: 'John Doe',
      password,
      isActive: true,
      role: 'User:Manager'
    }) as User
  })

  after(async function() {
    const collection = await userDAL.getColl()
    await collection.deleteMany()
    await DAL.close()
    await stopContainer()
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
    assert.equal(u._id, _id)
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

  it('should retrieve list(simple) of Users', async function () {
    let u = await userDAL.create({
      ...user,
      _id: genUUID<PlayerID>(),
      email: 'user2@domain.com'
    })
    assert.ok(u)
    assert.ok(u._id)
    _id2 = u._id
    u = await userDAL.create({
      ...user,
      _id: genUUID<PlayerID>(),
      email: 'user3@domain.com'
    })
    assert.ok(u)
    assert.ok(u._id)
    _id3 = u._id

    const list = await userDAL.getList({})
    logger.test('userDAL.getList', list)
    assert.ok(list)
    assert.equal(list.data.length, 3)
    assert.equal(list.meta.total, 3)
  })

  it('should remove Users', async function () {
    await userDAL.delete(_id2)
    await userDAL.delete(_id3)

    const list = await userDAL.getList()
    logger.test('userDAL.getList', list)
    assert.ok(list)
    assert.equal(list.data.length, 1)
  })

  describe('User update/patch stuff:', () => {
    let u: User
    let notch: number

    it('should update/patch', async function() {
      u = await userDAL.update(_id, { role: 'User:Admin' })
      notch = Date.now()
      assert.equal(u.email, user.email)
      assert.equal(u.role, 'User:Admin')
      assert.equal(u.password, hidden)
    })
    it('updatedAt property should be updated correctly', async function() {
      assert.ok(u.updatedAt && (notch - u.updatedAt.getTime() < 100))
    })
  })

  describe('User auth stuff:', () => {
    let t: User
    let u: User
    let notch: number

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
          await userDAL.login(t.email, hidden)
        },
        (err: APIError) => {
          assert.ok(err)
          assert.equal(err.code, 401)
          return true
        }
      )
    })
    it('shouldn\'t login to deactivated account', async function() {
      const t = await userDAL.getById(_id)
      await userDAL.update(_id, { isActive: false })
      await assert.rejects(
        async function() {
          await userDAL.login(t.email, password)
        },
        (err: APIError) => {
          assert.ok(err)
          assert.equal(err.code, 403)
          return true
        }
      )
    })
  })

  describe('User paginated list stuff:', () => {
    let managers: User[]
    let admins: User[]

    before(async function() {
      managers = Array.from({ length: 50 }, (_, idx) => setUserDefaults({
        email: `manager${String(idx).padStart(2, '0')}@example.com`,
        fullName: 'John Doe',
        password: '',
        isActive: true,
        role: 'User:Manager'
      }) as User)
      admins = Array.from({ length: 50 }, (_, idx) => setUserDefaults({
        email: `admin${String(idx).padStart(2, '0')}@example.com`,
        fullName: 'Matthew Doe',
        password: '',
        isActive: true,
        role: 'User:Admin'
      }) as User)

      const collection = await userDAL.getColl()
      await collection.deleteMany({})
      await collection.insertMany(admins)
      await collection.insertMany(managers)
    })

    it('should retrieve filtered list of Users', async function() {
      const list = await userDAL.getList({
        filter: { role: 'User:Manager' }
      })
      logger.test('userDAL.getList, filtered, 1st item', list.data[0])
      assert.equal(list.data.length, 50)
      assert.equal(list.meta.total, 50)
      assert.equal(list.data[0].role, 'User:Manager')
    })

    it('should retrieve filtered/limited list of Users', async function() {
      const list = await userDAL.getList({
        limit: 10,
        filter: { role: 'User:Admin' }
      })
      logger.test('userDAL.getList, filtered, 1st item', list.data[0])
      assert.equal(list.data.length, 10)
      assert.equal(list.meta.total, 50)
      assert.equal(list.data[0].role, 'User:Admin')
    })

    it('should retrieve filtered/sorted/skipped list of Users', async function() {
      const list = await userDAL.getList({
        filter: { role: 'User:Admin' },
        sort: { 'email': -1 },
        skip: 10
      })
      logger.test('userDAL.getList, filtered, 1st item', list.data[0])
      // console.log('+++', list.data.map(({ email }) => email))

      assert.equal(list.data.length, 40)
      assert.equal(list.meta.total, 50)
      assert.equal(list.data[0].email, 'admin39@example.com')
    })

  })


})
