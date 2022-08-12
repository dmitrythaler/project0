import type * as T from 'postgres'
import {
  APIError,
  mapToDBRecord,
  mapFromDBRecord,
  logger
} from '@p0/common'
import type { Keyed } from '@p0/common'
// import { inspect } from 'util'

//  ----------------------------------------------------------------------------------------------//

export type ConfigData = {
  [key: string]: string | number | boolean
}
export type Itself = {
  data: ConfigData
}

export type DBRecord = Itself & {
  createdAt?: Date,
  updatedAt?: Date | null
}

//  utils/pipes
//  ----------------------------------------------------------------------------------------------//
type SqlRecord = Record<string, T.SerializableParameter>

export class ConfigDAL<Sql extends T.Sql<Keyed>>{
  private readonly sql: Sql
  private readonly tbl: T.Helper<string>

  constructor(sql: Sql) {
    this.sql = sql
    this.tbl = sql('public.config')
  }

  getTableName() {
    return this.tbl
  }

  /**
   * Retrieves Config
   * @returns {Promise<DBRecord>}
   */
  async getData(): Promise<DBRecord> {
    const [row] = await this.sql`
      select * from ${this.tbl}
      limit 1
    `
    if (!row) {
      throw new APIError(500, `Config table is empty`)
    }

    logger.dal('Config retrieved:', row)
    return mapFromDBRecord(row)
  }

  /**
   * Patch Config data
   * @param {ConfigData} cd config object
   * @returns {Promise<DBRecord>}
   */
  async update(cd: ConfigData): Promise<DBRecord> {
    const record: SqlRecord = mapToDBRecord({ data: cd })

    const [row] = await this.sql`
      update ${this.tbl} set ${this.sql(record)}, "updated_at" = ${this.sql`now()`}
      returning *
    `
    if (!row) {
      throw new APIError(500, `Config empty, update failed`)
    }

    logger.dal('Config successfully updated:', row)
    return mapFromDBRecord(row)
  }
}

