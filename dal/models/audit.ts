// import { inspect } from 'util'
// import postgres from 'postgres'
import {
  APIError,
  mapToDBRecord,
  mapFromDBRecord,
  validateInput,
  logger
} from '@p0/common'

import type * as T from 'postgres'
import type { Keyed } from '@p0/common'

//  ----------------------------------------------------------------------------------------------//

export enum ActionType {
  Create = 'create',
  Publish = 'publish',
  Login = 'login',
  Update = 'update',
  Delete = 'delete'
}

export enum SubjectType {
  User = 'user',
  Course = 'course'
}

export type Itself = {
  uuid?: string,
  takenOn?: Date,
  actorId: string,
  actionType: ActionType,
  subjectType: SubjectType,
  subjectId: string,
  data: any
}

//  ----------------------------------------------------------------------------------------------//
type SqlRecord = Record<string, T.SerializableParameter>

export class AuditDAL<Sql extends T.Sql<Keyed>>{
  private readonly sql: Sql
  private readonly tbl: T.Helper<string>

  constructor(sql: Sql) {
    this.sql = sql
    this.tbl = sql('public.audit')
  }

  getTableName() {
    return this.tbl
  }

  /**
   * Validate input data and create Audit Record
   * @param {Itself} a audit data
   * @returns {Promise<Itself>}
   * @throws if name duplicates
   */
  async create(a: Partial<Itself>, trx?: Sql): Promise<Itself> {
    const record: SqlRecord = mapToDBRecord(
      validateInput(a, ['actorId', 'actionType', 'subjectType', 'subjectId'])
    )
    const sql = trx || this.sql
    try {
      const [ar] = await sql`
        insert into ${this.tbl} ${this.sql(record)}
        returning *
      `
      logger.dal('new Audit Record successfully created:', ar)
      return mapFromDBRecord(ar)
    } catch (error) {
      throw new APIError(<Error>error)
    }
  }

  /**
   * Retrieves list of Audit Records
   * @returns {Promise<Itself[]>}
   */
  async getList(): Promise<Itself[]> {
    const ars: Itself[] = await this.sql`
      select * from ${this.tbl}
    `
    logger.dal(`Audit Records list retrieved, ${ars?.length} items`)
    return ars.map(ar => mapFromDBRecord(ar))
  }

  /**
   * Retrieves Audit Record by uuid
   * @param {string} uuid - ar's id
   * @returns {Promise<Itself>}
   * @throws {APIError(404)} if not found
   */
  async getById(uuid: string): Promise<Itself> {
    let rows
    try {
      rows = await this.sql`
        select * from ${this.tbl}
        where uuid = ${uuid}
      `
    } catch (err: any) {
      logger.error(err.message, err.stack)
      throw new APIError(404, `Audit Record with id "${uuid}" not found!`)
    }
    if (!rows[0]) {
      throw new APIError(404, `Audit Record with id "${uuid}" not found!`)
    }

    logger.dal('Audit Record retrieved by id:', rows[0])
    return mapFromDBRecord(rows[0])
  }

}
