import type * as M from 'mongodb'
import type { WithIdsAndType } from '@p0/common/rbac/types'
import type { IndexDefinition, DatabaseClient } from './db-client.ts'

//  ----------------------------------------------------------------------------------------------//

export abstract class BaseDAL<E extends string, DT extends WithIdsAndType<E>> {
  protected abstract getEntityName(): string
  protected abstract getCollName(): string
  protected abstract getIndexDefinition(): IndexDefinition[]
  protected abstract migrate(): Promise<void>

  protected client: DatabaseClient

  //  ---------------------------------
  constructor(client: DatabaseClient) {
    this.client = client
  }

  async init(migrate: boolean = false) {
    await this.client.setupCollection(this.getCollName(), this.getIndexDefinition())
    if (migrate) {
      await this.migrate()
    }
  }

  /**
   * Get MongoDB collection for the current entity
   * @returns {Promise<M.Collection>}
   */
  async getColl(): Promise<M.Collection<DT>> {
    const db = await this.client.getDb()
    return db.collection<DT>(this.getCollName())
  }

  setDefaults<DT>(val: Partial<DT>): DT {
    return val as DT
  }
}
