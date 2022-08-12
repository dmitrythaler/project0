import assert from 'assert'
import type { Keyed } from '@p0/common'
import { ColorLevel } from '@p0/common'

process.env.PGHOST = 'localhost'
process.env.PGPORT = '5432'
process.env.PGDATABASE = 'tests'
process.env.PGUSER = 'tester'
process.env.PGPASSWORD = 'testerwashere'

import { sql, courseDAL } from '../index'
import type { Course } from '../index'

describe('Course DAL suite', function () {

  let course: Course.Itself
  let uuid: string
  const name = 'Test-Course-P0'
  const version = 13
  const squidexId = 'someone'
  const squidexSecret = 'sometwo'
  const greenSt = ColorLevel.GREEN
  const redSt = ColorLevel.RED
  const sincePub = { total: 0 }

  beforeAll(async function() {
    await sql`DELETE FROM "public"."course"`

    course = {
      name, version, squidexId, squidexSecret
    }
    // template = { a: 1, b: true, c: 'something', d: { x: 0, y: 1, z: 2 } }
  })

  afterAll(async function() {
    await sql.end()
  })

  //  ---------------------------------

  it('should create new Course', async function() {
    const c = await courseDAL.create(course)
    assert.ok(c)
    assert.ok(c.uuid)
    uuid = c.uuid
    assert.strictEqual(c.name, name)
    assert.strictEqual(c.version, version)
  })

  it('shouldn\'t create Course with the same name', async function() {
    await assert.rejects(
      async function() {
        await courseDAL.create(course)
      },
      (err: Keyed) => {
        // console.dir(err, { showHidden: true, depth: 8 })
        assert.ok(err)
        assert.strictEqual(err.code, 400)
        return true
      }
    )
  })

  it('shouldn\'t create Course with insufficient data', async function() {
    await assert.rejects(
      async function() {
        const c: Partial<Course.Itself> = {
          ...course
        }
        delete c.squidexSecret
        await courseDAL.create(c)
      },
      (err: Keyed) => {
        assert.ok(err)
        assert.strictEqual(err.code, 400)
        return true
      }
    )
  })

  it('should retrieve Course by id', async function() {
    const c = await courseDAL.getById(uuid)
    // console.log(c)
    assert.ok(c)
    assert.ok(c.uuid)
    assert.strictEqual(c.uuid, uuid)
    assert.strictEqual(c.name, name)
  })

  it('should retrieve Course by name', async function() {
    const c = await courseDAL.getByName(name)
    assert.ok(c)
    assert.strictEqual(c.name, name)
  })

  it('should throw if Course not found', async function() {
    await assert.rejects(
      async function() {
        await courseDAL.getByName('something-non-existent')
      },
      (err: Keyed) => {
        assert.ok(err)
        assert.strictEqual(err.name, 'API Error')
        assert.strictEqual(err.code, 404)
        return true
      }
    )
  })

  it('should retrieve list of Courses', async function () {
    let c = await courseDAL.create({
      ...course,
      name: course.name + '.0'
    })
    assert.ok(c)
    assert.ok(c.uuid)
    c = await courseDAL.create({
      ...course,
      name: course.name + '.1'
    })
    assert.ok(c)
    assert.ok(c.uuid)

    const list = await courseDAL.getList()
    // console.log('+++', list)
    assert.ok(list)
    assert.ok(list.length >= 2)
    assert.strictEqual(list[list.length - 1].name, name + '.1')
  })

  it('should delete Course', async function () {
    let list = await courseDAL.getList()
    const l = list.length
    assert.ok(l)
    const id = <string>list[list.length - 1].uuid

    await courseDAL.delete(id)
    list = await courseDAL.getList()
    assert.strictEqual(l, list.length + 1)
  })

  describe('Course update/patch stuff:', () => {
    let c
    let notch

    it('should update/patch', async function() {
      c = await courseDAL.update(uuid, { sincePublished: sincePub, squidexAuthState: redSt })
      notch = Date.now()
      assert.strictEqual(c.uuid, uuid)
      assert.deepStrictEqual(c.sincePublished, sincePub)
      assert.deepStrictEqual(c.squidexAuthState, redSt)
    })

    it('updatedAt property should be updated correctly', async function() {
      assert.ok(c.updatedAt && (notch - c.updatedAt.getTime() < 100))
    })

    it('should update published data', async function () {
      c = await courseDAL.updatePublished(name)
      notch = Date.now()
      assert.strictEqual(c.uuid, uuid)
      assert.strictEqual(c.version, version + 1)
      assert.deepStrictEqual(c.squidexAuthState, greenSt)
    })

    it('publishedAt property should be updated correctly', async function () {
      assert.ok(c.publishedAt && (notch - c.publishedAt.getTime() < 100))
    })

  })


})
