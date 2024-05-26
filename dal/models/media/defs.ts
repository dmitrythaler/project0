import { APIError, genUUID } from '@p0/common'

import type { Entity, MediaID, WithDates } from '@p0/common/types'
import type { WithIdsAndType } from '@p0/common/rbac'

//  ----------------------------------------------------------------------------------------------//

export interface MediaFile {
  fileName: string
  fileSize: number
  height: number
  width: number
  url?: string
}

export interface Media extends MediaFile, WithIdsAndType<MediaID>, WithDates {
  type: 'Media',
  slug: string|null
  ext: string
  storagePath?: string
}

//  utils/pipes

export const setDefaults = <T extends Partial<Media>>(media: T): T => ({
  type: 'Media' as Entity,
  _id: genUUID<MediaID>(),
  height: 0,
  width: 0,
  fileSize: 0,
  ...media,
})

