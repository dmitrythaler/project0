import { setUserDefaults } from './defs.ts'
import { PlayerDAL } from './player-dal.ts'

import type { IndexDefinition, DatabaseClient } from '../db-client.ts'
import type { EntityList, EntityListMeta } from '../types.ts'
import type { PlayerID } from '@p0/common/types'
import type { User } from './defs.ts'

type UserListMeta = EntityListMeta<PlayerID, User>
type UserList = EntityList<PlayerID, User>

export type { User, UserListMeta, UserList }

//  ----------------------------------------------------------------------------------------------//

export class UserDAL extends PlayerDAL<User> {
  protected getEntityName(): string {
    return 'User'
  }
  protected getCollName(): string {
    return 'users'
  }
  protected getIndexDefinition(): IndexDefinition[] {
    return [{
      spec: { email: 1 },
      options: { unique: true }
    }, {
      spec: { ownerId: 1 },
      options: { unique: false }
    }]
  }
  protected async migrate() {
    // init 1st user if it doesn't exist
    const coll = await this.getColl()
    const count = await coll.countDocuments()
    if (count === 0) {
      //  empty collection, add 1st root admin
      const root = this.setDefaults({
        email: 'agentsmith@gmail.com',
        fullName: 'Agent Smith',
        password: 'GoodbyMrAnderson',
        isActive: true,
        role: 'User:Root'
      }) as User
      await this.create(root)
    }
  }

  override setDefaults<User>(user: Partial<User>): User {
    return setUserDefaults(user) as User
  }

  //  ---------------------------------
  constructor(client: DatabaseClient) {
    super(client)
  }


}
