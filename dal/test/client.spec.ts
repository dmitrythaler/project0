import { describe, before, after, it } from "node:test"
import assert from "node:assert/strict"

import { APIError, logger, genUUID } from '@p0/common'
import { startContainer, stopContainer } from './fixture.ts'
import { ClientDAL, getDAL } from '../index.ts'
import { setClientDefaults } from '../models/player/defs.ts'

// import type * as M from 'mongodb'
import type { Client } from '../index.ts'
import type { PlayerID } from '@p0/common/types'

//  ---------------------------------

describe('Client DAL suite', function () {

  let client: Client
  let _id: PlayerID
  let _id2: PlayerID
  let _id3: PlayerID
  const password = 'DarkerThanBlack'
  const hidden = ''
  let DAL: ReturnType<typeof getDAL>
  let clientDAL: ClientDAL

  before(async function() {
    const cont = await startContainer()

    DAL = getDAL({
      host: 'localhost',
      port: cont.getFirstMappedPort(),
      database: 'DAL-test',
      migrate: false
    })

    await DAL.init()
    clientDAL = DAL.getClientDAL()
    const collection = await clientDAL.getColl()
    await collection.deleteMany()

    client = setClientDefaults({
      email: 'client@domain.com',
      fullName: 'John Doe',
      password,
      isActive: true,
      role: 'Client:Owner'
    }) as Client
  })

  after(async function() {
    const collection = await clientDAL.getColl()
    await collection.deleteMany()
    await DAL.close()
    await stopContainer()
  })

  it('should create new Client', async function() {
    const u = await clientDAL.create(client)
    assert.ok(u)
    assert.ok(u._id)
    _id = u._id
    assert.equal(u.email, client.email)
    assert.equal(u.password, hidden)
  })

  it('shouldn\'t create Client with the same email', async function() {
    await assert.rejects(
      async function() {
        await clientDAL.create(client)
      },
      (err: APIError) => {
        logger.test('clientDAL.create APIError:', err)
        assert.ok(err)
        assert.equal(err.code, 400)
        return true
      }
    )
  })

  it('should retrieve Client by id', async function() {
    const u = await clientDAL.getById(_id)
    assert.ok(u)
    assert.ok(u._id)
    assert.equal(u._id, _id)
    assert.equal(u.password, hidden)
  })

  it('should retrieve Client by email', async function() {
    const u = await clientDAL.getByEmail(client.email)
    logger.test('clientDAL.getByEmail', u)
    assert.ok(u)
    assert.equal(u.email, client.email)
    assert.equal(u.password, hidden)
  })

  it('should throw if Client not found', async function() {
    await assert.rejects(
      async function() {
        await clientDAL.getByEmail('nobody@nowhere.no')
      },
      (err: APIError) => {
        assert.ok(err)
        assert.equal(err.name, 'API Error')
        assert.equal(err.code, 404)
        return true
      }
    )
  })

  it('should retrieve list(simle) of Clients', async function () {
    let u = await clientDAL.create({
      ...client,
      _id: genUUID<PlayerID>(),
      email: 'client2@domain.com'
    })
    assert.ok(u)
    assert.ok(u._id)
    _id2 = u._id
    u = await clientDAL.create({
      ...client,
      _id: genUUID<PlayerID>(),
      email: 'client3@domain.com'
    })
    assert.ok(u)
    assert.ok(u._id)
    _id3 = u._id
    const list = await clientDAL.getList()
    logger.test('clientDAL.getList', list)
    assert.ok(list)
    assert.equal(list.data.length, 3)
    assert.equal(list.meta.total, 3)
  })

  it('should remove Users', async function () {
    await clientDAL.delete(_id2)
    await clientDAL.delete(_id3)

    const list = await clientDAL.getList()
    logger.test('clientDAL.getList', list)
    assert.ok(list)
    assert.equal(list.data.length, 1)
  })

  describe('Client update/patch stuff:', () => {
    let u: Client
    let notch: number

    it('should update/patch', async function() {
      u = await clientDAL.update(_id, { role: 'User:Admin' })
      notch = Date.now()
      assert.equal(u.email, client.email)
      assert.equal(u.role, 'User:Admin')
      assert.equal(u.password, hidden)
    })
    it('updatedAt property should be updated correctly', async function() {
      assert.ok(u.updatedAt && (notch - u.updatedAt.getTime() < 100))
    })
  })

  describe('Client auth stuff:', () => {
    let t: Client
    let u: Client
    let notch: number

    before(async function() {
      t = await clientDAL.getById(_id)
    })

    it('should login with correct creds', async function() {
      u = await clientDAL.login(t.email, password)
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
      const t = await clientDAL.getById(_id)
      await assert.rejects(
        async function() {
          await clientDAL.login( t.email, hidden)
        },
        (err: APIError) => {
          assert.ok(err)
          assert.equal(err.code, 401)
          return true
        }
      )
    })
    it('shouldn\'t login to deactivated account', async function () {
      const t = await clientDAL.getById(_id)
      await clientDAL.update(_id, { isActive: false })
      await assert.rejects(
        async function () {
          await clientDAL.login(t.email, password)
        },
        (err: APIError) => {
          assert.ok(err)
          assert.equal(err.code, 403)
          return true
        }
      )
    })
  })

  describe('Client paginated list stuff:', () => {
    let managers: Client[]
    let admins: Client[]

    before(async function () {
      managers = Array.from({ length: 50 }, (_, idx) => setClientDefaults({
        email: `manager${String(idx).padStart(2, '0')}@example.com`,
        fullName: 'John Doe',
        password: '',
        isActive: true,
        role: 'User:Manager'
      }) as Client)
      admins = Array.from({ length: 50 }, (_, idx) => setClientDefaults({
        email: `admin${String(idx).padStart(2, '0')}@example.com`,
        fullName: 'Matthew Doe',
        password: '',
        isActive: true,
        role: 'User:Admin'
      }) as Client)

      const collection = await clientDAL.getColl()
      await collection.deleteMany({})
      await collection.insertMany(admins)
      await collection.insertMany(managers)
    })

    it('should retrieve filtered list of Clients', async function () {
      const list = await clientDAL.getList({
        filter: { role: 'User:Manager' }
      })
      logger.test('clientDAL.getList, filtered, 1st item', list.data[0])
      assert.equal(list.data.length, 50)
      assert.equal(list.meta.total, 50)
      assert.equal(list.data[0].role, 'User:Manager')
    })

    it('should retrieve filtered/limited list of Clients', async function () {
      const list = await clientDAL.getList({
        limit: 10,
        filter: { role: 'User:Admin' }
      })
      logger.test('clientDAL.getList, filtered, 1st item', list.data[0])
      assert.equal(list.data.length, 10)
      assert.equal(list.meta.total, 50)
      assert.equal(list.data[0].role, 'User:Admin')
    })

    it('should retrieve filtered/sorted/skipped list of Clients', async function () {
      const list = await clientDAL.getList({
        filter: { role: 'User:Admin' },
        sort: { 'email': -1 },
        skip: 10
      })
      logger.test('clientDAL.getList, filtered, 1st item', list.data[0])
      // console.log('+++', list.data.map(({ email }) => email))

      assert.equal(list.data.length, 40)
      assert.equal(list.meta.total, 50)
      assert.equal(list.data[0].email, 'admin39@example.com')
    })

  })

})
