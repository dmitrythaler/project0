import { APIError } from '@p0/common'
import { courseDAL, configDAL } from '@p0/dal'
import { ensureUser } from '../core/index.js'
import { publisher, watcher, PublishResult } from '../services/publisher/index.js'

import type { Keyed } from '@p0/common'
import type { RequestExt } from '../core/index.js'

//  ---------------------------------

publisher.on('stop', async (res: PublishResult) => {
  if (res === PublishResult.SUCCESS) {
    const status = watcher.getStatus()
    await courseDAL.updatePublished(status.appName)
  }
})

export const runPublisherRouteHandler = async ({ params, body, ctx }: RequestExt): Promise<Keyed> => {
  ensureUser(ctx)

  if (watcher.isActive()) {
    throw new APIError(409, 'Conflict: Publisher is already running!')
  }
  const appName = params.appName
  const course = await courseDAL.getByName(appName)
  const { data: config } = await configDAL.getData()

  //  no await intentionally!
  publisher.run({
    appName,
    folder: <string>course.s3Folder,
    prefix: course.prefix || '',
    version: <number>course.version,
    sqxId: course.squidexId,
    sqxSecret: course.squidexSecret,
    loadAssets: true,
    deleteNulls: config.deleteNulls || true,
    deleteEmptyString: config.deleteEmptyString || false,
    deleteEmptyArrays: config.deleteEmptyArrays || false,
  })

  return {
    publisher: {
      active: watcher.isActive(),
      status: watcher.getStatus()
    }
  }
}

export const patchUnpublishedRouteHandler = async ({ params, ctx }: RequestExt): Promise<Keyed> => {
  ensureUser(ctx)

  if (watcher.isActive()) {
    throw new APIError(409, 'Conflict: Publisher is running now, pls return few minutes later...')
  }
  const appName = params.appName
  let course = await courseDAL.getByName(appName)
  const after = course.publishedAt  // Date | null

  const unpublished = await publisher.getUnpublished({
    appName,
    sqxId: course.squidexId,
    sqxSecret: course.squidexSecret,
    after
  })

  course = await courseDAL.update(<string>course.uuid, { sincePublished: unpublished })
  return { course }
}
