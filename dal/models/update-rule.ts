import type * as T from 'postgres'
// import postgres from 'postgres'
import {
  APIError,
  mapToDBRecord,
  mapFromDBRecord,
  removeUuid,
  validateInput,
  logger
} from '@p0/common'
import type { Keyed } from '@p0/common'
import type * as Course from './course'
// import { inspect } from 'util'

//  ----------------------------------------------------------------------------------------------//

export type Itself = {
  name: string,
  courseId: string,
  testPath: string,
  testFunc: string,
  updatePath?: string,
  updateFunc?: string
}

export type DBRecord = Itself & {
  uuid?: string,
  createdAt?: Date,
  updatedAt?: Date | null
}

export type DBRecordC = DBRecord & {
  courseName: Course.Itself['name'],
  squidexId: Course.Itself['squidexId'],
  squidexSecret: Course.Itself['squidexSecret']
}

//  ----------------------------------------------------------------------------------------------//
type SqlRecord = Record<string, T.SerializableParameter>

export class UpdateRuleDAL<Sql extends T.Sql<Keyed>>{
  private readonly sql: Sql
  private readonly tbl: T.Helper<string>

  constructor(sql: Sql) {
    this.sql = sql
    this.tbl = sql('public.update-rule')
  }

  getTableName() {
    return this.tbl
  }

  /**
   * Validate input data and create Rule
   * @param {UpdateRule} UpdateRule updateRule data
   * @returns {Promise<DBRecord>}
   * @throws if name duplicates
   */
  async create(ur: Partial<Itself>): Promise<DBRecord> {
    const record: SqlRecord = mapToDBRecord(
      validateInput(ur, ['name', 'courseId', 'testPath', 'testFunc'])
    )
    try {
      const [updateRule] = await this.sql`
        insert into ${this.tbl} ${this.sql(record)}
        returning *
      `
      logger.dal('new UpdateRule successfully created:', updateRule)
      return mapFromDBRecord(updateRule)
    } catch (error) {
      throw new APIError(<Error>error)
    }
  }

  /**
   * Retrieves list of UpdateRules for the given Course
   * @returns {Promise<DBRecord[]>}
   */
  async getList(courseId: string): Promise<DBRecord[]> {
    const rules: DBRecord[] = await this.sql`
      select * from ${this.tbl}
      where course_id = ${courseId}
    `
    logger.dal(`UpdateRules list retrieved for the course ID ${courseId}, ${rules?.length} records`)
    return rules.map(c => mapFromDBRecord(c))
  }

  /**
   * Retrieves list of UpdateRules which can be run by cron, sort by
   * @returns {Promise<DBRecord[]>}
   */
  async getListToRunByCron(): Promise<DBRecordC[]> {
    // TODO: course table as a template param (?)
    const courseTbl = this.sql('public.course')
    const rules: DBRecordC[] = await this.sql`
      select r.*, c.name as course_name, c.squidex_id, c.squidex_secret from ${this.tbl} as r
        left join ${courseTbl} as c on c.uuid = r.course_id
      where r.run_by_cron = true
      order by r.course_id
    `
    logger.dal(`UpdateRules to run by cron list retrieved, ${rules?.length} records`)
    return rules.map(c => mapFromDBRecord(c))
  }

  /**
   * Retrieves UpdateRule by uuid
   * @param {string} uuid - updateRule's id
   * @returns {Promise<DBRecord>}
   * @throws {APIError(404)} if not found
   */
  async getById(uuid: string): Promise<DBRecord> {
    const [updateRule] = await this.sql`
      select * from ${this.tbl}
      where uuid = ${uuid}
    `
    if (!updateRule) {
      throw new APIError(404, `UpdateRule with id "${uuid}" not found!`)
    }

    logger.dal('UpdateRule retrieved by id:', updateRule)
    return mapFromDBRecord(updateRule)
  }

  /**
   * Update/patch UpdateRule
   * @param {string} uuid - updateRule id
   * @param {Partial<Itself>} u updateRule data
   * @returns {Promise<DBRecord>}
   */
  async update(uuid: string, ur: Partial<Itself>): Promise<DBRecord> {
    const record: SqlRecord = mapToDBRecord(
      removeUuid(ur)
    )

    let rules
    try {
      rules = await this.sql`
        update ${this.tbl} set ${this.sql(record)}, "updated_at" = ${this.sql`now()`}
        where "uuid" = ${uuid}
        returning *
      `
    } catch (error) {
      throw new APIError(<Error>error)
    }

    if (!rules[0]) {
      throw new APIError(404, `UpdateRule with id "${uuid}" not found!`)
    }

    logger.dal('UpdateRule updated:', rules[0])
    return mapFromDBRecord(rules[0])

  }

  /**
   * delete UpdateRule
   * @param {string} uuid - updateRule id
   * @returns {Promise<void>
   */
  async delete(uuid: string): Promise<void> {
    await this.sql`
      delete from ${this.tbl} where "uuid" = ${uuid}
    `
    logger.dal(`UpdateRule ${uuid} deleted`)
  }

}
