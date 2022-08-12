import { logger, APIError } from '@p0/common'
import { UserRole, courseDAL } from '@p0/dal'
import { SquidexService } from '../services/squidex/index.js'
import { ensureUser } from '../core/index.js'
import { broadcast } from '../services/wss.js'

import type { Keyed } from '@p0/common'
import type { RequestExt } from '../core/index.js'
import type { Course } from '@p0/dal'
// import type { Response } from 'express'

//  ---------------------------------

const hideCreds = (course: Course.DBRecord): Course.DBRecord => ({
    ...course,
    squidexId: '********',
    squidexSecret: '********'
  })


const squidexService = new SquidexService()

//  ---------------------------------

export const getCoursesList = async ({ ctx }: RequestExt): Promise<Keyed> => {
  const currUser = ensureUser(ctx)
  const courses = await courseDAL.getList()
  return (currUser.role !== UserRole.Admin)
    ? { courses: courses.map(hideCreds) }
    : { courses }
}

export const getCourseByName = async ({ ctx, params }: RequestExt): Promise<Keyed> => {
  const currUser = ensureUser(ctx)

  const courseName = params.name
  const course = await courseDAL.getByName(courseName)
  return (currUser.role !== UserRole.Admin)
    ? { course: hideCreds(course) }
    : { course }
}

export const getCourseById = async ({ ctx, params }: RequestExt): Promise<Keyed> => {
  const currUser = ensureUser(ctx)

  const courseId = params.id
  const course = await courseDAL.getById(courseId)
  return (currUser.role !== UserRole.Admin)
    ? { course: hideCreds(course) }
    : { course }
}

export const postCreateCourse = async ({ ctx, body }: RequestExt): Promise<Keyed> => {
  const currUser = ensureUser(ctx)

  if (currUser.role !== UserRole.Admin) {
    logger.error(`ACCESS VIOLATION: role ${currUser.role} has no enough rights, session ${ctx?.sessionId}`)
    throw new APIError(403)
  }

  const course = await courseDAL.create(body.data)
  broadcast({
    source: 'COURSE',
    event: 'CREATE',
    data: {
      actorId: currUser.uuid,
      courseId: course.uuid
    }
  })

  return { course }
}

export const patchUpdateCourse = async ({ ctx, params, body }: RequestExt): Promise<Keyed> => {
  const currUser = ensureUser(ctx)

  const courseId = params.id
  if (currUser.role !== UserRole.Admin) {
    delete body.data.squidexId
    delete body.data.squidexSecret
  }

  const course = await courseDAL.update(courseId, body.data)
  broadcast({
    source: 'COURSE',
    event: 'UPDATE',
    data: {
      actorId: currUser.uuid,
      courseId
    }
  })

  return (currUser.role !== UserRole.Admin)
    ? { course: hideCreds(course) }
    : { course }
}

export const patchCheckAccessLevel = async ({ ctx, params }: RequestExt): Promise<Keyed> => {
  const currUser = ensureUser(ctx)

  const courseName = params.name
  let course = await courseDAL.getByName(courseName)
  const level = await squidexService.checkAccessLevel(course.squidexId, course.squidexSecret, courseName)
  course = await courseDAL.update(<string>course.uuid, { squidexAuthState: level })

  return (currUser.role !== UserRole.Admin)
    ? { course: hideCreds(course) }
    : { course }
}

export const deleteCourse = async ({ ctx, params }: RequestExt): Promise<Keyed> => {
  const currUser = ensureUser(ctx)
  if (currUser.role !== UserRole.Admin) {
    logger.error(`ACCESS VIOLATION: role ${currUser.role} has no enough rights, session ${ctx?.sessionId}`)
    throw new APIError(403)
  }

  await courseDAL.delete(params.id)
  broadcast({
    source: 'COURSE',
    event: 'DELETE',
    data: {
      actorId: currUser.uuid,
      courseId: params.id
    }
  })

  return {}
}

