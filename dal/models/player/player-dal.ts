import bcrypt from 'bcrypt'
import {
  APIError,
  removeProp,
  validateInput,
  setCreatedAt,
  setUpdatedAt,
  logger
} from '@p0/common'
import {
  validatePassword,
  validateOrRemovePassword,
  hashPassword,
  hidePassword,
} from './defs.ts'
import { BaseDAL } from '../abstract-dal.ts'

import type * as M from 'mongodb'
import type { PlayerID } from '@p0/common/types'
import type { DatabaseClient } from '../db-client.ts'
import type { Player } from './defs.ts'
import type { EntityListMeta, EntityList } from '../types.ts'

//  ----------------------------------------------------------------------------------------------//

export abstract class PlayerDAL<Entity extends Player> extends BaseDAL<PlayerID, Entity> {

  //  ---------------------------------
  constructor(client: DatabaseClient) {
    super(client)
  }

  /**
   * Validate input data and create Player
   *
   * @param {Entity} u - Entity data
   * @returns {Promise<Entity>}
   */
  async create(u: Entity): Promise<Entity> {
    let record = hashPassword(
      validatePassword(
        setCreatedAt(
          this.setDefaults<Entity>(
            validateInput(u, ['email', 'fullName', 'password', 'role'])
          )
        )
      )
    )

    //
    try {
      const coll = await this.getColl()
      await coll.insertOne(record as M.OptionalUnlessRequiredId<Entity>)
      record = hidePassword(record)

      logger.dal(`new ${this.getEntityName()} successfully created:`, record)
      return record
    } catch (error) {
      throw ((<M.MongoError>error).code === 11000
        ? new APIError(400, `A ${this.getEntityName()} with the same email already exists.`)
        : error
      )
    }
  }

  /**
   * Retrieves list of Players
   *
   * @param {EntityListMeta<Entity>} meta - metadata to filter/sort list
   * @returns
   */
  async getList(meta: EntityListMeta<PlayerID, Entity> = {}): Promise<EntityList<PlayerID, Entity>> {
    const coll = await this.getColl()
    const entities: Entity[] = await coll
      .find<Entity>(meta.filter || {})
      .sort(meta.sort || {})
      .limit(meta.limit ?? 0)
      .skip(meta.skip ?? 0)
      .toArray()

    const total: number = (meta.limit || meta.skip)
      ? await coll.countDocuments(meta.filter || {})
      : entities.length

    logger.dal(`${this.getEntityName()} list retrieved, ${entities?.length} items`)
    return {
      data: entities.map(hidePassword),
      meta: {
        ...meta,
        total
      }
    }
  }

  /**
   * Retrieves Player by id
   *
   * @param {PlayerID} _id - entity's id
   * @returns {Promise<Entity>}
   * @throws {APIError(404)} if not found
   */
  async getById(_id: PlayerID): Promise<Entity> {
    const coll = await this.getColl()
    const record = await coll.findOne({ _id } as M.Filter<Entity>) as Entity

    if (!record) {
      throw new APIError(404, `${this.getEntityName()} with id "${_id}" not found!`)
    }

    const entity = hidePassword(record)
    logger.dal(`${this.getEntityName()} retrieved by id:`, entity)
    return entity
  }

  /**
   * Retrieves Player by email
   *
   * @param {string} email - entity's email
   * @returns {Promise<Entity>}
   * @throws {APIError(404)} if not found
   */
  async getByEmail(email: string): Promise<Entity> {
    const coll = await this.getColl()
    const record = await coll.findOne({ email } as M.Filter<Entity>) as Entity

    if (!record) {
      throw new APIError(404, `${this.getEntityName()} with email "${email}" not found!`)
    }

    const entity = hidePassword(record)
    logger.dal(`${this.getEntityName()} retrieved by id:`, entity)
    return entity
  }

  /**
   * Update/patch Player
   *
   * @param {PlayerID} _id - entity id
   * @param {Partial<Entity>} u entity data
   * @returns {Promise<Entity>}
   */
  async update(_id: PlayerID, u: Partial<Entity>): Promise<Entity> {
    const record = setUpdatedAt(
      removeProp(
        hashPassword(
          validateOrRemovePassword(u)
        ) as Entity,
        '_id'
      )
    )

    const coll = await this.getColl()
    let res: M.UpdateResult
    try {
      res = await coll.updateOne({ _id } as M.Filter<Entity>, { $set: record })
    } catch (error) {
      throw ((<M.MongoError>error).code === 11000
        ? new APIError(400, `A ${this.getEntityName()} with the same email already exists.`)
        : error
      )
    }

    if (!res.modifiedCount) {
      throw new APIError(404, `${this.getEntityName()} with id "${_id}" not found!`)
    }

    const entity = await this.getById(_id)
    logger.dal(`${this.getEntityName()} successfully updated:`, entity)
    return entity
  }

  /**
   * login and update Player's lastLogin property
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Entity>}
   */
  async login(email: string, password: string): Promise<Entity> {
    const coll = await this.getColl()
    const entity = (await coll.findOne({ email } as M.Filter<Entity>) as Entity)

    if (!entity) {
      throw new APIError(401, 'Login failed, incorrect creds provided!')
    }

    if (!entity.isActive) {
      throw new APIError(403, `Login failed, ${this.getEntityName()} is suspended!`)
    }

    if (!bcrypt.compareSync(password, entity.password)) {
      throw new APIError(401, 'Login failed, incorrect creds provided!')
    }

    const now = new Date()
    await coll.updateOne(
      { email } as M.Filter<Entity>,
      { $set: { lastLogin: now } as M.MatchKeysAndValues<Entity> }
    )

    logger.dal(`${this.getEntityName()} with "${email}" successfully logged in.`)
    return hidePassword({
      ...entity,
      lastLogin: now
    })
  }

  /**
   * delete Player
   *
   * @param {PlayerID} _id - entity id'
   * @returns {Promise<void>
   */
  async delete(_id: PlayerID): Promise<void> {
    const coll = await this.getColl()
    const res: M.DeleteResult = await coll.deleteOne({ _id } as M.Filter<Entity>)
    if (!res.deletedCount) {
      throw new APIError(404, `${this.getEntityName()} with id "${_id}" not found!`)
    }
    logger.dal(`${this.getEntityName()} with id "${_id}" deleted`)
  }
}
