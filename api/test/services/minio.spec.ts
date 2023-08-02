import { describe, it, before } from "node:test"
import assert from "node:assert/strict"
// import fs from 'node:fs'

import { getMinio } from '../../src/services/minio.js'

//  ---------------------------------

describe('Minio Service', () => {
  let minio
  let exists
  const textContent = 'some content to store into object'

  before(async () => {
    minio = getMinio({
      endPoint: 'localhost',
      accessKey: 'root',
      secretKey: 'brokenDefib',
      region: 'eu-west-2',
      bucket: 'tests'
    })
  })

  it('get buckets list', async () => {
    const buckets = await minio.listBuckets()
    assert.ok(buckets)
    // console.log('+++ buckets', buckets)
  })

  it('check if bucket exists', async () => {
    exists = await minio.bucketExists()
    assert.ok(exists === true || exists === false)
    // console.log('+++ bucket exists', exists)
  })

  it('create bucket', async () => {
    if (exists) {
      await minio.removeBucket()
    }
    await minio.createBucket('tests')
    exists = true
  })

  it('list objects (empty)', async () => {
    const objects = await minio.listObjects()
    assert.ok(objects)
    assert.equal(objects.length, 0)
  })

  it('save objects', async () => {
    const one = await minio.putObject('sub/one.txt', textContent)
    assert.ok(one)
    const two = await minio.putObject('sub/two.txt', textContent)
    assert.ok(two)
    const three = await minio.putObject('sub/three.txt', textContent)
    assert.ok(three)
  })

  it('list objects', async () => {
    const objects = await minio.listObjects()
    assert.ok(objects)
    assert.equal(objects.length, 3)
    // console.log('+++ objects', objects)
  })

  it('stat object', async () => {
    const stat = await minio.statObject('sub/two.txt')
    assert.ok(stat.lastModified)
    assert.ok(stat.etag)
  })

  it('remove object', async () => {
    await minio.removeObject('sub/three.txt')
    const objects = await minio.listObjects()
    assert.equal(objects.length, 2)
    // console.log('+++ objects', objects)
  })

  it('remove objects', async () => {
    await minio.removeObjects(['sub/one.txt', 'sub/two.txt'])
    const objects = await minio.listObjects()
    assert.equal(objects.length, 0)
  })

  it('empty bucket', async () => {
    const one = await minio.putObject('sub/one.txt', textContent)
    assert.ok(one)
    const two = await minio.putObject('sub/two.txt', textContent)
    assert.ok(two)
    const three = await minio.putObject('sub/three.txt', textContent)
    assert.ok(three)
    let objects = await minio.listObjects()
    assert.equal(objects.length, 3)
    await minio.emptyBucket()
    objects = await minio.listObjects()
    assert.equal(objects.length, 0)
  })

  it('get presigned url', async () => {
    const url = await minio.presignedPutObjectUrl('sub/one.txt')
    // console.log('+++', url)
    assert.ok(url)
  })

  it('remove bucket', async () => {
    await minio.removeBucket()
  })


})



