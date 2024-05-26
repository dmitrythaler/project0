import {
  logger,
  assertPermissions,
  createRBACFilter,
  makeBrandedValue
} from '@p0/common'

import { getDAL } from '@p0/dal'
import { ensureUser } from '../core/index.ts'
import { getS3 } from '../services/aws-s3.ts'

import type { RequestExt } from '../core/index.ts'
import type { Media, MediaFile, MediaList } from '@p0/dal'
import type { MediaID, OrgID } from '@p0/common/types'

//  ---------------------------------

// TODO: FIXME: the Bucket name must be based on the orgId/Name
// this is temporary solution
const _bucketName = 'p0'

export const getMediaList = async ({ ctx }: RequestExt): Promise<MediaList> => {
  const currUser = ensureUser(ctx)
  const filter = createRBACFilter(currUser, 'Media')
  if (filter === false) {
    return { data: [], meta: { total: 0 } }
  }
  if (filter === true) {
    return getDAL().getMediaDAL().getList()
  }
  return getDAL().getMediaDAL().getList({ filter })
}

export const getMediaById = async ({ ctx, params }: RequestExt): Promise<{ media: Media }> => {
  const currUser = ensureUser(ctx)
  const media = await getDAL().getMediaDAL().getById(makeBrandedValue<MediaID>(params.id))
  assertPermissions(currUser, 'Media:Get', media)
  return { media }
}

export const postCreateMedia = async ({ ctx, body }: RequestExt)
  : Promise<{ _ids: string[], presignedUrls: string[] }> => {
  const currUser = ensureUser(ctx)
  const { slug, files, orgId } = body.data as { slug: string, files: MediaFile[], orgId: OrgID }

  // TODO: check permissions and correctness of the orgId
  assertPermissions(currUser, 'Media:Create', {
    // pseudo entity to check Permissions
    _id: '' as MediaID, // it doesn't matter
    type: 'Media',
    orgId,
    ownerId: currUser._id
  })

  const mediaDAL = getDAL().getMediaDAL()
  const records = await mediaDAL.storeMediaData(files, currUser._id, orgId, slug)

  // create presigned URLs to upload files right from F/E
  const bucketFiles = records.map(getMediaName)
  const s3 = await getS3()

  // TODO: FIXME: the Bucket name must be based on the orgId/Name
  const getPresignedUrls = bucketFiles.map(fileName => s3.getPresignedUrl(_bucketName, fileName, 60))
  const presignedUrls = await Promise.all(getPresignedUrls)

  records.forEach((record, idx) => {
    record.storagePath = bucketFiles[idx]
  });
  await mediaDAL.updateMediaStoragePath(records)

  return {
    _ids: records.map(r => r._id!),
    presignedUrls
  }
}

export const patchUpdateMedia = async ({ ctx, body }: RequestExt): Promise<{ count: number }> => {
  const currUser = ensureUser(ctx)
  const { _id, newSlug, updateAllSlugs }: {
    _id: MediaID,
    slug: string,
    newSlug: string,
    updateAllSlugs: boolean
  } = body.data

  let count: number
  const mediaDAL = getDAL().getMediaDAL()
  const media = await mediaDAL.getById(_id)

  assertPermissions(currUser, 'Media:Update', media)

  if (updateAllSlugs) {
    // TODO: good place for optimization, updateAllMediaWithSlug will get the media by _id again to know orgId
    count = await mediaDAL.updateAllMediaWithSlug(_id, newSlug)
  } else {
    count = await mediaDAL.updateMedia(_id, newSlug)
  }

  return { count }
}

export const deleteMedia = async ({ ctx, params }: RequestExt): Promise<{}> => {
  const currUser = ensureUser(ctx)
  const mediaId = makeBrandedValue<MediaID>(params.id)
  const mediaDAL = getDAL().getMediaDAL()
  const media = await mediaDAL.getById(mediaId)

  assertPermissions(currUser, 'Media:Delete', media)
  await mediaDAL.delete(mediaId)

  const s3 = await getS3()
  // TODO: FIXME: the Bucket name must be based on the orgId/Name
  await s3.deleteObject(_bucketName, media.storagePath!)

  return {}
}

// TODO: assertPermissions :
// NOTE: this method needed only to undo creation (in case F/E files uploads went wrong)
// so it's not clear how to check permissions and do they need to be checked at all
export const patchUndoCreateMedia = async ({ ctx, body }: RequestExt): Promise<{ count: number }> => {
  /* const currUser =  */ensureUser(ctx)
  const { _ids }: { _ids: MediaID[] } = body.data

  logger.info('+++ patchUndoCreateMedia', body)

  const count = _ids.length
  await getDAL().getMediaDAL().deleteMany(_ids)
  return { count }
}

const getMediaName = (m: Media): string => m._id
  ? (m.slug
    ? `${m._id}-${m.slug}.${m.ext}`
    : `${m._id}.${m.ext}`)
  : ''
