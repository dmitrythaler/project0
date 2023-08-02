import {
  MEDIA_BRANCH as BRANCH,
  MEDIA_FETCH,
  MEDIA_LOADED,
  MEDIA_UPLOAD,
  MEDIA_UPLOADED,
  MEDIA_UPDATE,
  MEDIA_UPDATED,
  MEDIA_DELETE,
  MEDIA_DELETED,
  MEDIA_ERROR
} from '@p0/common/constants'

import type { AnyAction } from 'redux'
import type { Media } from '@p0/dal'
import type { IAPIError } from '@common/types'

//  ----------------------------------------------------------------------------------------------//
// types and consts

export type MediaData = {
  media: Media.Self[]
  processing?: string|boolean,
  error?: IAPIError
}

const initialMediaData: MediaData = {
  media: [],
  processing: false,
}

//  ----------------------------------------------------------------------------------------------//
//  redicer

export const reducer = (state = initialMediaData, action: AnyAction): MediaData => {
  switch (action.type) {

    case MEDIA_FETCH:
    case MEDIA_UPLOAD:
    case MEDIA_UPDATE:
    case MEDIA_DELETE: {
      return {
        ...state,
        processing: action.type
      }
    }

    case MEDIA_LOADED: {
      return {
        ...state,
        processing: false,
        media: action.payload
     }
    }

    case MEDIA_UPLOADED:
    case MEDIA_UPDATED:
    case MEDIA_DELETED: {
      return {
        ...state,
        processing: false
      }
    }

    case MEDIA_ERROR: {
      return {
        ...state,
        processing: false,
        error: action.payload
      }
    }

    default:
      return state
  }
}

