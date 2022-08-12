import { logger } from '@p0/common'
import { Publisher, Phase, Result } from './publisher.js'
import { broadcast } from '../wss.js'
import type { Keyed } from '@p0/common'
import type * as Squidex from '../squidex/index.js'

//  ----------------------------------------------------------------------------------------------//

export type PublisherStatus = {
  appName: string
  version: number
  beginTime: Date | null
  lastPhase: Phase
  lastUpdateTime: Date | null
  result: Result,
  error: Error | null,
  assetsNum: number
  assetsLoaded: number
}

//  ---------------------------------
export class PublisherWatcher {
  private publisher: Publisher
  private active: boolean
  private status!: PublisherStatus

  /**
   * @constructor
   */
  constructor(publisher: Publisher) {
    this.publisher = publisher
    this.active = false
    this.resetStatus()
    this.setListeners()
  }

  /**
   * @private
   */
  private resetStatus(appName = '', version = 1, now: Date | null = null): void {
    this.status = {
      appName: appName,
      version: version,
      beginTime: now,
      lastPhase: Phase.NONE,
      lastUpdateTime: now,
      result: Result.NONE,
      error: null,
      assetsNum: 0,
      assetsLoaded: 0
    }
  }

  /**
   * @private
   */
  private setListeners(): void {

    this.publisher.on('start', (appName: string, version: number) => {
      this.active = true
      this.resetStatus(appName, version, new Date())
      broadcast({
        source: 'PUB',
        event: 'START',
        data: this.status
      })
      logger.pub('Publishing started for ' + appName)
    })

    this.publisher.on('stop', (res: Result, data: Error) => {
      this.active = false
      this.status.lastUpdateTime = new Date()
      this.status.result = res
      if (res === Result.SUCCESS) {
        broadcast({
          source: 'PUB',
          event: 'SUCCESS',
          data: this.status
        })
        logger.pub(`Publishing finished successfully`)
      } else {
        this.status.error = data
        broadcast({
          source: 'PUB',
          event: 'ERROR',
          data: this.status
        })
        logger.error('Publishing failed', data.message, data.stack)
      }
    })

    this.publisher.on('processing', (phase: Phase, ...someData: unknown[]) => {
      this.status.lastUpdateTime = new Date()
      this.status.lastPhase = phase
      const brData: Keyed = {
        appName: this.status.appName
      }
      if (phase === Phase.LOAD_DATA_END) {
        const data = someData[0] as Squidex.AppEntities
        this.status.assetsNum = data.assets?.length || 0
        for (const entity in data) {
          brData[entity + 'Num'] = data[entity].length || 0
        }
      } else if (phase === Phase.ASSET_LOADED) {
        this.status.assetsLoaded++
        brData.assetsLoaded = this.status.assetsLoaded
        brData.assetsNum = this.status.assetsNum
        brData.fileName = someData[0]
      }
      broadcast({
        source: 'PUB',
        event: phase,
        data: brData
      })
      logger.pub(phase)
    })
  }

  /**
   * getters
   */
  isActive(): boolean {
    return this.active
  }

  getStatus(): PublisherStatus {
    return this.status
  }

}

