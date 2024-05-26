import {
  MEDIA_BRANCH as BRANCH,
  MEDIA_FETCH,
  MEDIA_UPLOAD,
  MEDIA_UPDATE,
  MEDIA_DELETE
} from '@p0/common/constants'
import { errorPayload, apiInstance } from '@common'
import { sendMessage, sendErrorMessage } from './messages'
import {
  processingErrorAction,
  processingStartedAction,
  mediaLoadedAction,
  mediaUploadedAction,
  mediaUpdatedAction,
  mediaDeletedAction
} from '../reducers/media'

import type { AppState, AppDispatch } from '../store'
import type { ErrorPayload } from '@common'
import type { Media } from '@p0/dal'

export * from '../reducers/media'

//  ---------------------------------

// selectors
export const getMedia = (state: AppState) => state[BRANCH].media
export const isProcessing = (state: AppState) => state[BRANCH].processing
export const getError = (state: AppState) => state[BRANCH].error && errorPayload(state[BRANCH].error)

// utils
export const getDefaultMedia = (): Media => ({
  fileName: '',
  fileSize: 0,
  height: 0,
  width: 0,
  ext: '',
  ownerId: '',
  slug: ''
})

const handleError = (err: unknown, dispatch) => {
  const error = errorPayload(<ErrorPayload>err)
  dispatch(sendErrorMessage(error))
  dispatch(processingErrorAction(error))
}

// thunks
export type FileWithDimensions = {
  file: File,
  width: number
  height: number
}

type UploadInput = {
  filesWithDimensions: FileWithDimensions[],
  slug: string
}

type UpdateInput = {
  media: Media
  originalSlug: string
  updateAllSlugs: boolean
}

const ROUTE = '/media'

export const fetchMediaAction = () =>
  async (dispatch: AppDispatch) => {
    dispatch(processingStartedAction(MEDIA_FETCH))
    try {
      const resp = await apiInstance.get(`${ROUTE}/list`)
      dispatch(mediaLoadedAction(resp.data.media))
    } catch (err) {
      handleError(err, dispatch)
    }
  }

export const uploadMediaAction = ({ filesWithDimensions, slug }: UploadInput) =>
  async (dispatch: AppDispatch) => {
    dispatch(processingStartedAction(MEDIA_UPLOAD))

    let dataUploaded = false
    let filesUploaded = false
    let _ids = []
    try {
      const data = {
        slug,
        files: filesWithDimensions.map(f => ({
          fileName: f.file.name,
          fileSize: f.file.size,
          height: f.height,
          width: f.width,
        }))
      }
      // get upload presigned urls
      let resp = await apiInstance.post(ROUTE, { data })
      dataUploaded = true

      _ids = resp.data._ids
      const { presignedUrls } = resp.data
      // use the urls to upload the files directly
      const toUpload = filesWithDimensions.map(
        (f, idx) => fetch(presignedUrls[idx], { method: 'PUT', body: f.file })
      )
      await Promise.all(toUpload)
      filesUploaded = true

      dispatch(sendMessage(`${presignedUrls.length} media files uploaded.`))
      dispatch(mediaUploadedAction())
      dispatch(fetchMediaAction())
    } catch (err) {
      if (dataUploaded && !filesUploaded) {
        // remove media records
        const { data: { count } } = await apiInstance.patch(`${ROUTE}/undo`, { data: { _ids } })
        console.warn(`File upload failure, ${count} records addition undone`)
      }
      handleError(err, dispatch)
    }
  }

export const updateMediaAction = ({ media, originalSlug, updateAllSlugs }: UpdateInput) =>
  async (dispatch: AppDispatch) => {
    dispatch(processingStartedAction(MEDIA_UPDATE))

    try {
      const { _id, slug: newSlug } = media
      const resp = await apiInstance.patch(`${ROUTE}/`, {
        data: { _id, slug: originalSlug, newSlug, updateAllSlugs }
      })
      dispatch(sendMessage(`${resp.data.count} media records with slug "${originalSlug}" updated.`))
      dispatch(mediaUpdatedAction())
      dispatch(fetchMediaAction())
    } catch (err) {
      handleError(err, dispatch)
    }
  }

export const deleteMediaAction = (media: Media) =>
  async (dispatch: AppDispatch) => {
    dispatch(processingStartedAction(MEDIA_DELETE))
    try {
      await apiInstance.delete(`${ROUTE}/${media._id}`)
      dispatch(sendMessage(`The media "${media.slug || ''} (${media._id})" deleted.`))
      dispatch(mediaDeletedAction(media._id!))
    } catch (err) {
      handleError(err, dispatch)
    }
  }

