import type * as M from 'mongodb'
import type { WithIdsAndType } from '@p0/common/rbac'

//  ----------------------------------------------------------------------------------------------//

export type EntityListMeta<EntityID extends string, Entity extends WithIdsAndType<EntityID>> = {
  total?: number
  skip?: number
  limit?: number
  filter?: M.Filter<Entity>
  sort?: M.Sort
}

export type EntityList<EntityID extends string, Entity extends WithIdsAndType<EntityID>> = {
  data: Entity[]
  meta: EntityListMeta<EntityID, Entity>
}
