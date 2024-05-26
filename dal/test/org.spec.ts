import { describe, before, after, it } from "node:test"
import assert from "node:assert/strict"

import { APIError, logger, genUUID } from '@p0/common'
import { startContainer, stopContainer } from './fixture.ts'
import { OrgDAL, getDAL } from '../index.ts'
import { setDefaults } from '../models/org/defs.ts'

// import type * as M from 'mongodb'
import type { Org } from '../index.ts'
import type { PlayerID, OrgID } from '@p0/common/types'

//  ---------------------------------

describe('Org DAL suite', function () {

  const ownerId: PlayerID = genUUID<PlayerID>()
  let org: Org
  let _id: OrgID
  let _id2: OrgID
  let _id3: OrgID
  let DAL: ReturnType<typeof getDAL>
  let orgDAL: OrgDAL

  before(async function() {
    const cont = await startContainer()

    DAL = getDAL({
      host: 'localhost',
      port: cont.getFirstMappedPort(),
      database: 'DAL-test',
      migrate: false
    })

    await DAL.init()
    orgDAL = DAL.getOrgDAL()
    const collection = await orgDAL.getColl()
    await collection.deleteMany()

    org = setDefaults({
      name: 'Murder Inc.',
      ownerId
    }) as Org
  })

  after(async function() {
    const collection = await orgDAL.getColl()
    await collection.deleteMany()
    await DAL.close()
    await stopContainer()
  })

  it('should create new Org', async function() {
    const o = await orgDAL.create(org)
    assert.ok(o)
    assert.ok(o._id)
    _id = o._id
    assert.equal(o.name, org.name)
  })

  it('should retrieve Org by id', async function() {
    const u = await orgDAL.getById(_id)
    assert.ok(u)
    assert.ok(u._id)
    assert.equal(u._id, _id)
  })

  it('should throw if Org not found', async function() {
    await assert.rejects(
      async function() {
        await orgDAL.getById(genUUID<OrgID>())
      },
      (err: APIError) => {
        assert.ok(err)
        assert.equal(err.name, 'API Error')
        assert.equal(err.code, 404)
        return true
      }
    )
  })

  it('should retrieve list(simple) of Orgs', async function () {
    let o = await orgDAL.create({
      ...org,
      _id: genUUID<OrgID>(),
      name: 'Gonzo Investments'
    })
    assert.ok(o)
    assert.ok(o._id)
    _id2 = o._id
    o = await orgDAL.create({
      ...org,
      _id: genUUID<OrgID>(),
      name: 'Scam Soft Services'
    })
    assert.ok(o)
    assert.ok(o._id)
    _id3 = o._id

    const list = await orgDAL.getList({})
    logger.test('OrgDAL.getList', list)
    assert.ok(list)
    assert.equal(list.data.length, 3)
    assert.equal(list.meta.total, 3)
  })

  it('should remove Orgs', async function () {
    await orgDAL.delete(_id2)
    await orgDAL.delete(_id3)

    const list = await orgDAL.getList()
    logger.test('OrgDAL.getList', list)
    assert.ok(list)
    assert.equal(list.data.length, 1)
  })

  describe('Org update/patch stuff:', () => {
    let o: Org
    let notch: number

    it('should update/patch', async function() {
      o = await orgDAL.update(_id, { name: 'Nothing Heavy Industries' })
      notch = Date.now()
      assert.equal(o.name, 'Nothing Heavy Industries')
    })
    it('updatedAt property should be updated correctly', async function() {
      assert.ok(o.updatedAt && (notch - o.updatedAt.getTime() < 100))
    })
  })

  describe('Org paginated list stuff:', () => {
    let orgs: Org[]

    before(async function() {
      orgs = Array.from({ length: 50 }, (_, idx) => setDefaults({
        name: `Some Corp ${String(idx).padStart(2, '0')}`,
        ownerId
      }) as Org)

      const collection = await orgDAL.getColl()
      await collection.deleteMany({})
      await collection.insertMany(orgs)
    })

    it('should retrieve limited list of Orgs', async function() {
      const list = await orgDAL.getList({
        limit: 10
      })
      logger.test('OrgDAL.getList, limit 10, 1st item', list.data[0])
      assert.equal(list.data.length, 10)
      assert.equal(list.meta.total, 50)
      assert.equal(list.data[0].name, 'Some Corp 00')
    })

    it('should retrieve sorted/skipped list of Orgs', async function() {
      const list = await orgDAL.getList({
        sort: { 'name': -1 },
        skip: 10
      })
      logger.test('OrgDAL.getList, skip 10, sorted, 1st item', list.data[0])
      // console.log('+++', list.data.map(({ email }) => email))
      assert.equal(list.data.length, 40)
      assert.equal(list.meta.total, 50)
      assert.equal(list.data[0].name, 'Some Corp 39')
    })

  })


})
