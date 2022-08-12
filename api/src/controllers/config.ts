import * as cron from 'node-cron'

import { logger, APIError } from '@p0/common'
import { UserRole, configDAL } from '@p0/dal'
import { ensureUser } from '../core/index.js'
import { scheduledRules } from '../services/scheduled-rules.js'

import type { Keyed } from '@p0/common'
import type { RequestExt } from '../core/index.js'
// import type { Course } from '@p0/dal'
// import type { Response } from 'express'

//  ---------------------------------

export const getConfig = async (/* { ctx }: RequestExt */): Promise<Keyed> => {
  // const currUser = ensureUser(ctx)
  // if (currUser.role !== UserRole.Admin) {
  //   logger.error(`ACCESS VIOLATION: role ${currUser.role} has no enough rights, session ${ctx?.sessionId}`)
  //   throw new APIError(403)
  // }

  const conf = await configDAL.getData()
  return conf.data
}

export const putUpdateConfig = async ({ ctx, body }: RequestExt): Promise<Keyed> => {
  const currUser = ensureUser(ctx)
  if (currUser.role !== UserRole.Admin) {
    logger.error(`ACCESS VIOLATION: role ${currUser.role} has no enough rights, session ${ctx?.sessionId}`)
    throw new APIError(403)
  }

  const config = body.data
  if (!config?.cronString || !cron.validate(config.cronString)) {
    logger.error('Config update: cron string invalid')
    throw new APIError(400, 'Config update: cron string invalid')
  }

  const prevConf = await configDAL.getData()
  await configDAL.update(config)
  if (config.cronString !== prevConf.data.cronString) {
    await scheduledRules.schedule()
  }
  return config
}

