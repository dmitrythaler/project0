import { genUUID } from '@p0/common'

import type { Entity, PlayerID, OrgID, WithDates } from '@p0/common/types'
import type { WithIdsAndType } from '@p0/common/rbac'

//  ----------------------------------------------------------------------------------------------//


// type _Base = Omit<WithIdsAndType<OrgID>, 'orgID'>

type OrgBase = WithIdsAndType<OrgID> & {
  ownerId: PlayerID
  orgId?: never
  orgName?: never
}

export interface Org extends OrgBase, WithDates {
  type: 'Org'
  name: string
}

//  utils/pipes

export const setDefaults = <T extends Partial<Org>>(org: T): T => ({
  type: 'Org' as Entity,
  _id: genUUID<OrgID>(),
  name: '',
  ...org,
})


