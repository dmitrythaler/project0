import { streamToBuffer } from "@p0/common"
import { S3 } from "@aws-sdk/client-s3"
import type { CreateBucketCommandOutput, PutObjectCommandOutput } from "@aws-sdk/client-s3"

//  ----------------------------------------------------------------------------------------------//

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION
} = process.env

//  ---------------------------------

/**
 * @class S3Service
 * Incapsulates interaction with AWS S3 service
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/s3.html}
 */
export class AWSS3 {
  private bucket: string | null
  private rootFolder: string
  private client: S3

  /**
   * @constructor
   * @param {string} [bucket] -
   * @param {string} [rootFolder] -
   */
  constructor(bucket?: string, rootFolder = '') {
    this.bucket = bucket || null
    this.rootFolder = rootFolder && !rootFolder.endsWith('/') ? rootFolder + '/' : rootFolder
    this.client = new S3({
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID || '',
        secretAccessKey: AWS_SECRET_ACCESS_KEY || '',
      },
      region: AWS_REGION || 'eu-west-2'
    })
  }

  /**
   * setters
   */
  setBucket(val: string): void {
    this.bucket = val
  }

  setRootFolder(val: string): void {
    this.rootFolder = val && !val.endsWith('/') ? val + '/' : val
  }

  /**
   * creates new bucket
   *
   * @param {string} name - bucket name
   * @returns {Promise<CreateBucketCommandOutput>}
   * @throws
   */
  async createBucket(name: string): Promise<CreateBucketCommandOutput> {
    const data = await this.client.createBucket({ Bucket: name })
    this.bucket = name
    return data
  }

  /**
   * put object into the bucket
   *
   * @param {string} objectName - key
   * @param {string|Buffer} content - content of the object
   * @returns {Promise<CreateBucketCommandOutput>}
   * @throws
   */
  async putObject(objectName: string, content: string | Buffer): Promise<PutObjectCommandOutput> {
    const data = await this.client.putObject({
      Bucket: this.bucket as string,
      Key: this.rootFolder + objectName,
      Body: content
    })
    return data
  }

  /**
   * Retrieves object from the bucket and returns it as a Buffer
   *
   * @param {string} objectName - object name to retrieve
   * @returns {Promise<Buffer>}
   * @throws
   */
  async getObject(objectName: string): Promise<Buffer> {
    const data = await this.client.getObject({
      Bucket: this.bucket as string,
      Key: this.rootFolder + objectName
    })
    return await streamToBuffer(data.Body as NodeJS.ReadableStream)
  }


}
