import axios/* , { AxiosResponse } */ from 'axios'
import { v4 as uuid } from 'uuid'
import { logger, APIError, ColorLevel } from '@p0/common'
import { mapAppData } from './map.js'
import { Bulker } from './bulker.js'

import type { BulkUpdateConfig } from './bulker.js'
import type { AxiosInstance, AxiosError } from 'axios'
import type { Keyed } from '@p0/common'
// import { stringify } from 'querystring'


//  ----------------------------------------------------------------------------------------------//
//  types defs
type SingleSchemaField = {
  fieldId: number
  name: string
  type: string
  refId?: string
}

type SchemaField = SingleSchemaField & {
  nested?: SingleSchemaField[]
}

type Schema = {
  id: string
  name: string
  type: string
  fields: SchemaField[]
}

type Prop = string | number

export type DataQuery = {
  app?: string
  entity?: string
  id?: string
  limit?: number
  skip?: number
  query?: Keyed
}

export type AssetQuery = {
  app?: string
  id?: string
  slug?: string
  version?: number
  href?: string
}

export type Entities = {
  total: number,
  items: Keyed[]
}

export type AppEntities = Keyed<any>

export type AssetData = {
  id: string
  fileName: string
  slug?: string
  fileSize?: number
  fileVersion?: string
  type?: string
  created?: string
  lastModified?: string
  version?: number
  contentHref?: string
  _links?: {
    self?: { href: string, method: string }
    content?: { href: string, method: string }
    'content/slug'?: { href: string, method: string }
  },
  ref?: boolean
}

export type AssetsData = {
  total: number
  items: AssetData[]
}

export type AssetContent = {
  id?: string
  fileName: string
  data: Buffer
}

export type XformConfig = {
  deleteNulls: boolean
  deleteEmptyString: boolean
  deleteEmptyArrays: boolean
}

//  ---------------------------------

const {
  SQUIDEX_CLIENT_ID,
  SQUIDEX_CLIENT_SECRET
} = process.env

const axiosError2API = (prefix: string, err: AxiosError) => {
  if (err.response) {
    const { data, status, statusText } = err.response
    const msg = `${prefix}: ${statusText} (${data.message || 'No msg'}: ${(data.details || ['No details']).join(', ')})`
    logger.error(msg, { data, status })
    return new APIError(status, msg)
  }
  const msg = `${prefix}:`
  logger.error(msg, err)
  return new APIError(500, msg)
}

//  ---------------------------------

/**
 * @class SquidexService
 * Incapsulates interaction with Squidex headless CMS
 */
export class SquidexService {
  private token: string | null
  private clientId: string | null
  private clientSecret: string | null
  private instance: AxiosInstance
  private appName: string
  private schemas: Schema[] | null

  /**
   * @constructor
   * @param {string} appName - App name created in Squidex, like 'test-english0-course'
   */
  constructor(appName = '') {
    this.appName = appName
    this.instance = axios.create({
      baseURL: 'https://cloud.squidex.io/',
      timeout: 20000
    })
    this.schemas = null
    this.token = null
    this.clientId = SQUIDEX_CLIENT_ID || null
    this.clientSecret = SQUIDEX_CLIENT_SECRET || null
  }

  /**
   * Simple check if Squidex is accessible and operates normally
   * @throw if not
   * no auth required
   */
  async ping(): Promise<void> {
    try {
      const path = `api/info/`
      logger.squidex(path)
      await this.instance.get(path)
    } catch (error) {
      throw axiosError2API('Squidex request failure', error as AxiosError)
    }
  }

  /**
   * setters
   */
  setAppName(val: string): void {
    if (this.appName !== val) {
      this.schemas = null
    }
    this.appName = val
  }

  async setCreds(id: string, secret: string): Promise<void> {
    if (this.clientId !== id || this.clientSecret !== secret) {
      this.clientId = id
      this.clientSecret = secret
      await this.checkToken(true)
    }
  }

  /**
   * @private
   * Check if provided or stored appName does exist
   * @throw if doesn't
   */
  private checkUpdateAppName(appName?: string): void {
    if (!appName && !this.appName) {
      throw new APIError(500, 'Squidex App name not provided!')
    }
    if (appName) {
      this.setAppName(appName)
    }
  }

  /**
   * Checks access token and retrieve if empty
   * It is not private method as it is used in status controller
   */
  async checkToken(force = false): Promise<void> {
    if (force || !this.token) {
      if (!this.clientId ||!this.clientSecret) {
        throw new APIError(403, 'Squidex authorization failure, credentials not provided')
      }
      try {
        logger.squidex(`Authorization: id [${this.clientId}], secret [${'*'.repeat(this.clientSecret.length)}]`)
        const tokenParams = new URLSearchParams()
        tokenParams.append('client_secret', this.clientSecret)
        tokenParams.append('client_id', this.clientId)
        tokenParams.append('scope', 'squidex-api')
        tokenParams.append('grant_type', 'client_credentials')

        const { data } = await this.instance.post(
          `/identity-server/connect/token`, tokenParams
        )
        this.token = data.access_token || null
        logger.squidex(`Authorization successful`)
      } catch (error) {
        this.token = null
        throw axiosError2API('Squidex authorization failure', error as AxiosError)
      }
    }
  }

  /**
   * Retrieves arbitrary entity
   *
   * @param {DataQuery} q - API query
   * @returns {Promise<Entities>}
   * @throws if not authorized
   */
  async getEntity(q: DataQuery = {}): Promise<Entities> {
    this.checkUpdateAppName(q.app)
    await this.checkToken()
    try {
      const app = q.app || this.appName
      const id = q.id || ''
      const skip = q.skip || 0
      let limit = q.limit || 0
      let query = ''
      if (q.query || q.limit || q.skip) {
        query = '?q=' + JSON.stringify({
          ...q.query,
          ...(limit && {take: limit}),
          ...(skip && {skip: skip})
        })
      }
      const path = `api/content/${app}/${q.entity}/${id}${query}`
      logger.squidex(path)

      const { data } = await this.instance.get(path, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      })

      // check if single value received
      if (!data.items) {
        return data
      }

      // check if we have received all assets(squidex returns max 200 in 1 request)
      if (limit) {
        // the limit parameter is provided
        if (limit + skip > data.total) {
          // cut limit to boundaries
          limit = data.total - skip
        }
        // check if some data still remains
        if (limit > data.items.length) {
          const shift = data.items.length
          // recursively call getEntity with shifted skip/limit to retrieve tail
          const dataTail = await this.getEntity({
            ...q,
            limit: limit - shift,
            skip: skip + shift
          })
          data.items.push(...dataTail.items)
        }
      } else {
        // the limit parameter is not provided - we should get all available assets
        // check if some data still remains
        if (skip + data.items.length < data.total) {
          const shift = data.items.length
          // recursively call getEntity with shifted skip/limit to retrieve tail
          const dataTail = await this.getEntity({
            ...q,
            skip: skip + shift
          })
          data.items.push(...dataTail.items)
        }
      }

      return data
    } catch (error) {
      throw axiosError2API('Squidex request failure', error as AxiosError)
    }
  }

  /**
   * Update entity
   *
   * @param {DataQuery} q - API query
   * @param {Object} data2Patch - entity's data to patch
   * @returns {Promise<Entities>} - patched entity
   * @throws if not authorized
   */
  async patchEntity(q: DataQuery = {}, data2Patch: Keyed): Promise<Keyed> {
    this.checkUpdateAppName(q.app)
    await this.checkToken()
    try {
      const app = q.app || this.appName
      const id = q.id || ''
      const path = `api/content/${app}/${q.entity}/${id}`
      logger.squidex(path)

      const { data } = await this.instance.patch(path, data2Patch, {
        headers: {
          Authorization: `Bearer ${this.token}`
        },
      })

      return data

    } catch (error) {
      throw axiosError2API('Squidex data patch failure', error as AxiosError)
    }
  }

  /**
   * Retrieves app assets
   *
   * @param {DataQuery} q - API query
   * @returns {Promise<AssetsData>}
   * @throws if not authorized
   */
  async getAssets(q: DataQuery = {}): Promise<AssetsData | AssetData> {
    this.checkUpdateAppName(q.app)
    await this.checkToken()
    try {
      const app = q.app || this.appName
      const id = q.id || ''
      const skip = q.skip || 0
      let query = ''
      let limit = q.limit || 0
      if (q.query || q.limit || q.skip) {
        query = '?q=' + JSON.stringify({
          ...q.query,
          ...(limit && { take: limit }),
          ...(skip && { skip: skip })
        })
      }
      const path = `api/apps/${app}/assets/${id}${query}`
      logger.squidex(path)

      const { data } = await this.instance.get(path, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      })

      // check if single value received
      if (!data.items) {
        return data
      }

      // check if we have received all assets(squidex returns max 200 in 1 request)
      if (limit) {
        // the limit parameter is provided
        if (limit + skip > data.total) {
          // cut limit to boundaries
          limit = data.total - skip
        }
        // check if some data still remains
        if (limit > data.items.length) {
          const shift = data.items.length
          // recursively call getAssets with shifted skip/limit to retrieve tail
          const dataTail = await this.getAssets({
            ...q,
            limit: limit - shift,
            skip: skip + shift
          }) as AssetsData
          data.items.push(...dataTail.items)
        }
      } else {
        // the limit parameter is not provided - we should get all available assets
        // check if some data still remains
        if (skip + data.items.length < data.total) {
          const shift = data.items.length
          // recursively call getAssets with shifted skip/limit to retrieve tail
          const dataTail = await this.getAssets({
            ...q,
            skip: skip + shift
          }) as AssetsData
          data.items.push(...dataTail.items)
        }
      }

      return data
    } catch (error) {
      throw axiosError2API('Squidex request failure', error as AxiosError)
    }
  }

  /**
   * Retrieves app schemas
   *
   * @param {string} [app] - appName
   * @returns {Promise<Schema[]>}
   * @throws if not authorized or neither app nor this.app present
   */
  async getSchemas(appName?: string): Promise<Schema[]> {
    //  app set and its schemas already loaded
    if (this.schemas && (!appName || this.appName === appName)) {
      return this.schemas
    }

    this.checkUpdateAppName(appName)

    await this.checkToken()
    try {
      const path = `api/apps/${appName || this.appName}/schemas/`
      logger.squidex(path)

      const { data } = await this.instance.get(path, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      })

      const mapField = (field: any) => {
        const f: SchemaField = {
          fieldId: field.fieldId,
          name: field.name,
          type: field.properties.fieldType
        }
        if (f.type === 'References') {
          f.refId = (field.properties.schemaIds && field.properties.schemaIds.length && field.properties.schemaIds[0]) || null
        } else if (f.type === 'Array' && field.nested) {
          f.nested = field.nested.map(mapField)
        }
        return f
      }

      // drain up received schemas
      const items = <Keyed[]>data.items
      const schemas: Schema[] = items.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        fields: (item.fields as any).map(mapField)
      })) as Schema[]

      this.schemas = schemas
      return schemas
    } catch (error) {
      throw axiosError2API('Squidex request failure', error as AxiosError)
    }
  }

  /**
   * Get content of the given asset
   * it does nor require authorization
   *
   * @param {AssetQuery} q - asset query
   * @returns {Promise<Buffer>}
   * @throws if q contains neither id no href
   */
  async getAssetContent(q: AssetQuery = {}): Promise<Buffer> {
    this.checkUpdateAppName(q.app)
    if (!q.id && !q.href) {
      throw new APIError(500, 'Squidex: asset content query must contain asset\'s id or href')
    }
    try {
      const app = q.app || this.appName
      let href
      if (q.href) {
        href = q.href
        if (q.version && !href.includes('version')) {
          href += '?version=' + q.version
        }
      } else {
        href = `/api/assets/${app}/${q.id}/${q.slug || ''}${q.version ? '?version=' + q.version : ''}`
      }
      logger.squidex(href)
      const { data } = await this.instance.get(href, {
        responseType: 'arraybuffer'
      })
      logger.squidex(`${href} done, len ${data.length}`)

      return data
    } catch (error) {
      throw axiosError2API('Squidex request failure', error as AxiosError)
    }
  }

  //  ---------------------------------

  /**
   * @pivate
   * Queries Entities
   *
   * @param {string} appName - App name created in Squidex, like 'test-english0-course'
   * @param {boolean} includeAssets - guess
   * @returns {Promise<AppEntities>}
   * @throws if authorization failure
   */
  private async queryData(q: DataQuery, includeAssets: boolean): Promise<AppEntities> {
    const schemas = await this.getSchemas(q.app)
    const entities: string[] = schemas
      .filter(sch => sch.type === 'Default')
      .map(sch => sch.name)

    const res: AppEntities = {}
    for (const entity of entities) {
      res[entity] = (await this.getEntity({ ...q, entity })).items
    }

    if (includeAssets) {
      delete q.entity
      res.assets = (await this.getAssets(q) as AssetsData).items
    }

    return res
  }

  /**
   * Retrieves all Entities
   *
   * @param {string} appName - App name created in Squidex, like 'test-english0-course'
   * @returns {Promise<FullAppData>}
   * @throws if authorization failure
   */
  async loadAppData(appName?: string): Promise<AppEntities> {
    return this.queryData({ app: appName }, true)
  }

  /**
   * Retrieves Entities by one instance with closest modified date
   *
   * @param {string} appName - App name created in Squidex, like 'test-science'
   * @returns {Promise<FullAppData>}
   * @throws if authorization failure
   */
  async loadLastMofifiedData(appName?: string): Promise<AppEntities> {
    const q: DataQuery = {
      app: appName,
      limit: 1,
      query: {
        sort: [{
          path: 'lastModified',
          order: 'descending'
        }]
      }
    }
    return this.queryData(q, true)
  }

  /**
   * Checks user's access level to the app/course
   * RED means no access at all, YELLOW means successful Squidex auth, and GREEN means access to course's schemas and data
   *
   * @param {string} id - Squidex id
   * @param {string} secret - Squidex secret
   * @param {string} appName - App name created in Squidex
   * @returns {Promise<ColorLevel>}
   */
  async checkAccessLevel(id: string, secret: string, appName: string): Promise<ColorLevel> {
    let lvl = ColorLevel.RED
    try {
      this.setAppName(appName)
      await this.setCreds(id, secret)
      lvl = ColorLevel.YELLOW

      const q: DataQuery = {
        app: appName,
        limit: 1
      }
      await this.queryData(q, true)
      lvl = ColorLevel.GREEN
    } catch (e) {
      return lvl
    }
    return lvl
  }

  /**
   * Retrieves Entities modified after given date
   *
   * @param {string} appName - App name created in Squidex, like 'test-english0-course'
   * @returns {Promise<FullAppData>}
   * @throws if authorization failure
   */
  async loadDataModifiedAfter(after: Date, appName?: string): Promise<AppEntities> {
    const q: DataQuery = {
      app: appName,
      query: {
        filter: {
          path: 'lastModified',
          op: 'gt',
          value: after.toISOString()
        }
      }
    }
    return this.queryData(q, true)
  }

  //  ---------------------------------
  //  data transformation

  /**
   * Traverse recursively provided node and apply handler to every sub-node
   * stop traversing if handler return false
   *
   * @param {any} node
   * @param {string|number|null} prop - current property name(object) or index(array), null for root
   * @param {func} handler -
   * @returns {AppEntities}
   */
  private traverseAndUpdate(node: any, prop: Prop, schemaId: string, handler: (n: any, p: Prop, sid: string) => boolean): boolean {
    if (!node) {
      return false
    }

    if (!handler(node, prop, schemaId)) {
      return false
    }

    const val = node[prop]
    if (Array.isArray(val) || (typeof val === 'object' && val != null)) {
      const nextSchemaId = val.schemaId || schemaId
      for (const nextProp in val) {
        if (nextProp !== 'schemaId') {
          this.traverseAndUpdate(val, nextProp, nextSchemaId, handler)
        }
      }
    }
    return false
  }

  /**
   * Collapse all props like "prop: { iv: value }" to "prop: value"
   *
   * @param {AppEntities} appEntities
   * @returns {AppEntities}
   */
  collapsIvs(appEntities: AppEntities): AppEntities {
    logger.squidex(`Collapse IVs starts`)
    // traverse everything
    for (const prop in appEntities) {
      this.traverseAndUpdate(appEntities, prop, '', (node, prop, sid) => {
        const val = node[prop]
        // value is an object which contains only iv field
        if (val && val.iv !== undefined && Object.keys(val).length === 1) {
          node[prop] = val.iv
        }
        return true
      })
    }

    logger.squidex(`Collapse IVs completed`)
    return appEntities
  }

  /**
   * Remove all assets non referenced in the entities and optionally update entities' assetId with file names
   *
   * @param {AppEntities} appEntities
   * @returns {AppEntities}
   */
  async optimizeAssets(appEntities: AppEntities): Promise<AppEntities> {
    logger.squidex(`Assets optimization starts, assets# ${appEntities.assets.length}`)

    const schemas = await this.getSchemas()
    logger.squidex(`Assets optimization, schemas# ${schemas.length}`)
    const schemaHash: {
      [schemaId: string]: {
        [propName: string]: true
      }
    } = {}
    schemas.map(({ id, fields }) => ({
      // filter out non-asset fields
      id, fields: fields.filter(field => field.type === 'Assets')
    }))
      // filter out schemas w/o fields
      .filter(({ fields }) => fields.length !== 0)
      // build hash
      .forEach(({ id, fields }) => {
        schemaHash[id] = {}
        fields.forEach(({ name }) => schemaHash[id][name] = true)
      })

    // collect all assets into the assetsHash like "id: asset"
    const assetsHash: {
      [id: string]: AssetData
    } = {}

    for (const asset of appEntities.assets) {
      assetsHash[(<AssetData>asset).id] = <AssetData>asset
    }

    // traverse everything
    for (const prop in appEntities) {
      // skip assets
      if (prop === 'assets') {
        continue
      }
      this.traverseAndUpdate(appEntities, prop, '', (node, prop, sid) => {

        // schemaId provided and schemaHash has value for this schema and prop name
        if (sid && schemaHash[sid] && schemaHash[sid][prop]) {

          // asset reference can be null, empty array or array with 1 element
          const assetId = Array.isArray(node[prop]) && node[prop].length < 2
            ? node[prop][0] || ''
            : node[prop] === null
              ? ''
              : node[prop]

          if (!assetId) {
            node[prop] = ''
          } else if (typeof assetId === 'string') {
            // assets hash has asset with such id
            if (assetsHash[assetId]) {
              // mark it as referenced
              assetsHash[assetId].ref = true
              // replace id with file name
              node[prop] = assetsHash[assetId].fileName
            } else {
              logger.warning(`Assets optimization discrepancy: asset id "${assetId}" not found! (schemaId ${sid}, property ${prop})`)
            }
          }
        }
        return true
      })
    }

    // filter out all non-referenced assets
    appEntities.assets = Object.values(assetsHash).filter(asset => asset.ref)

    logger.squidex(`Assets optimization completed, assets# ${appEntities.assets.length}`)
    return appEntities
  }

  /**
   * Update all sections.pagesAndActivities - augment them with component_type(schema name from schemaId)
   *
   * @param {AppEntities} appEntities
   * @returns {AppEntities}
   */
  async lookupComponentType(appEntities: AppEntities): Promise<AppEntities> {
    logger.squidex(`Sections update(lookup component_type) starts`)

    const schemas = await this.getSchemas()
    const schemaHash: Record<string, string> = {}
    schemas.forEach(({ id, name }) => schemaHash[id] = name)

    // traverse everything
    for (const prop in appEntities) {
      // skip assets
      if (prop === 'assets') {
        continue
      }

      this.traverseAndUpdate(appEntities, prop, '', (node, prop) => {
        if (prop === 'pagesAndActivities') {
          node[prop].forEach(item => {
            if (item.schemaId && schemaHash[item.schemaId]) {
              item.component_type = schemaHash[item.schemaId]
            } else {
              logger.warning(`Sections update(lookup component_type) discrepancy: item with schemaId "${item.id}" (schemaId ${item.schemaId}) has no schema name!`)
            }
          })
          return false
        }
        return true
      })
    }

    logger.squidex(`Sections update(lookup component_type) completed`)
    return appEntities
  }

  /**
   * Update itemList data from [{ item: [id] }] to [id]
   *
   * @param {AppEntities} appEntities
   * @returns {AppEntities}
   */
  updateItemLists(appEntities: AppEntities): AppEntities {
    logger.squidex(`Sections update(itemList) starts`)

    // traverse everything
    for (const prop in appEntities) {
      // skip assets
      if (prop === 'assets') {
        continue
      }

      this.traverseAndUpdate(appEntities, prop, '', (node, prop) => {
        if (prop === 'itemList') {
          node[prop] = node[prop].map(i => i.item[0])
          return false
        }
        return true
      })
    }

    logger.squidex(`Sections update(itemList) completed`)
    return appEntities
  }

  /**
   * for the every entity which has a schema it 1) adds GUID and 2) rebuild references from IDs to these newly created GUIDs
   * i.e. for ex. itemList will contain GUIDs of the Items not IDs...
   *
   * @param {AppEntities} appEntities
   * @returns {AppEntities}
   */
  async remapGuids(appEntities: AppEntities): Promise<AppEntities> {
    logger.squidex('IDs to GUIDs remapping starts')
    const schemas = await this.getSchemas()
    logger.squidex(`GUIDs remapping, schemas# ${schemas.length}`)

    const schemaNamesHash: { [schemaId: string]: string } = {}
    const schemaFieldsHash: {
      [schemaId: string]: {
        [propName: string]: string
      }
    } = {}

    schemas.map(({ id, name, fields }) => ({
        // filter out non-reference fields
        id, name,
        fields: fields.filter(field => {
          if (field.type === 'References') {
            return true
          }
          if (field.type === 'Array') {
            const found = field.nested?.find(nfield => nfield.type === 'References')
            if (found) {
              return true
            }
          }
          return false
        })
      }))
      // build hash
      .forEach(({ id, name, fields }) => {
        schemaNamesHash[id] = name
        if (!fields.length) {
          return
        }
        schemaFieldsHash[id] = {}
        fields.forEach(f => {
          const refId: string = f.refId || (f.nested && f.nested[0].refId) || ''
          if (refId) {
            schemaFieldsHash[id][f.name] = refId
          }
        })
      })
    // here schemaFieldsHash looks like this
    // {
    //   '4d95817a-de54-46fe-8f53-916a97dced17': {
    //     itemList: '607a6c79-4fc2-488d-be34-9b1b2307550e',
    //     topicId: 'd387b984-6a17-4ca1-accb-34b473740a21'
    //   },
    //   '17a792f4-560b-4bc7-a9cb-ce03f036b24d': { courseId: '75732cea-ab9f-441b-9912-64a96ebb8496' },
    //   'd387b984-6a17-4ca1-accb-34b473740a21': { moduleId: '17a792f4-560b-4bc7-a9cb-ce03f036b24d' }
    //   '683e7b49-9565-46e5-b831-6d8dc6508aa3': { itemList: '607a6c79-4fc2-488d-be34-9b1b2307550e' },
    // // ^ schema id                              ^ prop     ^ referenced schema id
    // }

    // collect all entities into the entityHash like "id: entity"
    const entityHash: {
      [id: string]: any
    } = {}

    for (const prop in appEntities) {
      // skip assets (?)
      if (prop === 'assets') {
        continue
      }
      entityHash[prop] = {}
      appEntities[prop].forEach(entity => {
        entityHash[prop][entity.id] = entity
      })
    }

    // traverse everything and assign GUIDs
    for (const prop in appEntities) {
      // skip assets (TODO: glossary should be skipped too)
      if (prop === 'assets') {
        continue
      }

      this.traverseAndUpdate(appEntities, prop, '', (node/* , prop, sid */) => {
        if (node.schemaId && !node.guid && !node.data?.guid) {
          //  node has own schemaId and GUID is not assigned yet
          if (node.data) {
            node.data.guid = uuid()
          } else {
            node.guid = uuid()
          }
          logger.squidex(`GUID assigned to ${node.schemaName || '<*>'} ${node.id}`)
        }
        return true
      })
    }

    // traverse everything again and remap IDs to GUIDs
    for (const prop in appEntities) {
      // skip assets (TODO: glossary should be skipped too)
      if (prop === 'assets') {
        continue
      }
      this.traverseAndUpdate(appEntities, prop, '', (node, prop, sid) => {

        // schemaId should be provided and schemaFieldsHash should has value for this schema and prop name
        // property also should have truthy value
        if (!sid || !schemaFieldsHash[sid] || !schemaFieldsHash[sid][prop] || !node[prop]) {
          return true
        }

        const refSchemaId = schemaFieldsHash[sid][prop]
        const refSchemaName = schemaNamesHash[refSchemaId]

        const mapId2Guid = refId => {
          const refEntity = entityHash[refSchemaName][refId]
          if (!refEntity) {
            logger.warning(`GUIDs remapping discrepancy: entity "${refSchemaName}" with id "${refId}" not found! (schemaId ${sid}, property ${prop})`)
            return refId
          }

          return refEntity.guid || refEntity.data?.guid
        }

        //
        node[prop] = Array.isArray(node[prop])
          ? node[prop].map(mapId2Guid)
          : mapId2Guid(node[prop])

        return true
      })
    }

    logger.squidex('IDs to GUIDs remapping completed')
    return appEntities
  }

  /**
   * for the every entity which has a schema it runs thru and assign false to any boolean property which is falsy
   *
   * @param {AppEntities} appEntities
   * @returns {AppEntities}
   */
  async updateBooleans(appEntities: AppEntities): Promise<AppEntities> {
    logger.squidex('Booleans update starts')
    const schemas = await this.getSchemas()
    logger.squidex(`Booleans update , schemas# ${schemas.length}`)

    const schemaHash: {
      [schemaId: string]: {
        [propName: string]: true
      }
    } = {}

    schemas.map(({ id, name, fields }) => ({
      id, name,
      // filter out non-asset fields
      fields: fields
        .filter(f => f.type === 'Boolean' || (f.type === 'Array' && f.nested && f.nested[0].type === 'Boolean'))
        .map(f => f.name)
    }))
    // filter out schemas w/o fields
    .filter(({ fields }) => fields.length !== 0)
    // build hash
    .forEach(({ id, fields }) => {
      schemaHash[id] = {}
      fields.forEach(f => schemaHash[id][f] = true)
    })

    // here schemaHash looks like this
    // {
    //   'df0d73eb-84a8-45b0-accb-a533d4a7965d': {
    //     flippingCards: true,
    //     promptDisplayText: true,
    //     shuffleAnswerChoices: true
    //     ...
    //   },
    //   '214e32e6-3925-4e8f-8452-7b6a193f664f': {
    //     instantSubmit: true,
    //     onCorrectAnswerPlayVO: true,
    //     autoAdvanceIncorrect: true
    //     ...
    //   }, ...
    // }

    // traverse everything and check/update booleans
    let count = 0
    for (const prop in appEntities) {
      // skip assets (TODO: glossary should be skipped too)
      if (prop === 'assets') {
        continue
      }
      this.traverseAndUpdate(appEntities, prop, '', (node, prop, sid) => {

        // schemaId should be provided and schemaFieldsHash should has value for this schema and prop name
        if (sid && schemaHash[sid] && schemaHash[sid][prop]) {
          node[prop] = Array.isArray(node[prop])
            ? node[prop].map(item => item || false)
            : node[prop] || false
          ++count
        }

        return true
      })
    }

    logger.squidex(`Booleans update completed, ${count} fields processed`)
    return appEntities
  }

  /**
   * run thru and remove all nulled properties
   * should be invoked last
   *
   * @param {AppEntities} appEntities
   * @param {XformConfig} config
   * @returns {AppEntities}
   */
  removeNulleds(appEntities: AppEntities, config: XformConfig = {
    deleteNulls: true,
    deleteEmptyString: false,
    deleteEmptyArrays: false
  }): AppEntities {
    logger.squidex('Nulleds removing starts')

    // traverse everything and check/update booleans
    let count = 0
    for (const prop in appEntities) {
      this.traverseAndUpdate(appEntities, prop, '', (node, prop/* , sid */) => {

        const val:any = node[prop]
        if (
          (config.deleteNulls && val === null) ||
          (config.deleteEmptyString && val === '') ||
          (config.deleteEmptyArrays && Array.isArray(val) && val.length === 0)
        ) {
          delete node[prop]
          ++count
        }

        return true
      })
    }

    logger.squidex(`Nulleds removing completed, ${count} fields deleted`)
    return appEntities
  }

  /**
   * Update all sections.pagesAndActivities - augment them with component_type(schema name from schemaId)
   *
   * @param {AppEntities} appEntities
   * @returns {AppEntities}
   */
  async xformAll(appEntities: AppEntities, xformConfig?: XformConfig): Promise<AppEntities> {
    logger.squidex(`Data transformation starts`)

    let data = this.collapsIvs(appEntities)
    data = await this.optimizeAssets(data)
    data = await this.lookupComponentType(data)
    data = this.updateItemLists(data)
    data = await this.remapGuids(data)
    data = await this.updateBooleans(data)

    logger.squidex(`Mapping starts`)
    data = mapAppData(data)
    logger.squidex(`Mapping completed`)

    data = this.removeNulleds(data, xformConfig)

    logger.squidex(`Data transformation completed`)
    return data
  }

  //  ---------------------------------

  /**
   * a) load entity data from Squidex, entity name is being taken from the filter path, 1st segment
   * b) traverses thru loaded data accordingly the filter path
   * c) check values against test func, log any relevant data
   *
   * Example :
   *   path2test: 'topic[*].data.sections.iv[*].pagesAndActivities[*].answerChoices[*].text'
   *   testFuncBody: 'if($node === undefined) { $log($path, 'the "text" property undefined!') }; return true;'
   * the above parameters means
   *    go thru topics[all].data.sections.iv[all].pagesAndActivities[all].answerChoices[all].text
   *    apply test func to all the above "text" properties and log error if it's undefined
   *
   * @param {string} appName - App name created in Squidex, like 'test-science'
   * @param {string} path2test - path to test like "topic[*].data.sections.iv[*].pagesAndActivities[*].answerChoices[*].text"
   * @param {string} testFuncBody - test function body to receive value from the above path and return
   * @returns {Promise<string>} - messages logged by the test func
   */
  async bulkTest(
    appName: string,
    path2test: string,
    testFuncBody: string
  ): Promise<string> {
    logger.squidex(`Bulk Test starts`)

    const path2testSplitted = path2test.split('.')
    let rootProp = path2testSplitted[0]
    if (rootProp.endsWith('[*]')) {
      rootProp = rootProp.slice(0, -3)
    }
    logger.squidex(`Bulk Test root property ${rootProp}`)

    const entityData = await this.getEntity({ app: appName, entity: rootProp })
    const data = { [rootProp]: entityData.items }
    const bulker = new Bulker()
    const bulkerCfg: BulkUpdateConfig = {
      path2test: path2testSplitted,
      testFunc: Bulker.buildTestFunc(testFuncBody),
      currPath: ''
    }

    logger.squidex(`Bulk Update loaded ${entityData.total} items, starts test path`)
    bulker.log('Start test path')
    bulker.filterPaths(data, bulkerCfg)
    bulker.log('done')

    logger.squidex(`Bulk Test completed`)
    return bulker.getLog()
  }

  /**
   * a) load entity data from Squidex, entity name is being taken from the filter path, 1st segment
   * b) traverses thru loaded data accordingly the filter path
   * c) check values against test func, filter out branches where the test func returns false (it keeps original arrays to a separate branch)
   * d) traverses thru update path(only remaining branches)
   * e) applies update func to the above path nodes
   * f) restores saved arrays
   * g) patches the entities with the new data
   *
   * Example :
   *   path2test: 'topic[*].data.sections.iv[*].pagesAndActivities[*].answerChoices[*].text'
   *   testFuncBody: $node === 'Leg' || $node === 'Hand'
   *   path2update: 'topic[*].data.sections.iv[*].pagesAndActivities[*]'
   *   updateFunc: $node.forEach(v => v.instantSubmit = true)
   * the above parameters means
   *    go thru topics[all].data.sections.iv[all].pagesAndActivities[all].answerChoices[all].text
   *    apply test func to all the above "text" properties (where exist) and keep only branch if the "text" is "Leg" of "Hand"
   *    go thru topics[all].data.sections.iv[all].pagesAndActivities[all] which passed the above tests
   *    and set their "instantSubmit" property to true
   *
   * @param {string} appName - App name created in Squidex, like 'test-science'
   * @param {string} path2test - path to test like "topic[*].data.sections.iv[*].pagesAndActivities[*].answerChoices[*].text"
   * @param {string} testFuncBody - test function body to receive value from the above path and return
   * @param {string} path2update - path to update like "topic[*].data.sections.iv[*].pagesAndActivities[*]"
   * @param {string} updateFuncBody - update function body that receives value from the above path
   */
  async bulkUpdate(
    appName: string,
    path2test: string,
    testFuncBody: string,
    path2update: string,
    updateFuncBody: string,
    dryRun = false
  ): Promise<string> {
    logger.squidex(`Bulk Update starts`)

    const path2testSplitted = path2test.split('.')
    let rootProp = path2testSplitted[0]
    if (rootProp.endsWith('[*]')) {
      rootProp = rootProp.slice(0, -3)
    }

    logger.squidex(`Bulk Update root property ${rootProp}`)

    const entityData = await this.getEntity({ app: appName, entity: rootProp })
    const data = { [rootProp]: entityData.items }
    const bulker = new Bulker()
    const bulkerCfg: BulkUpdateConfig = {
      path2test: path2testSplitted,
      testFunc: Bulker.buildTestFunc(testFuncBody),
      path2update: path2update.split('.'),
      updateFunc: Bulker.buildUpdateFunc(updateFuncBody),
      currPath: ''
    }

    logger.squidex(`Bulk Update loaded ${entityData.total} items, starts test path`)

    bulker.log('Start test path')
    bulker.filterPaths(data, bulkerCfg)

    logger.squidex(`Bulk Update starts test path`)

    bulker.log('Start update path')
    bulker.updatePaths(data, bulkerCfg)
    bulker.restoreOrigArrays(data[rootProp])

    if (!dryRun) {
      logger.squidex(`Bulk Update starts patching entities in Squidex`)
      bulker.log('Patch', rootProp)
      for (const entity of data[rootProp]) {
        await this.patchEntity({
          entity: rootProp,
          id: <string>entity.id
        }, <Record<string, any>>entity.data)
      }
    }

    logger.squidex(`Bulk Update completed`)
    bulker.log('done')
    return bulker.getLog()
  }

}
