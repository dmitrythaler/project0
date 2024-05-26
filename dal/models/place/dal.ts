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
import type { PlaceID } from '@p0/common/types'
import type { DatabaseClient, IndexDefinition } from '../db-client.ts'
import type { EntityList, EntityListMeta } from '../types.ts'
import type { Place } from './defs.ts'

type PlaceListMeta = EntityListMeta<PlaceID, Place>
type PlaceList = EntityList<PlaceID, Place>

export type { Place, PlaceListMeta, PlaceList, PlaceID }

//  ----------------------------------------------------------------------------------------------//

export class PlaceDAL extends BaseDAL<PlaceID, Place> {
  protected getEntityName(): string {
    return 'Place' as const
  }
  protected getCollName(): string {
    return 'places'
  }
  protected getIndexDefinition(): IndexDefinition[] {
    return [{
      spec: { ownerId: 1 },
      options: { unique: false }
    }, {
      spec: { orgId: 1 },
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
   * Validate input data and create Place
   *
   * @param {Place} place - Place data
   * @returns {Promise<Place>}
   */
  async create(place: Place): Promise<Place> {
    let record = setCreatedAt(
      setDefaults(
        validateInput(place, ['ownerId', 'orgId', 'name'])
      )
    )

    const coll = await this.getColl()
    await coll.insertOne(record as M.OptionalUnlessRequiredId<Place>)
    logger.dal(`new ${this.getEntityName()} successfully created:`, record)
    return record
  }

  /**
   * Retrieves list of Places
   *
   * @param {EntityListMeta<Place>} meta - metadata to filter/sort list
   * @returns
   */
  async getList(meta: PlaceListMeta = {}): Promise<PlaceList> {
    const coll = await this.getColl()
    const entities: Place[] = await coll
      .find<Place>(meta.filter || {})
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
   * Retrieves Place by id
   *
   * @param {PlaceID} _id - entity's id
   * @returns {Promise<Place>}
   * @throws {APIError(404)} if not found
   */
  async getById(_id: PlaceID): Promise<Place> {
    const coll = await this.getColl()
    const record = await coll.findOne({ _id } as M.Filter<Place>) as Place

    if (!record) {
      throw new APIError(404, `${this.getEntityName()} with id "${_id}" not found!`)
    }

    logger.dal(`${this.getEntityName()} retrieved by id:`, record)
    return record
  }

  /**
   * Update/patch Place
   *
   * @param {PlaceID} _id - entity id
   * @param {Partial<Place>} place entity data
   * @returns {Promise<Place>}
   */
  async update(_id: PlaceID, place: Partial<Place>): Promise<Place> {
    const record = setUpdatedAt(removeProp(place, '_id'))
    const coll = await this.getColl()
    let res: M.UpdateResult
    res = await coll.updateOne({ _id } as M.Filter<Place>, { $set: record })
    if (!res.modifiedCount) {
      throw new APIError(404, `${this.getEntityName()} with id "${_id}" not found!`)
    }

    const entity = await this.getById(_id)
    logger.dal(`${this.getEntityName()} successfully updated:`, entity)
    return entity
  }

  /**
   * delete Place
   *
   * @param {PlaceID} _id - entity id'
   * @returns {Promise<void>
   */
  async delete(_id: PlaceID): Promise<void> {
    const coll = await this.getColl()
    const res: M.DeleteResult = await coll.deleteOne({ _id } as M.Filter<Place>)
    if (!res.deletedCount) {
      throw new APIError(404, `${this.getEntityName()} with id "${_id}" not found!`)
    }
    logger.dal(`${this.getEntityName()} with id "${_id}" deleted`)
  }
}

