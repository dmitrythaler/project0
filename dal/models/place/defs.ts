import { genUUID } from '@p0/common'

import type { Entity, PlayerID, OrgID, PlaceID, WithDates } from '@p0/common/types'
import type { WithIdsAndType } from '@p0/common/rbac'

//  ----------------------------------------------------------------------------------------------//


// type _Base = Omit<WithIdsAndType<OrgID>, 'orgID'>

type PlaceBase = WithIdsAndType<PlaceID> & {
  ownerId: PlayerID
  orgId: OrgID
  orgName: string
}

export interface Place extends PlaceBase, WithDates {
  type: 'Place'
  name: string
  address?: string
}

//  utils/pipes

export const setDefaults = <T extends Partial<Place>>(place: T): T => ({
  type: 'Place' as Entity,
  _id: genUUID<PlaceID>(),
  ...place,
})
