import { extname } from 'node:path'
import { ObjectId } from 'mongodb'
import {
  APIError,
  assertMinLength,
  cleanUpSlug,
  logger
} from '@p0/common'

import type * as M from 'mongodb'
import type { DatabaseClient, IndexDefinition } from './db-client'

//  ----------------------------------------------------------------------------------------------//

export interface SelfFile {
  fileName: string
  fileSize: number
  height: number
  width: number
  url?: string
}

interface _Base extends SelfFile {
  slug: string|null
  ext: string
  storagePath?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Self extends _Base {
  _id?: string
  ownerId: string
}

interface DBRecord extends _Base {
  _id?: M.ObjectId
  ownerId: M.ObjectId
}

//  utils/pipes

const oid2String = (_id: ObjectId|string):string => _id.toString('hex')

const setCreatedAt = <T extends Partial<Self>>(media: T): T => ({
  ...media,
  createdAt: new Date()
})

const setUpdatedAt = <T extends Partial<Self>>(media: T): T => ({
  ...media,
  updatedAt: new Date()
})

const setDefaults = <T extends Partial<Self>>(media: T): T => ({
  height: 0,
  width: 0,
  fileSize: 0,
  ...media,
})

const validate = <T extends Self>(media: T): T => {
  if (!media.fileName || !media.fileName.length) {
    throw new APIError(400, `Media validation error: "fileName" property is empty`)
  }
  if (!media.ownerId) {
    throw new APIError(400, `Media validation error: "ownerId" property is absent.`)
  }
  return media
}

const dbRecord2Itself = (media: DBRecord): Self => ({
    ...media,
    ...(media._id ? { _id: media._id.toString('hex') } : null),
    ...(media.ownerId ? { ownerId: media.ownerId.toString('hex') } : null)
  } as Self)

const itself2DBRecord = (media: Self): DBRecord => ({
    ...media,
    ...(media._id ? { _id: new ObjectId(media._id) } : null),
    ...(media.ownerId ? { ownerId: new ObjectId(media.ownerId) } : null)
  } as DBRecord)


//  ----------------------------------------------------------------------------------------------//

export class MediaDAL<Client extends DatabaseClient> {
  private static readonly collName = 'media'
  private static readonly idxDefs: IndexDefinition[] = [{
    spec: { slug: 1 },
    options: {
      unique: false,
      sparse: true
    }
  }]
  private client: Client

  constructor(client: Client) {
    this.client = client
  }

  async init() {
    await this.client.setupCollection(MediaDAL.collName, MediaDAL.idxDefs)
  }

  /**
   * Get MongoDB collection "media"
   * it is public only for testing purposes
   * @returns {Promise<M.Collection>}
   */
  async getColl(): Promise<M.Collection<DBRecord>> {
    const db = await this.client.getDb()
    return db.collection<DBRecord>(MediaDAL.collName)
  }

  /**
   * Validate input data and create Media for the given Entity
   * @param {string} ownerId owner of the media
   * @param {SelfFile[]} files files to be created under the same slug
   * @param {string} slug
   * @returns {Promise<Self[]>}
   */
  async storeMediaData(ownerId: string, files: SelfFile[], slug: string): Promise<Self[]> {
    assertMinLength(files, 1, 'storeMedia, empty media file array provided')
    const coll = await this.getColl()
    const records: Self[] = files.map(media =>
      setCreatedAt({
        ...media,
        ownerId,
        slug: cleanUpSlug(slug),
        ext: extname(media.fileName).slice(1),
      })
    )

    const { insertedCount, insertedIds } = await coll.insertMany(records.map(itself2DBRecord))
    logger.dal(`${insertedCount} new Media records successfully created`)
    return records.map((rec, idx) => ({
      ...rec,
      _id: insertedIds[idx].toString('hex')
    }))
  }

  /**
   * Validate input data and update Media with the given slug
   * @param {string} slug - to group by
   * @param {string} newSlug - to replace with
   * @returns {Promise<DBRecord[]>}
   */
  async updateAllMediaWithSlug(ownerId: string, slug: string, newSlug: string): Promise<number> {
    const coll = await this.getColl()
    const ownerIdObj = new ObjectId(ownerId)
    const today = new Date()
    const { modifiedCount } = await coll.updateMany(
      { slug, ownerId: ownerIdObj },
      {
        $set: {
          slug: cleanUpSlug(newSlug),
          updatedAt: today
        }
      }
    )
    logger.dal(`${modifiedCount} Media records successfully updated.`)
    return modifiedCount
  }

  /**
   * Validate input data and update Media with the given _id
   * @param {string} _id - to find
   * @param {string} newSlug - to replace slug with
   * @returns {Promise<DBRecord|null>}
   */
  async updateMedia(ownerId: string, _id: string, newSlug: string): Promise<number> {
    const coll = await this.getColl()
    const filter = { _id: new ObjectId(_id), ownerId: new ObjectId(ownerId) }
    const { modifiedCount } = await coll.updateOne(
      filter, {
        $set: {
          slug: cleanUpSlug(newSlug),
          updatedAt: new Date()
        }
      })
    logger.dal(`${modifiedCount} Media record successfully updated.`)
    return modifiedCount
  }

  async updateMediaStoragePath(ownerId: string, media: Partial<Self>[]): Promise<number> {
    const coll = await this.getColl()
    const today = new Date()
    const ops = media.map(m => ({
      updateOne: {
        filter: { _id: new ObjectId(m._id), ownerId: new ObjectId(ownerId) },
        update: {
          $set: {
            storagePath: m.storagePath,
            updatedAt: today
          }
        }
      }
    }))
    const { modifiedCount } = await coll.bulkWrite(ops)
    logger.dal(`${modifiedCount} Media record successfully updated with storage paths.`)
    return modifiedCount
  }

  /**
   * Retrieves list of Media
   * @param {[string]} ownerId
   * @param {[string]} slug
   * @returns {Promise<Self[]>}
   */
  async getList(ownerId?: string, slug?: string): Promise<Self[]> {
    const coll = await this.getColl()
    const filter: { ownerId?: ObjectId, slug?: string } = {}
    if (ownerId) {
      filter.ownerId = new ObjectId(ownerId)
    }
    if (slug) {
      filter.slug = slug
    }
    const records = await coll.find(filter).toArray()
    logger.dal(`Media list retrieved, ${records?.length} items, filter: ${JSON.stringify(filter)}`)
    return records.map(dbRecord2Itself)
  }

  /**
   * Retrieves Media by id
   *
   * @param {string|null} ownerId - null for administrator access
   * @param {string} _id
   * @returns {Promise<Self>}
   * @throws {APIError(404)} if not found
   */
  async getById(ownerId: string|null, _id: string): Promise<Self> {
    const coll = await this.getColl()
    const filter: Partial<DBRecord> = {
      _id: new ObjectId(_id)
    }
    if (ownerId) {
      filter.ownerId = new ObjectId(ownerId)
    }
    const media = await coll.findOne(filter) as DBRecord
    if (!media) {
      throw new APIError(404, `Media with id "${_id}" not found or not accessible!`)
    }
    logger.dal('Media retrieved by id:', media)
    return dbRecord2Itself(media)
  }

  /**
   * delete Media by id
   * @param {string} _id
   * @returns {Promise<DBrecord>} - removed Media for possible further processing
   * @throws {APIError(404)} if not found or not accesible
   */
  async delete(ownerId: string|null, _id: string): Promise<Self> {
    const coll = await this.getColl()
    const filter: Partial<DBRecord> = {
      _id: new ObjectId(_id)
    }
    if (ownerId) {
      filter.ownerId = new ObjectId(ownerId)
    }
    const { value: media } = await coll.findOneAndDelete(filter)
    if (!media) {
      throw new APIError(404, `Media with id "${_id}" not found or not accesible!`)
    }
    logger.dal(`Media with id "${_id}" deleted`)
    return dbRecord2Itself(media)
  }

  /**
   * delete Media
   * @param {string[]} _ids
   * @returns {Promise<DBReacord>} - removed Media for possible further processing
   * @throws {APIError(404)} if some record(s) not found or not accessible
   */
  async deleteMany(ownerId: string|null, _ids: string[]): Promise<Partial<Self>[]> {
    const coll = await this.getColl()
    const filterArray = _ids.map(_id => ({ _id: new ObjectId(_id) }))
    const filter: Record<string, unknown> = { $or: filterArray }
    if (ownerId) {
      filter.ownerId = new ObjectId(ownerId)
    }
    const found = await coll.find(
      filter,
      { projection: { _id: 1 }}
    ).toArray()
    const lenDiff = filterArray.length - found.length
    if (lenDiff > 0) {
      throw new APIError(404, `${lenDiff} Media records not found or not accesible!`)
    }
    const { deletedCount } = await coll.deleteMany(filter)
    logger.dal(`${deletedCount} Media data records deleted`)
    return found.map(dbRecord2Itself)
  }

  /**
   * delete Media by owner
   * @param {string} ownerId
   * @param [string] slug
   * @returns {Promise<number>}
   */
  async deleteForOwner(ownerId: string, slug?: string): Promise<number> {
    const coll = await this.getColl()
    const { deletedCount } = await coll.deleteMany({ ownerId: new ObjectId(ownerId), slug })
    logger.dal(`${deletedCount} Medias owned by owner "${ownerId}" ${slug ? `and slug "${slug}" ` : ''}deleted`)
    return deletedCount
  }
}

