import { APIError } from '@p0/common'
import { setClientDefaults } from './defs.ts'
import { PlayerDAL } from './player-dal.ts'

import type { PlayerID, OrgID } from '@p0/common/types'
import type { Role } from '@p0/common/rbac/types'
import type { IndexDefinition, DatabaseClient } from '../db-client.ts'
import type { EntityList, EntityListMeta } from '../types.ts'
import type { Client } from './defs.ts'

type ClientListMeta = EntityListMeta<PlayerID, Client>
type ClientList = EntityList<PlayerID, Client>

export type { Client, ClientListMeta, ClientList }



//  ----------------------------------------------------------------------------------------------//

export class ClientDAL extends PlayerDAL<Client> {
  protected override getEntityName(): string {
    return 'Client'
  }
  protected override getCollName(): string {
    return 'clients'
  }
  protected override getIndexDefinition(): IndexDefinition[] {
    return [{
      spec: { email: 1 },
      options: { unique: true }
    }, {
      spec: { ownerId: 1 },
      options: { unique: false }
    }]
  }
  protected async migrate() {}

  //  ---------------------------------
  constructor(client: DatabaseClient) {
    super(client)
  }

  override setDefaults<Client>(client: Partial<Client>): Client {
    return setClientDefaults(client) as Client
  }

  // Client:Invite
  // Client:Exclude
  // Client:AcceptInvitation
  // Client:RefuseInvitation

  /**
   * Adds Org to the Client: pushes new Org into the orgs array and updates current/active Org
   *
   * @param _id Client id
   * @param orgId Org id
   * @param orgName Org name
   * @param role Client's role for this Org, default 'Client:Owner'
   * @returns Promise<Client>
   */
  async addOrg(_id: PlayerID, orgId: OrgID, orgName: string, role: Role = 'Client:Owner'): Promise<Client> {
    const { orgs } = await this.getById(_id) as Client
    if (orgs.find(org => org.orgId === orgId)) {
      throw new APIError(400, `${this.getEntityName()} with id "${_id}" already contains the Org with id "${orgId}"!`)
    }
    orgs.push({
      orgId, orgName, role,
      status: 'Accepted'
    })
    return await this.update(_id, { orgId, orgName, orgs })
  }

}
