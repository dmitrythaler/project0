import assert from 'assert'
import type { Keyed } from '@p0/common'

process.env.PGHOST='localhost'
process.env.PGPORT='5432'
process.env.PGDATABASE='tests'
process.env.PGUSER='tester'
process.env.PGPASSWORD='testerwashere'

import { sql, userDAL, UserRole } from '../index'
import type { User } from '../index'

describe('User DAL suite', function () {

  let user: User.Himself
  let uuid: string
  const password = 'DarkerThanBlack'
  const hidden = '<hidden>'

  beforeAll(async function() {

    await sql`DELETE FROM "public"."user"`

    user = {
      email: 'user@domain.com',
      lastName: 'Doe',
      firstName: 'John',
      password,
      isActive: true,
      role: UserRole.User
    }
  })

  afterAll(async function() {
    await sql.end()
  })

  it('should create new User', async function() {
    const u = await userDAL.create(user)
    assert.ok(u)
    assert.ok(u.uuid)
    uuid = u.uuid
    assert.strictEqual(u.email, user.email)
    assert.strictEqual(u.password, hidden)
  })

  it('shouldn\'t create User with the same email', async function() {
    await assert.rejects(
      async function() {
        await userDAL.create(user)
      },
      (err: Keyed) => {
        // console.dir(err, { showHidden: true, depth: 8 })

        assert.ok(err)
        assert.strictEqual(err.constraint_name, 'uq_user_email')
        return true
      }
    )
  })

  it('should retrieve User by id', async function() {
    const u = await userDAL.getById(uuid)
    // console.log(u)
    assert.ok(u)
    assert.ok(u.uuid)
    assert.strictEqual(u.uuid, uuid)
    assert.strictEqual(u.password, hidden)
  })

  it('should retrieve User by email', async function() {
    const u = await userDAL.getByEmail(user.email)
    // console.log(u)
    assert.ok(u)
    assert.strictEqual(u.email, user.email)
    assert.strictEqual(u.password, hidden)
  })

  it('should throw if User not found', async function() {
    await assert.rejects(
      async function() {
        await userDAL.getByEmail('nobody@nowhere.no')
      },
      (err: Keyed) => {
        assert.ok(err)
        assert.strictEqual(err.name, 'API Error')
        assert.strictEqual(err.code, 404)
        // assert.strictEqual(err.received, 0)
        return true
      }
    )
  })

  it('should retrieve list of Courses', async function () {
    let c = await userDAL.create({
      ...user,
      email: 'user2@domain.com'
    })
    assert.ok(c)
    assert.ok(c.uuid)
    c = await userDAL.create({
      ...user,
      email: 'user3@domain.com'
    })
    assert.ok(c)
    assert.ok(c.uuid)

    const list = await userDAL.getList()
    // console.log('+++', list)
    assert.ok(list)
    assert.ok(list.length >= 2)
    assert.strictEqual(list[list.length - 1].email, 'user3@domain.com')
  })

  describe('User update/patch stuff:', () => {
    let u
    let notch

    it('should update/patch', async function() {
      u = await userDAL.update( uuid, { role: UserRole.Manager })
      notch = Date.now()
      assert.strictEqual(u.uuid, uuid)
      assert.strictEqual(u.role, UserRole.Manager)
      assert.strictEqual(u.password, hidden)
    })
    it('updatedAt property should be updated correctly', async function() {
      assert.ok(u.updatedAt && (notch - u.updatedAt.getTime() < 100))
    })
  })

  describe('User auth stuff:', () => {
    let t
    let u
    let notch

    beforeAll(async function() {
      t = await userDAL.getById(uuid)
    })

    it('should login with correct creds', async function() {
      u = await userDAL.login(t.email, password)
      notch = Date.now()
      assert.strictEqual(u.email, t.email)
      assert.strictEqual(u.password, hidden)
    })

    it('lastLogin property should be updated correctly', async function() {
      assert.ok(u.lastLogin && (notch - u.lastLogin.getTime() < 100))
    })
    it('updatedAt property should remain intact', async function() {
      assert.strictEqual(u.updatedAt?.getTime(), t.updatedAt?.getTime())
    })
    it('shouldn\'t login with incorrect creds', async function() {
      const t = await userDAL.getById(uuid)
      await assert.rejects(
        async function() {
          await userDAL.login( t.email, hidden)
        },
        (err: Keyed) => {
          // console.log(err)
          assert.ok(err)
          assert.strictEqual(err.code, 401)
          return true
        }
      )
    })
  })


})
