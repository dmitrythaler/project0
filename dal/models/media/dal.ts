import { extname } from 'node:path'
import {
  APIError,
  cleanUpSlug,
  setCreatedAt,
  validateInput,
  logger
} from '@p0/common'
import { BaseDAL } from '../abstract-dal.ts'
import { setDefaults } from './defs.ts'

import type { DatabaseClient, IndexDefinition } from '../db-client.ts'
import type { EntityList, EntityListMeta } from '../types.ts'
import type { MediaFile, Media } from './defs.ts'
import type { PlayerID, OrgID, MediaID } from '@p0/common/types'

type MediaListMeta = EntityListMeta<MediaID, Media>
type MediaList = EntityList<MediaID, Media>

export type { MediaFile, Media, MediaListMeta, MediaList, PlayerID, OrgID, MediaID }

//  ----------------------------------------------------------------------------------------------//

export class MediaDAL extends BaseDAL<MediaID, Media> {
  protected getEntityName(): string {
    return 'Media'
  }
  protected getCollName(): string {
    return 'media'
  }
  protected getIndexDefinition(): IndexDefinition[] {
    return [{
      spec: { slug: 1 },
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
   * Validate input data and create Media for the given Entity
   *
   * @param {MediaFile[]} files files to be created under the same slug
   * @param {OwnerID} ownerId owner of the media
   * @param {OrgID} orgId org of the media
   * @param {string} slug
   * @returns {Promise<Media[]>}
   */
  async storeMediaData(files: MediaFile[], ownerId: PlayerID, orgId: OrgID, slug: string): Promise<Media[]> {
    const cleanSlug = cleanUpSlug(slug)
    const coll = await this.getColl()

    const records: Media[] = files.map(file =>
      validateInput(
        setCreatedAt(
          setDefaults({
            ...file,
            ownerId,
            orgId,
            slug: cleanSlug,
            ext: extname(file.fileName).slice(1),
          } as Media)
        ),
        ['fileName']
      )
    )

    const { insertedCount } = await coll.insertMany(records)
    logger.dal(`${insertedCount} new Media records successfully created`)
    return records
  }

  /**
   * Update Media with the given slug within the Org
   *
   * @param {MediaID} _id - Media _id
   * @param {string} slug - current slug to group by
   * @param {string} newSlug - to replace with
   * @returns {Promise<number>}
   */
  async updateAllMediaWithSlug(_id: MediaID, newSlug: string): Promise<number> {
    const coll = await this.getColl()
    const media = await coll.findOne({ _id })
    if (!media) {
      throw new APIError(404, `Media with id "${_id}" not found!`)
    }

    const today = new Date()
    const { modifiedCount } = await coll.updateMany(
      { slug: media.slug, orgId: media.orgId },
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
   *
   * @param {MediaID} _id - to find
   * @param {string} newSlug - to replace slug with
   * @returns {Promise<void>}
   */
  async updateMedia(_id: MediaID, newSlug: string): Promise<number> {
    const coll = await this.getColl()
    const { modifiedCount } = await coll.updateOne(
      { _id },
      {
        $set: {
          slug: cleanUpSlug(newSlug),
          updatedAt: new Date()
        }
      })
    if (modifiedCount === 0) {
      throw new APIError(404, `Media with id "${_id}" not found!`)
    }
    logger.dal('Media record successfully updated.')
    return modifiedCount
  }

  /**
   * ???
   *
   * @param media
   * @returns
   */
  async updateMediaStoragePath(media: Partial<Media>[]): Promise<number> {
    const coll = await this.getColl()
    const today = new Date()
    const ops = media.map(m => ({
      updateOne: {
        filter: { _id: m._id },
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
   *
   * @param {MediaListMeta} meta - metadata to filter/sort list
   * @returns {Promise<MediaList>}
   */
  async getList(meta: MediaListMeta = {}): Promise<MediaList> {
    const coll = await this.getColl()
    const records: Media[] = await coll
      .find<Media>(meta.filter || {})
      .sort(meta.sort || {})
      .limit(meta.limit ?? 0)
      .skip(meta.skip ?? 0)
      .toArray()

    const total: number = (meta.limit || meta.skip)
      ? await coll.countDocuments(meta.filter || {})
      : records.length

    logger.dal(`Media list retrieved, ${records?.length} items`)
    return {
      data: records,
      meta: {
        ...meta,
        total
      }
    }
  }

  /**
   * Retrieves Media by id
   *
   * @param {MediaID} _id
   * @returns {Promise<Media>}
   * @throws {APIError(404)} if not found
   */
  async getById(_id: MediaID): Promise<Media> {
    const coll = await this.getColl()
    const media = await coll.findOne({ _id })
    if (!media) {
      throw new APIError(404, `Media with id "${_id}" not found!`)
    }
    logger.dal('Media retrieved by id:', media)
    return media
  }

  /**
   * delete Media by id
   *
   * @param {MediaID} _id
   * @returns {Promise<DBrecord>} - removed Media for possible further processing
   * @throws {APIError(404)} if not found or not accesible
   */
  async delete(_id: MediaID): Promise<Media> {
    const coll = await this.getColl()
    const media = await coll.findOneAndDelete({ _id })
    if (!media) {
      throw new APIError(404, `Media with id "${_id}" not found!`)
    }
    logger.dal(`Media with id "${_id}" deleted`)
    return media
  }

  /**
   * delete Media
   *
   * @param {MediaID[]} _ids
   * @returns {Promise<DBReacord>} - removed Media for possible further processing
   * @throws {APIError(404)} if some record(s) not found or not accessible
   */
  async deleteMany(_ids: MediaID[]): Promise<Partial<Media>[]> {
    const coll = await this.getColl()
    const filterArray = _ids.map(_id => ({ _id }))
    const filter: Record<string, unknown> = { $or: filterArray }
    const found = await coll.find(
      filter,
      { projection: { _id: 1 }}
    ).toArray()
    const lenDiff = filterArray.length - found.length
    if (lenDiff > 0) {
      throw new APIError(404, `${lenDiff} Media records not found!`)
    }
    const { deletedCount } = await coll.deleteMany(filter)
    logger.dal(`${deletedCount} Media data records deleted`)
    return found
  }

}

