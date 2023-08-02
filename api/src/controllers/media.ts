import { extname } from 'node:path'
import {
  APIError,
  logger,
  MEDIA_UPLOADED,
  MEDIA_UPDATED,
  MEDIA_DELETED
} from '@p0/common'

import { getDAL } from '@p0/dal'
import { ensureUser } from '../core/index.ts'
import { getWss } from '../services/wss.ts'
import { getMinio } from '../services/minio.ts'

import type { RequestExt } from '../core/index.ts'
import type { Media } from '@p0/dal'

//  ---------------------------------

const getMediaName = (m: Media.Self): string => m._id
  ? (m.slug
    ? `${m._id}-${m.slug}.${m.ext}`
    : `${m._id}.${m.ext}`)
  : ''

export const getMediaList = async ({ ctx }: RequestExt): Promise<{ media: Media.Self[] }> => {
  const currUser = ensureUser(ctx)
  if (currUser.role !== 'Admin') {
    const media = await getDAL().getMediaDAL().getList(currUser._id as string)
    return { media }
  }
  const media = await getDAL().getMediaDAL().getList()
  return { media }
}

export const getMediaById = async ({ ctx, params }: RequestExt): Promise<{ media: Media.Self }> => {
  const currUser = ensureUser(ctx)
  const mediaId = params.id
  const ownerId = currUser.role !== 'Admin' ? null : <string>currUser._id
  const media = await getDAL().getMediaDAL().getById(ownerId, mediaId)
  return { media }
}

export const postCreateMedia = async ({ ctx, body }: RequestExt)
  : Promise<{ _ids: string[], presignedUrls: string[] }> => {
  const currUser = ensureUser(ctx)

  const { slug, files } = body.data as { slug: string, files: Media.SelfFile[] }
  const records = await getDAL().getMediaDAL().storeMediaData(<string>currUser._id, files, <string>slug)
  const bucketFiles = records.map(getMediaName)

  const minio = await getMinio()
  const getPresignedUrls = bucketFiles.map(fileName => minio.presignedPutObjectUrl(fileName, 60))
  const presignedUrls = await Promise.all(getPresignedUrls)

  records.forEach((record, idx) => {
    record.storagePath = bucketFiles[idx]
  });
  await getDAL().getMediaDAL().updateMediaStoragePath(<string>currUser._id, records)

  getWss().broadcast({
    type: MEDIA_UPLOADED,
    payload: {
      actorId: currUser._id,
      count: records.length
    }
  })

  return {
    _ids: records.map(r => r._id!),
    presignedUrls
  }
}

export const patchUpdateMedia = async ({ ctx, body }: RequestExt): Promise<{ count: number }> => {
  const currUser = ensureUser(ctx)
  const { _id, slug, newSlug, updateAllSlugs } = body.data
  if (!newSlug) {
    logger.error('Insufficient data provided', body.data)
    throw new APIError(400, 'Insufficient data provided')
  }

  let count
  if (slug && updateAllSlugs) {
    count = await getDAL().getMediaDAL().updateAllMediaWithSlug(<string>currUser._id, slug, newSlug)
  } else if ( _id ) {
    count = await getDAL().getMediaDAL().updateMedia(<string>currUser._id, _id, newSlug)
  } else {
    logger.error('Insufficient data provided', body.data)
    throw new APIError(400, 'Insufficient data provided')
  }

  getWss().broadcast({
    type: MEDIA_UPDATED,
    payload: {
      actorId: currUser._id,
      count
    }
  })

  return { count }
}

export const deleteMedia = async ({ ctx, params }: RequestExt): Promise<{}> => {
  const currUser = ensureUser(ctx)
  const mediaId = params.id
  const ownerId = currUser.role !== 'Admin' ? <string>currUser._id : null
  const media = await getDAL().getMediaDAL().delete(ownerId, mediaId)
  const minio = await getMinio()
  await minio.removeObject(media.storagePath!)

  getWss().broadcast({
    type: MEDIA_DELETED,
    payload: {
      actorId: currUser._id,
      mediaId: mediaId
    }
  })
  return {}
}

export const patchUndoCreateMedia = async ({ ctx, body }: RequestExt): Promise<{ count: number }> => {
  const currUser = ensureUser(ctx)
  const { _ids } = body.data

  logger.info('+++ patchUndoCreateMedia', body)

  const count = _ids.length
  await getDAL().getMediaDAL().deleteMany(<string>currUser._id, _ids)

  getWss().broadcast({
    type: MEDIA_DELETED,
    payload: {
      actorId: currUser._id,
      count
    }
  })
  return { count }
}


