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
import { errorPayload, apiInstance } from '@common'
import { sendMessageAction, sendErrorMessageAction } from './messages'

import type { Media } from '@p0/dal'
import type { ErrorPayload } from '@common'
import type { RootState, AppThunk, AppThunkDispatch } from '../store'


//  ----------------------------------------------------------------------------------------------//
// types and consts

const ROUTE = '/media'

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
  media: Media.Self
  originalSlug: string
  updateAllSlugs: boolean
}

export const getDefaultMedia = (): Media.Self => ({
  fileName: '',
  fileSize: 0,
  height: 0,
  width: 0,
  ext: '',
  ownerId: '',
  slug: ''
})

//  ---------------------------------
//  selectors

export const getMedia = (state: RootState) => state[BRANCH].media
export const isLoading = (state: RootState) => state[BRANCH].processing === MEDIA_FETCH
export const getError = (state: RootState) =>
  state[BRANCH].error
    ? errorPayload(state[BRANCH].error!)
    : null

//  ----------------------------------------------------------------------------------------------//
//  async action creators

const handleError = (err: unknown, dispatch: AppThunkDispatch) => {
  const error = errorPayload(<ErrorPayload>err)
  dispatch(sendErrorMessageAction(error))
  dispatch({ type: MEDIA_ERROR, payload: error })
}

//  ---------------------------------
export const fetchMediaAction = (): AppThunk =>
  async (dispatch: AppThunkDispatch) => {
    dispatch({ type: MEDIA_FETCH })
    try {
      const resp = await apiInstance.get(`${ROUTE}/list`)
      dispatch({
        type: MEDIA_LOADED,
        payload: resp.data.media
      })
    } catch (err) {
      handleError(err, dispatch)
    }
  }

export const uploadMediaAction = ({ filesWithDimensions, slug }: UploadInput): AppThunk =>
  async (dispatch: AppThunkDispatch) => {
    dispatch({ type: MEDIA_UPLOAD })

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

      dispatch(sendMessageAction(`${presignedUrls.length} media files uploaded.`))
      dispatch({ type: MEDIA_UPLOADED })
      dispatch(fetchMediaAction())
    } catch(err) {
      if (dataUploaded && !filesUploaded) {
        // remove media records
        const { data: { count }} = await apiInstance.patch(`${ROUTE}/undo`, { data: { _ids } })
        console.warn(`File upload failure, ${count} records addition undone`)
      }
      handleError(err, dispatch)
    }
  }

export const updateMediaAction = ({ media, originalSlug, updateAllSlugs }: UpdateInput): AppThunk =>
  async (dispatch: AppThunkDispatch) => {
    dispatch({ type: MEDIA_UPDATE })

    try {
      const { _id, slug: newSlug } = media
      const resp = await apiInstance.patch(`${ROUTE}/`, {
        data: { _id, slug: originalSlug, newSlug, updateAllSlugs }
      })
      dispatch(sendMessageAction(`${resp.data.count} media records with slug "${originalSlug}" updated.`))
      dispatch({ type: MEDIA_UPDATED })
      dispatch(fetchMediaAction())
    } catch (err) {
      handleError(err, dispatch)
    }
  }

export const deleteMediaAction = (media: Media.Self): AppThunk =>
  async (dispatch: AppThunkDispatch) => {
    dispatch({ type: MEDIA_DELETE })
    try {
      await apiInstance.delete(`${ROUTE}/${media._id}`)
      dispatch(sendMessageAction(`The media "${media.slug || ''} (${media._id})" deleted.`))
      dispatch({ type: MEDIA_DELETED })
      dispatch(fetchMediaAction())
    } catch(err) {
      handleError(err, dispatch)
    }
  }

