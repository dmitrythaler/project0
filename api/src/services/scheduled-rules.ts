import * as cron from 'node-cron'

import { logger, APIError } from '@p0/common'
import { updateRuleDAL, configDAL } from '@p0/dal'
import { broadcast } from './wss.js'
import { SquidexService } from './squidex/index.js'
import { sendScheduledTestsLog } from './sendgrid.js'

import type { UpdateRule } from '@p0/dal'

//  ----------------------------------------------------------------------------------------------//

class ScheduledRules {
  private running: boolean

  constructor() {
    this.running = false
  }

  async run () {
    if (this.running) {
      throw new APIError(409, 'Conflict: Testing Rules are being executing now, pls return few minutes later...')
    }

    const conf = await configDAL.getData()
    const logRecipients = <string>conf.data.logRecipients
    if (!logRecipients) {
      throw new APIError(500, 'ScheduledRules.run(): log recipients list is empty or not defined!')
    }

    const rules: UpdateRule.DBRecordC[] = await updateRuleDAL.getListToRunByCron()
    let log = `${new Date().toISOString().slice(0, -5)}: Scheduled Test Rules starting, ${rules.length} rules loaded\n\n`

    const squidex = new SquidexService()
    let currCourseName = ''
    let applied = 0
    let failed = 0

    broadcast({
      source: 'UPDATE_RULE',
      event: 'SCHEDULED_START',
      data: {}
    })

    for (const rule of rules) {
      try {
        if (rule.courseName !== currCourseName) {
          squidex.setAppName(rule.courseName)
          await squidex.setCreds(rule.squidexId, rule.squidexSecret)
          currCourseName = rule.courseName
        }

        log += `Course [${currCourseName}], Rule [${rule.name}] started:`
        log += await squidex.bulkTest(rule.courseName, rule.testPath, rule.testFunc)
        ++applied
      } catch (err) {
        log += `Error: ${(<Error>err).toString()}`
        ++failed
      }
      log += `Course [${currCourseName}], Rule [${rule.name}] done\n`
    }

    this.running = false
    broadcast({
      source: 'UPDATE_RULE',
      event: 'SCHEDULED_STOP',
      data: { applied, failed }
    })

    await sendScheduledTestsLog(logRecipients.split(','), log, applied, failed)
  }

  async schedule() {
    const conf = await configDAL.getData()
    const cronString = <string>conf.data.cronString
    if (!cronString) {
      logger.error('ScheduledRules.schedule(): cron string is not defined in config, schedule cancelled!')
      return
    }

    if (!cron.validate(cronString)) {
      logger.error('ScheduledRules.schedule(): cron string invalid, schedule cancelled!')
      return
    }

    logger.info(`Schedule for the Test Rules (re)initializing, cron string [${cronString}]`)
    cron.schedule(cronString, async () => {
      try {
        await this.run()
      } catch (err) {
        logger.error('Scheduled Tests failed', (<Error>err).toString())
      }
    })
  }
}

//  ---------------------------------
export const scheduledRules = new ScheduledRules()


