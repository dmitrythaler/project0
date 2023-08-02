
import { APIError, logger, assertNonNullable } from '@p0/common'
import { DBClient } from './models/db-client.ts'
import { UserDAL } from './models/user.ts'
import { MediaDAL } from './models/media.ts'

import type * as T from './models/db-client.ts'
import type * as User from './models/user.ts'
import type * as Media from './models/media.ts'

export type { User, Media }

//  ----------------------------------------------------------------------------------------------//

const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
} = process.env

class theDAL {
  private client: DBClient
  private userDAL: UserDAL<DBClient>
  private mediaDAL: MediaDAL<DBClient>

  constructor(config: T.ConnConfig) {
    this.client = new DBClient(config)
    this.userDAL = new UserDAL(this.client)
    this.mediaDAL = new MediaDAL(this.client)
  }

  async init () {
    try {
      await this.userDAL.init()
      await this.mediaDAL.init()
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
  getMediaDAL() {
    return this.mediaDAL
  }

  //  ---------------------------------
  private static inst_: theDAL
  static getDAL = (cfg?: T.ConnConfig) => {
    if (theDAL.inst_) {
      return theDAL.inst_
    }

    if (cfg) {
      theDAL.inst_ = new theDAL(cfg)
    } else {
      assertNonNullable(DB_NAME, 'DB_NAME env variable is not set!', 500)
      theDAL.inst_ = new theDAL({
        host: DB_HOST || 'localhost',
        port: parseFloat(DB_PORT || '27017'),
        database: DB_NAME
      })
    }
    return theDAL.inst_
  }

}

export const getDAL = theDAL.getDAL
