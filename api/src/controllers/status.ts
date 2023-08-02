import { config } from '../core'
import type { AppStatus } from '@p0/common/types'

export const getStatus = async (): Promise<{ status: AppStatus }> => {
  return {
    status: {
      desc: config.description,
      version: config.version,
      env: config.env,
      hash: config.gitHash,
      // TODO:
      db: 'OK',
    }
  }
}
