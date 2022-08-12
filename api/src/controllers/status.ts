import { config } from '../core/index.js'
import { SquidexService } from '../services/squidex/index.js'
import { watcher } from '../services/publisher/index.js'
import type { Keyed } from '@p0/common'

const squidex = new SquidexService()

export const getStatus = async (): Promise<Keyed> => {
  const response = {
    desc: config.description,
    version: config.version,
    env: config.env,
    hash: config.gitHash,
    squidex: 'OK',
    // TODO:
    aws: 'OK',
    db: 'OK',
    publisher: {
      active: watcher.isActive(),
      status: watcher.getStatus()
    }
  }
  try {
    await squidex.ping()
  } catch (error) {
    response.squidex = 'Connection error: ' + (error as Error).toString()
  }
  return response
}
