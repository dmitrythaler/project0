import path from 'node:path'
import { fileURLToPath } from 'url'

import postgres from 'postgres'
import { APIError } from '@p0/common'
import { Migration } from 'lean-pg-migrate'

import { UserDAL, UserRole } from './models/user.js'
import { CourseDAL } from './models/course.js'
import { UpdateRuleDAL } from './models/update-rule.js'
import { AuditDAL, ActionType, SubjectType } from './models/audit.js'
import { ConfigDAL } from './models/config.js'

import type * as T from 'postgres'
import type { Keyed } from '@p0/common'
import type * as User from './models/user.js'
import type * as Course from './models/course.js'
import type * as Audit from './models/audit.js'
import type * as Config from './models/config.js'
import type * as UpdateRule from './models/update-rule.js'

export type DBConnection = T.Options<Record<string, any>>
export type Sql = T.Sql<Keyed>
export type SqlRecord = Record<string, T.SerializableParameter>

export type {
  User,
  Course,
  Audit,
  UpdateRule,
  Config
}

export {
  UserRole,
  ActionType,
  SubjectType
}

//  ----------------------------------------------------------------------------------------------//


export const initDAL = async () => {
  const {
    USER,
    PGHOST,
    PGPORT,
    PGDATABASE,
    PGUSER,
    PGPASSWORD
  } = process.env

  const config = {
    database: PGDATABASE || USER,
    host: PGHOST || 'localhost',
    port: parseFloat(PGPORT || '') || 5432,
    username: PGUSER || USER,
    password: PGPASSWORD,
  }

  let sql
  let userDAL: UserDAL<Sql>
  let courseDAL: CourseDAL<Sql>
  let auditDAL: AuditDAL<Sql>
  let updateRuleDAL: UpdateRuleDAL<Sql>
  let configDAL: ConfigDAL<Sql>

  const __dirname = path.dirname(fileURLToPath(import.meta.url))

  try {

    // run migrations before DAL init
    const mg = await Migration.initialize({
      ...config,
      migrationsDir: path.join(__dirname, './migrations'),
      silent: false
    })
    await mg.up()
    await mg.end()

    // here we go
    sql = postgres({
      ...config,
      idle_timeout: 30,
      max: 10
    })

    userDAL = new UserDAL<Sql>(sql)
    courseDAL = new CourseDAL<Sql>(sql)
    auditDAL = new AuditDAL<Sql>(sql)
    updateRuleDAL = new UpdateRuleDAL<Sql>(sql)
    configDAL = new ConfigDAL<Sql>(sql)

    return {
      sql,
      config,
      userDAL,
      courseDAL,
      auditDAL,
      updateRuleDAL,
      configDAL
    }

  } catch (err) {
      throw new APIError(<Error>err, 'DAL initialization error')
  }
}

const {
  sql,
  config,
  userDAL,
  courseDAL,
  auditDAL,
  updateRuleDAL,
  configDAL
} = await initDAL()

export {
  sql,
  config,
  userDAL,
  courseDAL,
  auditDAL,
  updateRuleDAL,
  configDAL
}
