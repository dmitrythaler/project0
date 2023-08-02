import { /* streamToBuffer,  */APIError, logger } from '@p0/common'
import * as Minio from 'minio'
import type * as M from 'minio'
import type * as FS from 'node:fs'

//  ----------------------------------------------------------------------------------------------//

export type ClientOptionExt = Partial<M.ClientOptions> & {
  bucket?: string
  rootFolder?: string
}

/**
 * @class MinioService
 * Incapsulates interaction with Minio
 */
class MinioService {
  private bucket: string
  private client: M.Client
  private region: string

  /**
   * @constructor
   * @param {string} [bucket] -
   */
  constructor(opts?: ClientOptionExt) {
    const {
      MINIO_ENDPOINT,
      MINIO_PORT,
      MINIO_ROOT_USER,
      MINIO_ROOT_PASSWORD,
      MINIO_REGION,
      MINIO_BUCKET
    } = process.env
    const options = {
      endPoint: MINIO_ENDPOINT || 'localhost',
      port: MINIO_PORT || 9000,
      useSSL: false,
      accessKey: MINIO_ROOT_USER || '',
      secretKey: MINIO_ROOT_PASSWORD || '',
      region: MINIO_REGION || 'eu-west-2',
      bucket: MINIO_BUCKET || '',
      ...opts,
    }
    this.bucket = options.bucket
    this.region = options.region
    this.client = new Minio.Client(options as M.ClientOptions);
    logger.minio('Minio client initialized with options:', { ...options, secretKey: '********' })
  }

  private assertBucketName() {
    if (!this.bucket) {
      throw new APIError(500, 'MinioService error, bucket name is empty')
    }
  }

  /**
   * setters
   */
  set bucketName(val: string) {
    this.bucket = val
  }
  get bucketName(): string {
    return this.bucket
  }

  /**
   * retrieves list of existing buckets
   *
   * @returns {Promise<M.BucketItemFromList[]>}
   */
  async listBuckets(): Promise<M.BucketItemFromList[]> {
    return this.client.listBuckets()
  }

  /**
   * check if bucket exists
   *
   * @param {string} name - bucket name
   * @returns {Promise<boolean>}
   */
  async bucketExists(name: string = this.bucket): Promise<boolean> {
    return this.client.bucketExists(name)
  }

  /**
   * creates new bucket
   *
   * @param {string} name - bucket name
   * @returns {Promise<void>}
   */
  async createBucket(name: string = this.bucket, switchTo = true): Promise<void> {
    logger.minio(`A new bucket '${name}' will be created.`)
    await this.client.makeBucket(name, this.region)
    this.bucket = switchTo ? name : this.bucket
  }

  /**
   * delete bucket
   *
   * @param {string} name - bucket name
   * @returns {Promise<void>}
   */
  async removeBucket(name: string = this.bucket): Promise<void> {
    logger.minio(`Bucket '${name}' will be deleted.`)
    await this.client.removeBucket(name)
    if (name === this.bucket) {
      this.bucket  = ''
    }
  }

  /**
   * get list of object in the bucket
   *
   * @param {string} name - bucket name
   * @param {string} [prefix] - object name starts with, default ''
   * @param {boolean} [recursive] - scan recursively
   * @returns Promise<M.BucketItem[]>
   */
  async listObjects(prefix = '', recursive = true): Promise<M.BucketItem[]> {
    return new Promise((resolve, reject) => {
      this.assertBucketName()
      const items: M.BucketItem[] = []
      const stream = this.client.listObjects(this.bucket, prefix, recursive)
      stream.on('data', item => {
        items.push(item)
      })
      stream.on('end', () => {
        resolve(items)
      })
      stream.on('error', err => {
        reject(err)
      })
    })
  }

  async emptyBucket(): Promise<void> {
    const objects = await this.listObjects()
    await this.removeObjects(objects.map(o => o.name))
  }

  async presignedPutObjectUrl(pathAndName: string, expirity = 3600): Promise<string> {
    return await this.client.presignedPutObject(this.bucket, pathAndName, expirity)
  }

  /**
   * save object into the bucket
   *
   * @param {string} pathAndName - name
   * @param {Buffer|FS.ReadStream|string} stream - object name starts with, default ''
   * @param {M.ItemBucketMetadata} meta - metadata, for ex { 'Content-Type': 'image/png' }
   * @returns Promise<M.UploadedObjectInfo>
   */
  async putObject(
    pathAndName: string,
    stream: Buffer|FS.ReadStream|string,
    meta?: M.ItemBucketMetadata
  ): Promise<M.UploadedObjectInfo> {
    this.assertBucketName()
    logger.minio(`New object '${pathAndName}' will be stored in the bucket '${this.bucket}'.`)
    return this.client.putObject(this.bucket, pathAndName, stream, meta)
  }

  /**
   * get stat of the object
   *
   * @param {string} pathAndName - obj name
   * @returns Promise<M.BucketItemStat>
   */
  async statObject(pathAndName: string): Promise<M.BucketItemStat> {
    this.assertBucketName()
    return this.client.statObject(this.bucket, pathAndName)
  }

  /**
   * remove object
   *
   * @param {string} pathAndName - obj name
   * @returns Promise<void>
   */
  async removeObject(pathAndName: string): Promise<void> {
    this.assertBucketName()
    logger.minio(`The object '${pathAndName}' will be removed from the bucket '${this.bucket}'.`)
    return this.client.removeObject(this.bucket, pathAndName)
  }

  /**
   * remove objects
   *
   * @param {string[]} pathAndNames - obj names
   * @returns Promise<void>
   */
  async removeObjects(pathAndNames: string[]): Promise<void> {
    this.assertBucketName()
    logger.minio(`${pathAndNames.length} objects will be removed from the bucket '${this.bucket}'.`)
    return this.client.removeObjects(this.bucket, pathAndNames)
  }

  //  ---------------------------------
  private static inst_: MinioService | null = null
  static getMinio = (opts?: ClientOptionExt): MinioService => MinioService.inst_ || (MinioService.inst_ = new MinioService(opts))
}

export const getMinio = MinioService.getMinio
