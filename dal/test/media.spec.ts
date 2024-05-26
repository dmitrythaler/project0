import { describe, before, after, it } from "node:test"
import assert from "node:assert/strict"

import { APIError, cleanUpSlug, logger, genUUID } from '@p0/common'
import { startContainer, stopContainer } from './fixture.ts'
import { getDAL } from '../index.ts'

import type { PlayerID, OrgID, MediaID } from '@p0/common/types'
import type { Media, MediaFile } from '../index.ts'

//  ---------------------------------

describe('Media DAL suite', function () {

  const ownerId = genUUID<PlayerID>()
  const ownerId2 = genUUID<PlayerID>()
  const orgId = genUUID<OrgID>()
  const orgId2 = genUUID<OrgID>()
  const slug = 'midnight-solvent'
  const slug2 = 'daily-blubling'
  const slug3 = 'pony-pumping'
  const slug4 = 'clouds & sparsed rains, Inc.'

  const files: MediaFile[] = [
    { fileName: 'some-picture-1.jpg', fileSize: 28666, height: 600, width: 800 },
    { fileName: 'some-picture-2.jpg', fileSize: 28666, height: 600, width: 800 },
    { fileName: 'some-picture-3.jpg', fileSize: 28666, height: 600, width: 800 },
    { fileName: 'some-picture-4.jpg', fileSize: 28666, height: 600, width: 800 }
  ]
  const files2: MediaFile[] = [
    { fileName: 'another-picture-1.jpg', fileSize: 32001, height: 600, width: 800 },
    { fileName: 'another-picture-2.jpg', fileSize: 33405, height: 1080, width: 1920 },
    { fileName: 'another-picture-3.jpg', fileSize: 33405, height: 1080, width: 1920 }
  ]
  const files3: MediaFile[] = [
    { fileName: 'justta-picture-1.jpg', fileSize: 100, height: 100, width: 100 },
    { fileName: 'justta-picture-2.jpg', fileSize: 100, height: 100, width: 100 }
  ]

  let DAL: ReturnType<typeof getDAL>
  let mediaDAL: ReturnType<(ReturnType<typeof getDAL>)["getMediaDAL"]>
  let media: Media[] = []
  let media2: Media[] = []

  before(async function () {
    const cont = await startContainer()

    DAL = getDAL({
      host: 'localhost',
      port: cont.getFirstMappedPort(),
      database: 'DAL-test',
      migrate: false
    })

    await DAL.init()
    mediaDAL = DAL.getMediaDAL()
    const collection = await mediaDAL.getColl()
    await collection.deleteMany()
  })

  after(async function() {
    const collection = await mediaDAL.getColl()
    await collection.deleteMany()
    await DAL.close()
    await stopContainer()
  })

  it('should create new Media records', async function() {
    const records = await mediaDAL.storeMediaData(files, ownerId, orgId, slug)
    assert.ok(records)
    assert.ok(records[0]._id)
    assert.equal(records.length, files.length)
    assert.equal(records[0].slug, slug)
    assert.equal(records[0].ownerId, ownerId)
    media = records
  })

  it('should create another Media records', async function() {
    let records = await mediaDAL.storeMediaData(files2, ownerId2, orgId2, slug2)
    assert.ok(records)
    assert.ok(records[0]._id)
    assert.equal(records.length, files2.length)
    assert.equal(records[0].slug, slug2)
    assert.equal(records[0].ownerId, ownerId2)
    media2 = records

    records = await mediaDAL.storeMediaData(files3, ownerId2, orgId2, slug3)
    assert.ok(records)
    assert.ok(records[0]._id)
    assert.equal(records.length, files3.length)
    assert.equal(records[0].slug, slug3)
    assert.equal(records[0].ownerId, ownerId2)
  })

  it('should get all Media records', async function() {
    const records = await mediaDAL.getList()
    assert.ok(records)
    assert.equal(records.data.length, files.length + files2.length + files3.length)
    assert.equal(records.meta.total, files.length + files2.length + files3.length)
  })

  it('should get Media records for specific owner', async function() {
    let records = await mediaDAL.getList({ filter: { ownerId: ownerId2 } })
    assert.ok(records)
    assert.equal(records.data.length, files2.length + files3.length)
    assert.equal(records.meta.total, files2.length + files3.length)
    assert.equal(records.data[0].ownerId, ownerId2)

    records = await mediaDAL.getList({ filter: { ownerId: ownerId } })
    assert.ok(records)
    assert.equal(records.data.length, files.length)
    assert.equal(records.meta.total, files.length)
    assert.equal(records.data[0].ownerId, ownerId)
  })

  it('should get Media records for specific owner and slug', async function() {
    const records = await mediaDAL.getList({ filter: { ownerId: ownerId2, slug: slug3 } })
    assert.ok(records)
    assert.equal(records.data.length, files3.length)
    assert.equal(records.meta.total, files3.length)
    assert.equal(records.data[0].ownerId, ownerId2)
  })

  it('should get Media record by id', async function() {
    const record = await mediaDAL.getById(media[0]._id!)
    assert.ok(record)
    assert.equal(record.ownerId, ownerId)
    assert.equal(record._id!, media[0]._id)
  })

  it('should update Media record(slug) by id', async function () {
    const newSlug: string = slug + '-upd'
    const _id: MediaID = media[0]._id
    const count = await mediaDAL.updateMedia(_id, newSlug)
    assert.equal(count, 1)
    const record = await mediaDAL.getById(_id)
    assert.ok(record)
    assert.equal(record.slug, newSlug)
  })

  it('should update all Media records with specific slug', async function () {
    const newSlug: string = slug2 + '-upd'
    const count = await mediaDAL.updateAllMediaWithSlug(media2[0]._id, newSlug)
    assert.equal(count, files2.length)
    const records = await mediaDAL.getList({ filter: { ownerId: ownerId2, slug: newSlug } })
    assert.ok(records)
    assert.equal(records.data.length, files2.length)
    assert.equal(records.meta.total, files2.length)
    assert.equal(records.data[0].slug, newSlug)
  })

  it('should clean-up provided slug before update Media', async function () {
    const cleanSlug: string = cleanUpSlug(slug4)
    const _id: MediaID = media[0]._id
    await mediaDAL.updateMedia(_id, slug4)
    const record = await mediaDAL.getById(_id)
    assert.equal(record.slug, cleanSlug)
  })

  it('should delete one Media record by id', async function () {
    const _id: MediaID = media[0]._id
    let record = await mediaDAL.delete(_id)
    assert.ok(record)
    assert.equal(record._id, _id)

    assert.rejects(
      async () => {
        await mediaDAL.getById(_id)
      },
      (error) => {
        logger.test('getById rejects:', error)
        assert.equal((<APIError>error).code, 404)
        return true
      }
    )
  })

  it('should delete multiple Media records', async function () {
    const _ids: MediaID[] = media2.map(m => m._id)
    logger.test('_ids to delete:', _ids)
    let records = await mediaDAL.deleteMany(_ids)
    assert.ok(records)
    assert.equal(records[0]._id, _ids[0])

    assert.rejects(
      async () => {
        await mediaDAL.getById(_ids[1])
      },
      (error) => {
        logger.test('getById rejects:', error)
        // assert.equal((<APIError>error).code, 404)
        return true
      }
    )
  })


})
