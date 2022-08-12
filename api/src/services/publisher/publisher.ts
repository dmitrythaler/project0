import JSZip from 'jszip'
import EventEmitter from 'events'
import { AWSS3 } from '../aws.js'
import { SquidexService } from '../squidex/index.js'
import type * as Squidex from '../squidex/index.js'

// to debug something ...
// import type { Keyed } from '@p0/common'
// import fs from 'fs'

//  ----------------------------------------------------------------------------------------------//

const {
  // SQUIDEX_CLIENT_ID,
  // SQUIDEX_CLIENT_SECRET,
  // AWS_ACCESS_KEY_ID,
  // AWS_SECRET_ACCESS_KEY,
  // AWS_REGION,
  AWS_BUCKET,
  AWS_BUCKET_ROOT_FOLDER
} = process.env

export enum Phase {
  NONE = 'NONE',
  LOAD_DATA_START = 'LOAD_DATA_START',
  LOAD_DATA_END = 'LOAD_DATA_END',
  XFORM_DATA_START = 'XFORM_DATA_START',
  XFORM_DATA_END = 'XFORM_DATA_END',
  ZIP_DATA_START = 'ZIP_DATA_START',
  ZIP_DATA_END = 'ZIP_DATA_END',
  UPLOAD_DATA_START = 'UPLOAD_DATA_START',
  UPLOAD_DATA_END = 'UPLOAD_DATA_END',
  ZIP_ASSETS_START = 'ZIP_ASSETS_START',
  ZIP_ASSETS_END = 'ZIP_ASSETS_END',
  UPLOAD_ASSETS_SKIPPED = 'UPLOAD_ASSETS_SKIPPED',
  UPLOAD_ASSETS_START = 'UPLOAD_ASSETS_START',
  UPLOAD_ASSETS_END = 'UPLOAD_ASSETS_END',
  ASSET_LOADED = 'ASSET_LOADED',
}

export enum Result {
  NONE = 'NONE',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE'
}

export type Config = Record<string, boolean>

//  ---------------------------------
export class Publisher extends EventEmitter {
  private config: Config
  private squidex: SquidexService
  private s3: AWSS3

  /**
   * @constructor
   */
  constructor(config?: Config) {
    super()
    this.config = {
      // removeNulls: true,
      // removeEmpties: true,
      // closeIvs: true,
      replaceAssetsIds: true,
      ...config,
    }
    this.squidex = new SquidexService()
    this.s3 = new AWSS3(AWS_BUCKET, AWS_BUCKET_ROOT_FOLDER)
  }

  setConfig(config: Config): void {
    this.config = {
      ...this.config,
      ...config
    }
  }

  /**
   * Loads App Data and returns it as a compressed buffer
   * Every key in the data(Courses, Modules, Topics, Items) will be the JSON file inside the archive
   *
   * @param {Squidex.AppEntities} data - loade app data
   * @returns {Promise<Buffer>} - compressed binary data in Buffer
   */
  async zipAppData(data: Squidex.AppEntities): Promise<Buffer> {
    this.emit('processing', Phase.ZIP_DATA_START)
    const zip = new JSZip()

    for (const key in data) {
      zip.file(`${key}.json`, JSON.stringify(data[key]))
    }

    const buff: Buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 7 }
    })
    this.emit('processing', Phase.ZIP_DATA_END)
    return buff
  }

  /**
   * Loads App Assets(images and sounds) and returns it as a compressed buffer
   *
   * @param {Squidex.AppEntities} data - loade app data
   * @returns {Promise<Buffer>} - compressed binary data in Buffer
   */
  async zipAppAssets(data: Squidex.AppEntities): Promise<Buffer> {
    this.emit('processing', Phase.ZIP_ASSETS_START)

    const zip = new JSZip()
    const assets = data.assets as Squidex.AssetData[] || []
    for (const a of assets) {
      const { type, fileName, id, version } = a
      const href = a._links?.content?.href
      let dstFolder = ''
      if (type?.toLowerCase() === 'audio' ) {
        dstFolder = 'audio'
      } else if (type?.toLowerCase() === 'image') {
        dstFolder = 'images'
      } else {
        this.emit('warning', `Assets (${id}, ${fileName}) has unknown type "${type}"`)
      }
      if (!dstFolder) {
        continue
      }

      const buff = await this.squidex.getAssetContent({ href, version })
      zip.file(`${dstFolder}/${fileName}`, buff)
      this.emit('processing', Phase.ASSET_LOADED, fileName)
    }

    const buff: Buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'STORE'
    })
    this.emit('processing', Phase.ZIP_ASSETS_END)
    return buff
  }

  /**
   * Process everything - extract, compress Squidex App data and assets and then upload to S3
   * S3 objects(files) names combined from <appName>.<version>.<YYYYMMDDHHMMSS>.(data|assets).zip
   *
   * @param {object.string} appName - App name created in Squidex
   * @param {object.number} version - version number
   * @param {object.string} sqxId - squidex creds
   * @param {object.string} sqxSecret - squidex creds
   * @param {object.boolean} loadAssets - guess
   * @param {object.boolean} deleteNulls - xform parameter
   * @param {object.boolean} deleteEmptyString - xform parameter
   * @param {object.boolean} deleteEmptyArrays - xform parameter
   * @returns {Promise<void>}
   */
  async run({
    appName,
    folder,
    prefix,
    version,
    sqxId,
    sqxSecret,
    loadAssets = true,
    deleteNulls = true,
    deleteEmptyString = false,
    deleteEmptyArrays = false
  } : {
    appName: string,
    folder: string,
    prefix: string,
    version: number,
    sqxId: string,
    sqxSecret: string,
    loadAssets,
    deleteNulls,
    deleteEmptyString,
    deleteEmptyArrays
  }): Promise<void> {
    try {
      this.emit('start', appName, version)
      this.squidex.setAppName(appName)
      await this.squidex.setCreds(sqxId, sqxSecret)

      this.emit('processing', Phase.LOAD_DATA_START)
      let data = await this.squidex.loadAppData()
      this.emit('processing', Phase.LOAD_DATA_END, data)

      this.emit('processing', Phase.XFORM_DATA_START)
      data = await this.squidex.xformAll(data, {
        deleteNulls,
        deleteEmptyString,
        deleteEmptyArrays,
      })
      this.emit('processing', Phase.XFORM_DATA_END)

      let buff: Buffer | null = await this.zipAppData(data)

      const baseName = `${folder}/${prefix}${version}/${prefix}${version}`
      let keyName = `${baseName}_json.zip`
      this.emit('processing', Phase.UPLOAD_DATA_START, keyName)
      await this.s3.putObject(keyName, buff)
      buff = null
      // run node with --expose-gc key to allow free memory
      global.gc && global.gc()
      this.emit('processing', Phase.UPLOAD_DATA_END)

      if (loadAssets) {
        buff = await this.zipAppAssets(data)

        keyName = `${baseName}.zip`
        this.emit('processing', Phase.UPLOAD_ASSETS_START, keyName)
        await this.s3.putObject(keyName, buff)
        buff = null
        global.gc && global.gc()
        this.emit('processing', Phase.UPLOAD_ASSETS_END)
      } else {
        this.emit('processing', Phase.UPLOAD_ASSETS_SKIPPED)
      }

      this.emit('stop', Result.SUCCESS)
    } catch (err) {
      this.emit('stop', Result.FAILURE, err)
    }
  }

  /**
   * Retrieves data modified after provided date and returns amounts of records for every entity
   *
   * @param {object.string} appName - App name created in Squidex, like 'test-english0-course'
   * @param {object.string} sqxId - squidex creds
   * @param {object.string} sqxSecret - squidex creds
   * @param {object.Date} after - retrieve everything with lastModified bigger than this
   * @returns {Promise<{ total: number, courses: number, modules: number....}>}
   */
  async getUnpublished({ appName, sqxId, sqxSecret, after }
  : { appName: string, sqxId: string, sqxSecret: string, after?: Date|null })
  : Promise<Squidex.AppEntities & { total: number }> {

    this.squidex.setAppName(appName)
    await this.squidex.setCreds(sqxId, sqxSecret)

    const data = after
      ? await this.squidex.loadDataModifiedAfter(after)
      : await this.squidex.loadAppData()

    const mapped: Squidex.AppEntities & { total: number } = { total: 0 }
    for (const key in data) {
      mapped[key] = data[key].length
      mapped.total += data[key].length
    }
    return mapped
  }
}

