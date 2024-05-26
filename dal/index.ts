
import { APIError, logger, assertNonNullable } from '@p0/common'
import { DBClient } from './models/db-client.ts'
import { UserDAL } from './models/player/user-dal.ts'
import { ClientDAL } from './models/player/client-dal.ts'
import { MediaDAL } from './models/media/dal.ts'
import { OrgDAL } from './models/org/dal.ts'

import type * as T from './models/db-client.ts'
import type { Player } from './models/player/defs.ts'
import type { User, UserList, UserListMeta } from './models/player/user-dal.ts'
import type { Client, ClientList, ClientListMeta } from './models/player/client-dal.ts'
import type {
  MediaFile,
  Media,
  MediaList,
  MediaListMeta
} from './models/media/dal.ts'
import type { Org, OrgList, OrgListMeta } from './models/org/dal.ts'

export { UserDAL, ClientDAL, MediaDAL, OrgDAL }
export type {
  Player,
  User,
  UserList,
  UserListMeta,
  Client,
  ClientList,
  ClientListMeta,
  MediaFile,
  Media,
  MediaList,
  MediaListMeta,
  Org,
  OrgList,
  OrgListMeta
}

//  ----------------------------------------------------------------------------------------------//

const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
} = process.env

class TheDAL {
  private config: T.ConnConfig
  private client: DBClient
  private userDAL: UserDAL
  private clientDAL: ClientDAL
  private mediaDAL: MediaDAL
  private orgDAL: OrgDAL

  constructor(config: T.ConnConfig) {
    this.config = config
    this.client = new DBClient(config)
    this.userDAL = new UserDAL(this.client)
    this.clientDAL = new ClientDAL(this.client)
    this.mediaDAL = new MediaDAL(this.client)
    this.orgDAL = new OrgDAL(this.client)
  }

  async init() {
    try {
      await this.userDAL.init(this.config.migrate)
      await this.clientDAL.init(this.config.migrate)
      await this.mediaDAL.init(this.config.migrate)
      await this.orgDAL.init(this.config.migrate)
      logger.dal('DAL initialization successful.')
    } catch (error) {
      throw new APIError(<Error>error, 'DAL initialization error')
    }
  }
  async getDb () {
    await this.client.getDb()
  }
  async close () {
    await this.client.close()
  }
  getUserDAL() {
    return this.userDAL
  }
  getClientDAL() {
    return this.clientDAL
  }
  getMediaDAL() {
    return this.mediaDAL
  }
  getOrgDAL() {
    return this.orgDAL
  }

  //  ---------------------------------
  private static inst_: TheDAL
  static getDAL = (cfg?: T.ConnConfig) => {
    if (TheDAL.inst_) {
      return TheDAL.inst_
    }

    if (cfg) {
      TheDAL.inst_ = new TheDAL(cfg)
    } else {
      assertNonNullable(DB_NAME, 'DB_NAME env variable is not set!', 500)
      TheDAL.inst_ = new TheDAL({
        host: DB_HOST || 'localhost',
        port: parseFloat(DB_PORT || '27017'),
        database: DB_NAME
      })
    }
    return TheDAL.inst_
  }

}

export const getDAL = TheDAL.getDAL
