import assert from 'assert'
import type { Keyed } from '@p0/common'
// import { inspect } from 'util'

process.env.PGHOST = 'localhost'
process.env.PGPORT = '5432'
process.env.PGDATABASE = 'tests'
process.env.PGUSER = 'tester'
process.env.PGPASSWORD = 'testerwashere'

import { sql, auditDAL, userDAL, UserRole, SubjectType, ActionType } from '../index'
import type { Audit, User } from '../index'

describe('Audit DAL suite', function () {

  let audit: Audit.Itself
  let uuid: string
  let user: User.DBRecord

  beforeAll(async function() {
    await sql`DELETE FROM "public"."audit"`
    await sql`DELETE FROM "public"."user"`

    user = await userDAL.create({
      email: 'user@domain.com',
      lastName: 'Doe',
      firstName: 'John',
      password: 'DarkerThanCoalMine',
      isActive: true,
      role: UserRole.User
    })
    assert.ok(user)

    audit = {
      actionType: ActionType.Create,
      actorId: <string>user.uuid,
      subjectType: SubjectType.Course,
      subjectId: <string>user.uuid,
      data: { some: '0' }
    }
  })

  afterAll(async function() {
    await sql.end()
  })

  //  ---------------------------------

  it('should create new Audit Record', async function() {
    const ar = await auditDAL.create(audit)
    assert.ok(ar)
    assert.ok(ar.uuid)
    uuid = ar.uuid
    assert.ok(ar.takenOn)
    assert.strictEqual(ar.actorId, user.uuid)
  })

  it('shouldn\'t create Audit Record with insufficient data', async function() {
    await assert.rejects(
      async function() {
        const ar: Partial<Audit.Itself> = {
          ...audit
        }
        delete ar.actorId
        await auditDAL.create(ar)
      },
      (err: Keyed) => {
        assert.ok(err)
        assert.strictEqual(err.code, 400)
        return true
      }
    )
  })

  it('should retrieve Audit Record by id', async function() {
    const ar = await auditDAL.getById(uuid)
    assert.ok(ar)
    assert.ok(ar.uuid)
    assert.ok(ar.takenOn)
  })

  it('should throw if Audit Record not found', async function() {
    // b0d0d4eb-35c4-4d03-b4df-f7415716284d
    await assert.rejects(
      async function() {
        await auditDAL.getById('something-non-existent')
      },
      (err: Keyed) => {
        assert.ok(err)
        assert.strictEqual(err.name, 'API Error')
        assert.strictEqual(err.code, 404)
        return true
      }
    )
  })

  it('should retrieve list of Audit Records', async function () {
    let ar = await auditDAL.create(audit)
    assert.ok(ar)
    assert.ok(ar.uuid)
    ar = await auditDAL.create(audit)
    assert.ok(ar)
    assert.ok(ar.uuid)
    ar = await auditDAL.create(audit)
    assert.ok(ar)
    assert.ok(ar.uuid)

    const list = await auditDAL.getList()
    assert.ok(list)
    assert.ok(list.length >= 2)
  })

})
