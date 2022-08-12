import { updateRuleDAL, courseDAL } from '@p0/dal'
import { ensureUser } from '../core/index.js'
import { broadcast } from '../services/wss.js'
import { SquidexService } from '../services/squidex/index.js'

import type { Keyed } from '@p0/common'
import type { RequestExt } from '../core/index.js'

//  ----------------------------------------------------------------------------------------------//

export const getRulesList = async ({ ctx, params }: RequestExt): Promise<Keyed> => {
  ensureUser(ctx)
  const courseId = params.id
  const rules = await updateRuleDAL.getList(courseId)
  return { rules }
}

export const getRuleById = async ({ ctx, params }: RequestExt): Promise<Keyed> => {
  ensureUser(ctx)
  const ruleId = params.id
  const rule = await updateRuleDAL.getById(ruleId)
  return { rule }
}

export const postCreateRule = async ({ ctx, body }: RequestExt): Promise<Keyed> => {
  const currUser = ensureUser(ctx)
  const rule = await updateRuleDAL.create(body.data)
  broadcast({
    source: 'UPDATE_RULE',
    event: 'CREATE',
    data: {
      actorId: currUser.uuid,
      ruleId: rule.uuid
    }
  })

  return { rule }
}

export const patchUpdateRule = async ({ ctx, params, body }: RequestExt): Promise<Keyed> => {
  const currUser = ensureUser(ctx)
  const ruleId = params.id

  const rule = await updateRuleDAL.update(ruleId, body.data)
  broadcast({
    source: 'UPDATE_RULE',
    event: 'UPDATE',
    data: {
      actorId: currUser.uuid,
      ruleId
    }
  })

  return { rule }
}

export const deleteRule = async ({ ctx, params }: RequestExt): Promise<Keyed> => {
  const currUser = ensureUser(ctx)
  await updateRuleDAL.delete(params.id)
  broadcast({
    source: 'UPDATE_RULE',
    event: 'DELETE',
    data: {
      actorId: currUser.uuid,
      ruleId: params.id
    }
  })

  return {}
}

export const patchApplyRule = async ({ ctx, params, body }: RequestExt): Promise<Keyed> => {
  ensureUser(ctx)
  const ruleId = params.id
  const { dry } = body.data || { dry: true } // TODO:
  const rule = await updateRuleDAL.getById(ruleId)
  const course = await courseDAL.getById(rule.courseId)

  const squidex = new SquidexService(course.name)
  await squidex.setCreds(course.squidexId, course.squidexSecret)

  let log
  if (rule.updatePath && rule.updateFunc) {
    log = await squidex.bulkUpdate(
      course.name,
      rule.testPath,
      rule.testFunc,
      rule.updatePath,
      rule.updateFunc,
      dry
    )
  } else {
    log = await squidex.bulkTest(
      course.name,
      rule.testPath,
      rule.testFunc
    )
  }

  return { log }
}
