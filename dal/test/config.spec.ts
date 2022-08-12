import assert from 'assert'
import type { Keyed } from '@p0/common'
// import { inspect } from 'util'

process.env.PGHOST = 'localhost'
process.env.PGPORT = '5432'
process.env.PGDATABASE = 'tests'
process.env.PGUSER = 'tester'
process.env.PGPASSWORD = 'testerwashere'

import { sql, configDAL } from '../index'
// import type { Config } from '../index'

describe('Config DAL', function () {

  const config = {
    recipients: 'user@project-zero.org',
    cron: '00 09 * * 1-5',
    deleteNulls: true,
    deleteEmptyStrings: false,
    someNumber: 42
  }

  afterAll(async function() {
    await sql.end()
  })

  //  ---------------------------------

  it('should update Config Record', async function() {
    const conf = await configDAL.update(config)
    // console.log(conf)
    assert.ok(conf)
  })

  it('should retrieve Config Record', async function() {
    const conf = await configDAL.getData()
    // console.log(conf)
    assert.ok(conf)
    assert.deepStrictEqual(conf.data, config)
  })

})
