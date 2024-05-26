import { extname } from 'node:path'
import {
  APIError,
  validateInput,
  removeProp,
  setCreatedAt,
  setUpdatedAt,
  logger
} from '@p0/common'
import { BaseDAL } from '../abstract-dal.ts'
import { setDefaults } from './defs.ts'

import type * as M from 'mongodb'
import type { OrgID } from '@p0/common/types'
import type { DatabaseClient, IndexDefinition } from '../db-client.ts'
import type { EntityList, EntityListMeta } from '../types.ts'
import type { Org } from './defs.ts'

type OrgListMeta = EntityListMeta<OrgID, Org>
type OrgList = EntityList<OrgID, Org>

export type { Org, OrgListMeta, OrgList, OrgID }

//  ----------------------------------------------------------------------------------------------//

export class OrgDAL extends BaseDAL<OrgID, Org> {
  protected getEntityName(): string {
    return 'Org' as const
  }
  protected getCollName(): string {
    return 'orgs'
  }
  protected getIndexDefinition(): IndexDefinition[] {
    return [{
      spec: { ownerId: 1 },
      options: { unique: false }
    }, {
      spec: { name: 1 },
      options: {
        unique: false,
        sparse: true
      }
    }]
  }
  protected async migrate() {}

  //  ---------------------------------
  constructor(client: DatabaseClient) {
    super(client)
  }

  /**
   * Validate input data and create Org
   *
   * @param {Org} org - Org data
   * @returns {Promise<Org>}
   */
  async create(org: Org): Promise<Org> {
    let record = setCreatedAt(
      setDefaults(
        validateInput(org, ['ownerId'])
      )
    )

    const coll = await this.getColl()
    await coll.insertOne(record as M.OptionalUnlessRequiredId<Org>)
    logger.dal(`new ${this.getEntityName()} successfully created:`, record)
    return record
  }

  /**
   * Retrieves list of Orgs
   *
   * @param {EntityListMeta<Org>} meta - metadata to filter/sort list
   * @returns
   */
  async getList(meta: OrgListMeta = {}): Promise<OrgList> {
    const coll = await this.getColl()
    const entities: Org[] = await coll
      .find<Org>(meta.filter || {})
      .sort(meta.sort || {})
      .limit(meta.limit ?? 0)
      .skip(meta.skip ?? 0)
      .toArray()

    const total: number = (meta.limit || meta.skip)
      ? await coll.countDocuments(meta.filter || {})
      : entities.length

    logger.dal(`${this.getEntityName()} list retrieved, ${entities?.length || 0} items`)
    return {
      data: entities,
      meta: {
        ...meta,
        total
      }
    }
  }

  /**
   * Retrieves Org by id
   *
   * @param {OrgID} _id - entity's id
   * @returns {Promise<Org>}
   * @throws {APIError(404)} if not found
   */
  async getById(_id: OrgID): Promise<Org> {
    const coll = await this.getColl()
    const record = await coll.findOne({ _id } as M.Filter<Org>) as Org

    if (!record) {
      throw new APIError(404, `${this.getEntityName()} with id "${_id}" not found!`)
    }

    logger.dal(`${this.getEntityName()} retrieved by id:`, record)
    return record
  }

  /**
   * Update/patch Org
   *
   * @param {OrgID} _id - entity id
   * @param {Partial<Org>} org entity data
   * @returns {Promise<Org>}
   */
  async update(_id: OrgID, org: Partial<Org>): Promise<Org> {
    const record = setUpdatedAt(removeProp(org, '_id'))
    const coll = await this.getColl()
    let res: M.UpdateResult
    res = await coll.updateOne({ _id } as M.Filter<Org>, { $set: record })
    if (!res.modifiedCount) {
      throw new APIError(404, `${this.getEntityName()} with id "${_id}" not found!`)
    }

    const entity = await this.getById(_id)
    logger.dal(`${this.getEntityName()} successfully updated:`, entity)
    return entity
  }

  /**
   * delete Org
   *
   * @param {OrgID} _id - entity id'
   * @returns {Promise<void>
   */
  async delete(_id: OrgID): Promise<void> {
    const coll = await this.getColl()
    const res: M.DeleteResult = await coll.deleteOne({ _id } as M.Filter<Org>)
    if (!res.deletedCount) {
      throw new APIError(404, `${this.getEntityName()} with id "${_id}" not found!`)
    }
    logger.dal(`${this.getEntityName()} with id "${_id}" deleted`)
  }
}

