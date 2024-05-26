import { createReducer, createAction } from '@reduxjs/toolkit'
import {
  MEDIA_REQUEST,
  MEDIA_LOADED,
  MEDIA_UPLOADED,
  MEDIA_UPDATED,
  MEDIA_DELETED,
  MEDIA_ERROR
} from '@p0/common/constants'

import type * as RT from '@reduxjs/toolkit'
import type { Media } from '@p0/dal'
import type { IAPIError } from '@p0/common/types'


//  ---------------------------------

// actions
export const processingStartedAction = createAction<string>(MEDIA_REQUEST)
export const processingErrorAction = createAction<IAPIError>(MEDIA_ERROR)
export const mediaLoadedAction = createAction<Media[]>(MEDIA_LOADED)
export const mediaUploadedAction = createAction(MEDIA_UPLOADED)
export const mediaUpdatedAction = createAction(MEDIA_UPDATED)
export const mediaDeletedAction = createAction<string>(MEDIA_DELETED)

// reducer

export type MediaData = {
  media: Media[]
  processing?: false|string,
  error?: IAPIError
}

const mediaReducer: RT.Reducer = createReducer(
  {
    media: [],
    processing: false,
  } as MediaData,
  (builder) => {
    builder.addCase(processingStartedAction, (state, action) => {
      state.processing = action.payload
      state.error = undefined
    })
    builder.addCase(processingErrorAction, (state, action) => {
      state.processing = false
      state.error = action.payload
    })
    builder.addCase(mediaLoadedAction, (state, action) => {
      state.processing = false
      state.media = action.payload as Media[]
    })
    builder.addCase(mediaUploadedAction, (state/* , action */) => {
      state.processing = false
    })
    builder.addCase(mediaUpdatedAction, (state/* , action */) => {
      state.processing = false
    })
    builder.addCase(mediaDeletedAction, (state, action) => {
      const idx = state.media.findIndex(c => c._id === action.payload)
      if (idx !== -1) {
        state.media.splice(idx, 1)
      }
    })
  }
)

export default mediaReducer
