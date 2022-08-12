import assert from 'assert'
import * as core from '../index'


describe('Core usage suite', () => {

  const user = {
    email: 'user@domain.com',
    lastName: 'Doe',
    firstName: 'John',
    password: 'Secret666',
    base2Utc: false,
    isActive: true
  }
  let userDB

  it('should convert data\'s keys to snake_case', () => {
    userDB = core.mapToDBRecord(user)
    // console.log(userDB)
    assert.ok(userDB)
    assert.strictEqual(user.lastName, userDB.last_name)
    assert.strictEqual(user.firstName, userDB.first_name)
    assert.strictEqual(user.isActive, userDB.is_active)
    assert.strictEqual(user.base2Utc, userDB.base_2_utc)
    assert.strictEqual(user.email, userDB.email)
  })

  it('should convert data\'s keys to camelCase', () => {
    const userBack = core.mapFromDBRecord(userDB)
    // console.log(userBack)
    assert.ok(userBack)
    assert.deepStrictEqual(user, userBack)
  })
})
