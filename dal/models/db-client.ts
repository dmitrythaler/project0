import * as mongo from 'mongodb'
import type * as M from 'mongodb'

import { APIError, assertNonNullable, logger } from '@p0/common'

//  ----------------------------------------------------------------------------------------------//
export type IndexDefinition = {
  spec: M.IndexSpecification,
  options: M.CreateIndexesOptions
}

export type ConnConfig = {
  host: string
  port: number
  database: string
  user?: string
  passwd?: string
  migrate?: boolean
}

export interface DatabaseClient {
  setupCollection: (collName: string, def: IndexDefinition[]) => Promise<void>;
  getDb: () => Promise<M.Db>;
  close: () => Promise<void>;
}


export class DBClient implements DatabaseClient {
  private static config: ConnConfig | null = null
  private static url = ''
  private static client: M.MongoClient | null = null
  private static connected = false
  private static db: M.Db | null = null

  constructor(config: ConnConfig) {
    if(!DBClient.config) {
      DBClient.config = config
    }
  }

  private static async _connect (): Promise<void> {
    assertNonNullable(DBClient.config)
    const config = DBClient.config
    if (!DBClient.url) {
      if (config.passwd && config.user) {
        const user = encodeURIComponent(config.user)
        const passwd = encodeURIComponent(config.passwd)
        DBClient.url = `mongodb://${user}:${passwd}@${config.host}:${config.port}/${config.database}`
      } else {
        DBClient.url = `mongodb://${config.host}:${config.port}/${config.database}`
      }
      logger.dal(`MongoDB url formed: ${DBClient.url}`)
    }
    if (!DBClient.client) {
      DBClient.client = new mongo.MongoClient(DBClient.url)
      DBClient.connected = false
      DBClient.client.on('close', () => {
        DBClient.connected = false
        logger.dal('MongoDB connection closed')
      })
    }
    if (!DBClient.connected) {
      try {
        await DBClient.client.connect()
        await DBClient.client.db('admin').command({ ping: 1 })
        DBClient.connected = true
        DBClient.db = DBClient.client.db(config.database)
        logger.dal('MongoDB connected')
      } catch (error) {
        //  TODO: init failed - additional logging must be here
        throw new APIError(error as Error, 'MongoDB connection failure', true/*fatal*/)
      }
    }
  }

  async setupCollection(collName: string, def: IndexDefinition[]): Promise<void> {
    await DBClient._connect()
    assertNonNullable(DBClient.db, `DAL error: collection "${collName}" setup failure`)
    const db = DBClient.db
    try {
      await Promise.all(def.map(idx => db.createIndex(collName, idx.spec, idx.options)))
    } catch (error) {
      logger.error(`MongoDB collection "${collName}" initialization error:`, error)
      throw error
    }
  }

  async getDb(): Promise<M.Db> {
    await DBClient._connect()
    assertNonNullable(DBClient.db, 'DAL error: database connection is not initialized')
    return DBClient.db
  }

  async close(): Promise<void> {
    DBClient.client && DBClient.connected && (await DBClient.client.close())
  }
}


