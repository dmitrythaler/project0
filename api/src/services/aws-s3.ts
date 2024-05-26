import { logger } from '@p0/common'
import { streamToBuffer } from "@p0/common"
import {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  HeadBucketCommand,
  DeleteBucketCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import type {
  PutObjectCommandOutput,
  DeleteObjectCommandOutput,
  ListObjectsOutput,
  DeleteBucketCommandOutput,
  HeadObjectCommandOutput
} from '@aws-sdk/client-s3'

//  ----------------------------------------------------------------------------------------------//

export type S3ServiceConfig = {
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  region?: string
}

/**
 * @class S3Service
 * Incapsulates interaction with AWS S3 service
 * @link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/s3.html
 */
export class S3Service {
  private client: S3Client

  /**
   * @constructor
   */
  constructor(conf?: S3ServiceConfig) {
    const {
      AWS_ENDPOINT,
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
      AWS_REGION,
    } = process.env
    this.client = new S3Client({
      endpoint: AWS_ENDPOINT || conf?.endpoint || 'http://localhost:9000',
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID || conf?.accessKeyId || '',
        secretAccessKey: AWS_SECRET_ACCESS_KEY || conf?.secretAccessKey || '',
      },
      // for DigitalOcean, see 1st Warning block there:
      // https://docs.digitalocean.com/products/spaces/how-to/use-aws-sdks/
      region: AWS_REGION || conf?.region || 'us-east-1',
      forcePathStyle: true,
    })
  }

  /**
   * creates new bucket
   *
   * @param bucket - bucket name. Bucket names are unique and have several other constraints.
   * @link https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html
   */
  async createBucket(bucket: string): Promise<string|undefined> {
    const command = new CreateBucketCommand({
      Bucket: bucket,
    })

    const { Location } = await this.client.send(command)
    logger.aws(`Bucket "${bucket}" created with location ${Location}`)
    return Location
  }

  /**
   * check if the bucket exists
   *
   * @param bucket - bucket name
   */
  async bucketExists(bucket: string): Promise<boolean> {
    const command = new HeadBucketCommand({
      Bucket: bucket
    })

    try {
      const response = await this.client.send(command)
      logger.aws(`Bucket "${bucket}", HeadBucketCommand response`, response)
      return true
    } catch (error) {
      logger.aws(error)
      return false
    }
  }

  /**
   * delete bucket
   *
   * @param bucket - bucket name
   */
  async deleteBucket(bucket: string): Promise<DeleteBucketCommandOutput> {
    const command = new DeleteBucketCommand({
      Bucket: bucket,
    })

    const response = await this.client.send(command)
    logger.aws(`Bucket "${bucket}" deleted with response`, response)
    return response
  }

  /**
   * put object into the bucket
   *
   * @param bucket - name of the bucket
   * @param objectName - object path/name to store
   * @param content - content of the object
   */
  async putObject(bucket: string, objectName: string, content: string | Buffer): Promise<PutObjectCommandOutput> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectName,
      Body: content
    })

    const response = await this.client.send(command)
    logger.aws(`Bucket "${bucket}", object "${objectName}" created with response:`, response)
    return response
  }

  /**
   * Retrieves object from the bucket and returns it as a Buffer
   *
   * @param bucket - name of the bucket
   * @param objectName - object path/name to retrieve
   */
  async getObject(bucket: string, objectName: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: objectName,
    })

    const response = await this.client.send(command)
    logger.aws(`Bucket "${bucket}", object "${objectName}" retrieved`)
    // The Body object also has 'transformToByteArray' and 'transformToWebStream' methods.
    return await streamToBuffer(response.Body as NodeJS.ReadableStream)
  }

  async getObjectMeta(bucket: string, objectName: string): Promise<HeadObjectCommandOutput|false> {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: objectName,
    })

    try {
      const response = await this.client.send(command)
      logger.aws(`Bucket "${bucket}", object "${objectName}" meta:`, response)
      return response
    } catch (error) {
      logger.aws(`Bucket "${bucket}", object "${objectName}" meta retrieval error:`, error)
      return false
    }
  }

  /**
   * Retrieves list of object from the bucket as an arroy of stats
   *
   * @param bucket - name of the bucket
   * @returns list of objects stats:
   * [{
   *   Key: 'one/pic.1.png',
   *   LastModified: 2024-05-17T21:22:40.683Z,
   *   ETag: '"5b05c2b358c832ff1896394f9346a50e"',
   *   Size: 276321, ...
   * }, ...]
   */
  async listObjects(bucket: string): Promise<Exclude<ListObjectsOutput['Contents'], undefined>> {
    const command = new ListObjectsV2Command({
      Bucket: bucket
    })
    const { Contents } = await this.client.send(command)
    logger.aws(`Bucket "${bucket}", ${Contents?.length || 0} objects listed`)
    return Contents || []
  }

  /**
   * delete object in the bucket
   *
   * @param bucket name
   * @param objectName - object path/name to remove
   */
  async deleteObject(bucket: string, objectName: string): Promise<DeleteObjectCommandOutput> {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: objectName,
    })
    const response = await this.client.send(command)
    logger.aws(`Bucket "${bucket}", object "${objectName}" deleted with response:`, response)
    return response
  }

  /**
   *
   * @param bucket - name of the bucket
   * @param objectName - object path/name to get presigned url to upload
   * @param expiresIn - the URL expires in this amount of seconds
   * @returns url string
   */
  async getPresignedUrl(bucket: string, objectName: string, expiresIn: number = 3600 ): Promise<string> {
    const command = new PutObjectCommand({ Bucket: bucket, Key: objectName })
    const url = await getSignedUrl(this.client, command, { expiresIn })
    logger.aws(`Bucket "${bucket}", object "${objectName}", presigned url created`)
    return url
  }

  //  ---------------------------------
  private static inst_: S3Service | null = null
  static getS3 = async (conf?: S3ServiceConfig): Promise<S3Service> => {
    if (!S3Service.inst_) {
      S3Service.inst_ = new S3Service(conf)
    }
    return S3Service.inst_
  }
}

export const getS3 = S3Service.getS3
