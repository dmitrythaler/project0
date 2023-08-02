import { describe, before, after, it } from "node:test"
import assert from "node:assert/strict"
import { APIError, cleanUpSlug, logger } from '@p0/common'
import { getDAL } from '../index'

import type * as M from 'mongodb'
import type { Media } from '../index'

describe('Media DAL suite', function () {

  const ownerId = '64561d650ca8dbb5ca7ab546'
  const ownerId2 = '64c00c62e08913e23b8bc3c5'
  const slug = 'midnight-solvent'
  const slug2 = 'daily-blubling'
  const slug3 = 'pony-pumping'
  const slug4 = 'clouds & sparsed rains, Inc.'

  const files: Media.SelfFile[] = [
    { fileName: 'some-picture-1.jpg', fileSize: 28666, height: 600, width: 800 },
    { fileName: 'some-picture-2.jpg', fileSize: 28666, height: 600, width: 800 },
    { fileName: 'some-picture-3.jpg', fileSize: 28666, height: 600, width: 800 },
    { fileName: 'some-picture-4.jpg', fileSize: 28666, height: 600, width: 800 }
  ]
  const files2: Media.SelfFile[] = [
    { fileName: 'another-picture-1.jpg', fileSize: 32001, height: 600, width: 800 },
    { fileName: 'another-picture-2.jpg', fileSize: 33405, height: 1080, width: 1920 },
    { fileName: 'another-picture-3.jpg', fileSize: 33405, height: 1080, width: 1920 }
  ]
  const files3: Media.SelfFile[] = [
    { fileName: 'justta-picture-1.jpg', fileSize: 100, height: 100, width: 100 },
    { fileName: 'justta-picture-2.jpg', fileSize: 100, height: 100, width: 100 }
  ]

  const DAL = getDAL({
    host: 'localhost',
    port: 27016,
    database: 'DAL-test'
  })

  let mediaDAL: ReturnType<(ReturnType<typeof getDAL>)["getMediaDAL"]>
  let media: Media.Self[] = []
  let media2: Media.Self[] = []

  before(async function() {
    await DAL.init()
    mediaDAL = DAL.getMediaDAL()
    const collection = await mediaDAL.getColl()
    await collection.deleteMany({})
  })

  after(async function() {
    await DAL.close()
  })

  it('should create new Media records', async function() {
    const records = await mediaDAL.storeMediaData(ownerId, files, slug)
    assert.ok(records)
    assert.ok(records[0]._id)
    assert.equal(records.length, files.length)
    assert.equal(records[0].slug, slug)
    assert.equal(records[0].ownerId, ownerId)
    media = records
  })

  it('should create another Media records', async function() {
    let records = await mediaDAL.storeMediaData(ownerId2, files2, slug2)
    assert.ok(records)
    assert.ok(records[0]._id)
    assert.equal(records.length, files2.length)
    assert.equal(records[0].slug, slug2)
    assert.equal(records[0].ownerId, ownerId2)
    media2 = records

    records = await mediaDAL.storeMediaData(ownerId2, files3, slug3)
    assert.ok(records)
    assert.ok(records[0]._id)
    assert.equal(records.length, files3.length)
    assert.equal(records[0].slug, slug3)
    assert.equal(records[0].ownerId, ownerId2)
  })

  it('should get all Media records', async function() {
    const records = await mediaDAL.getList()
    assert.ok(records)
    assert.equal(records.length, files.length + files2.length + files3.length)
  })

  it('should get Media records for specific owner', async function() {
    let records = await mediaDAL.getList(ownerId2)
    assert.ok(records)
    assert.equal(records.length, files2.length + files3.length)
    assert.equal(records[0].ownerId, ownerId2)
    records = await mediaDAL.getList(ownerId)
    assert.ok(records)
    assert.equal(records.length, files.length)
    assert.equal(records[0].ownerId, ownerId)
  })

  it('should get Media records for specific owner and slug', async function() {
    const records = await mediaDAL.getList(ownerId2, slug3)
    assert.ok(records)
    assert.equal(records.length, files3.length)
    assert.equal(records[0].ownerId, ownerId2)
  })

  it('should get Media record by id', async function() {
    const record = await mediaDAL.getById(ownerId, media[0]._id!)
    assert.ok(record)
    assert.equal(record.ownerId, ownerId)
    assert.equal(record._id!, media[0]._id)
  })

  it('should update Media record(slug) by id', async function () {
    const newSlug: string = slug + '-upd'
    const _id: string = media[0]._id!
    const count = await mediaDAL.updateMedia(ownerId, _id, newSlug)
    assert.equal(count, 1)
    const record = await mediaDAL.getById(ownerId, _id)
    assert.ok(record)
    assert.equal(record.slug, newSlug)
  })

  it('should update all Media records with specific slug', async function () {
    const newSlug: string = slug2 + '-upd'
    const count = await mediaDAL.updateAllMediaWithSlug(ownerId2, slug2, newSlug)
    assert.equal(count, files2.length)
    const records = await mediaDAL.getList(ownerId2, newSlug)
    assert.ok(records)
    assert.equal(records.length, files2.length)
    assert.equal(records[0].slug, newSlug)
  })

  it('should clean-up provided slug before update Media', async function () {
    const cleanSlug: string = cleanUpSlug(slug4)
    const _id: string = media[0]._id!
    await mediaDAL.updateMedia(ownerId, _id, slug4)
    const record = await mediaDAL.getById(ownerId, _id)
    assert.equal(record.slug, cleanSlug)
  })

  it('should delete one Media record by id', async function () {
    const _id: string = media[0]._id!
    let record = await mediaDAL.delete(ownerId, _id)
    assert.ok(record)
    assert.equal(record._id, _id)

    assert.rejects(
      async () => {
        await mediaDAL.getById(ownerId, _id)
      },
      (error) => {
        logger.test('getById rejects:', error)
        assert.equal((<APIError>error).code, 404)
        return true
      }
    )
  })

  it('should delete multiple Media records', async function () {
    const _ids: string[] = media2.map(m => m._id!)
    logger.test('_ids to delete:', _ids)
    let records = await mediaDAL.deleteMany(ownerId2, _ids)
    assert.ok(records)
    assert.equal(records[0]._id, _ids[0])

    assert.rejects(
      async () => {
        await mediaDAL.getById(ownerId2, _ids[1])
      },
      (error) => {
        logger.test('getById rejects:', error)
        // assert.equal((<APIError>error).code, 404)
        return true
      }
    )
  })


})
