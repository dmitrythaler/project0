import assert from 'assert'
import type { Keyed } from '@p0/common'

process.env.PGHOST='localhost'
process.env.PGPORT='5432'
process.env.PGDATABASE='tests'
process.env.PGUSER='tester'
process.env.PGPASSWORD='testerwashere'

import { sql, courseDAL, updateRuleDAL } from '../index'
import type { Course, UpdateRule } from '../index'

describe('UpdateRule DAL suite', function () {

  let rule: UpdateRule.Itself
  let courseId: string
  let uuid: string
  const courseName = 'Test-Course-P0'
  const courseVersion = 13
  const courseSquidexId = 'someone'
  const courseSquidexSecret = 'sometwo'
  const course: Course.Itself = {
    name: courseName,
    version: courseVersion,
    squidexId: courseSquidexId,
    squidexSecret: courseSquidexSecret
  }

  beforeAll(async function() {

    await sql`DELETE FROM "public"."update-rule"`
    await sql`DELETE FROM "public"."course"`

    const c = await courseDAL.create(course)
    assert.ok(c)
    assert.ok(c.uuid)
    courseId = c.uuid

    rule = {
      name: 'Hard Rule',
      courseId,
      testPath: 'topic[*].data.sections.iv[*].pagesAndActivities[*].answerChoices[*].text',
      testFunc: "val => val === 'Leg' || val === 'keeps'",
      updatePath: 'topic[*].data.sections.iv[*].pagesAndActivities[*].answerChoices[*]',
      updateFunc: 'val => val.forEach(v => v.instantSubmit = 666)'
    }
  })

  afterAll(async function() {
    await sql.end()
  })

  it('should create new UpdateRule', async function() {
    const r = await updateRuleDAL.create(rule)
    assert.ok(r)
    assert.ok(r.uuid)
    uuid = r.uuid
    assert.strictEqual(r.courseId, courseId)
    assert.strictEqual(r.name, rule.name)
  })

  it('should retrieve UpdateRule by id', async function() {
    const r = await updateRuleDAL.getById(uuid)
    assert.ok(r)
    assert.ok(r.uuid)
    assert.strictEqual(r.uuid, uuid)
  })

  it('should throw if Rule not found', async function() {
    await assert.rejects(
      async function() {
        const wrongId = '000' + uuid.slice(3)
        await updateRuleDAL.getById(wrongId)
      },
      (err: Keyed) => {
        assert.ok(err)
        assert.strictEqual(err.name, 'API Error')
        assert.strictEqual(err.code, 404)
        return true
      }
    )
  })

  it('should retrieve list of Update Rules for the given Course', async function () {
    let ur = await updateRuleDAL.create({
      ...rule,
      name: 'Harder Rule'
    })
    assert.ok(ur)
    assert.ok(ur.uuid)
    ur = await updateRuleDAL.create({
      ...rule,
      name: 'Hardest Rule'
    })
    assert.ok(ur)
    assert.ok(ur.uuid)

    const list = await updateRuleDAL.getList(courseId)

    assert.ok(list)
    assert.ok(list.length === 3)
    assert.strictEqual(list[list.length - 1].name, 'Hardest Rule')
  })

  describe('Update Rule update/patch stuff:', () => {
    let ur
    let notch

    it('should update/patch', async function() {
      const name = 'Softer Rule'
      const testFunc = 'val => val.prop = true'
      ur = await updateRuleDAL.update( uuid, { name, testFunc })
      notch = Date.now()
      assert.strictEqual(ur.uuid, uuid)
      assert.strictEqual(ur.name, name)
      assert.strictEqual(ur.testFunc, testFunc)
    })

    it('updatedAt property should be updated correctly', async function() {
      assert.ok(ur.updatedAt && (notch - ur.updatedAt.getTime() < 100))
    })
  })

  describe('Update Rule remove:', () => {
    let ur

    it('should delete Update Rule by id', async function() {
      await updateRuleDAL.delete(uuid)
      const list = await updateRuleDAL.getList(courseId)
      assert.ok(list)
      assert.ok(list.length === 2)
    })

    it('should delete Update Rules together with Course', async function() {
      await courseDAL.delete(courseId)
      const list = await updateRuleDAL.getList(courseId)
      assert.ok(list)
      assert.ok(list.length === 0)
    })

  })


})
