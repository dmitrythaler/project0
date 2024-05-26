import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'

import { getS3 } from '../../src/services/aws-s3.ts'
import { startMinioContainer, stopMinioContainer } from '../fixture.ts'

import type { StartedTestContainer } from "testcontainers"
import type { S3Service } from '../../src/services/aws-s3.ts'

//  ---------------------------------

describe('AWS S3 Service', async () => {
  const bucketName = `test-${randomBytes(8).toString('hex')}`
  const textContent = 'some content to store into object'
  let s3: S3Service
  let minio: StartedTestContainer

  before(async () => {
    minio = await startMinioContainer()
    s3 = await getS3({
      endpoint: `http://localhost:${minio.getFirstMappedPort()}`,
      accessKeyId: 'root',
      secretAccessKey: 'brokenDefib',
      region: 'eu-west-2'
    })
  })

  after(async () => {
    await stopMinioContainer()
  })

  //  ---------------------------------
  it('create bucket', async () => {
    await s3.createBucket(bucketName)
  })

  it('check if bucket exists', async () => {
    const res = await s3.bucketExists(bucketName)
    assert.ok(res)
  })

  it('list objects (empty)', async () => {
    const objects = await s3.listObjects(bucketName)
    assert.ok(objects)
    assert.equal(objects.length, 0)
  })

  it('save objects', async () => {
    const one = await s3.putObject(bucketName, 'sub/one.txt', textContent)
    assert.ok(one)
    const two = await s3.putObject(bucketName, 'sub/two.txt', textContent)
    assert.ok(two)
    const three = await s3.putObject(bucketName, 'sub/three.txt', textContent)
    assert.ok(three)
  })

  it('list objects', async () => {
    const objects = await s3.listObjects(bucketName)
    assert.ok(objects)
    assert.equal(objects.length, 3)
  })

  it('stat object', async () => {
    const stat = await s3.getObjectMeta(bucketName, 'sub/two.txt')
    assert.ok(stat !== false)
    assert.ok(stat.LastModified)
    assert.ok(stat.ETag)
  })

  it('remove object', async () => {
    await s3.deleteObject(bucketName, 'sub/three.txt')
    const objects = await s3.listObjects(bucketName)
    assert.equal(objects.length, 2)
  })

  it('get presigned url', async () => {
    const url = await s3.getPresignedUrl(bucketName, 'sub/one.txt')
    assert.ok(url)
    assert.ok(url.length)
  })

  it('remove bucket', async () => {
    await s3.deleteObject(bucketName, 'sub/one.txt')
    await s3.deleteObject(bucketName, 'sub/two.txt')
    const objects = await s3.listObjects(bucketName)
    assert.equal(objects.length, 0)
    await s3.deleteBucket(bucketName)
  })
})



