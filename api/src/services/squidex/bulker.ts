import { inspect } from 'util'
import { APIError, logger, assertNonNullable } from '@p0/common'

//  ---------------------------------

export type JSONObject = Record<string, any>
export type TestFunc = ($node: any, $log: any, $path: string) => boolean
export type UpdateFunc = ($node: any, $log: any, $path: string) => void

export type BulkUpdateConfig = {
  path2test?: string[],
  testFunc?: TestFunc,
  path2update?: string[],
  updateFunc?: UpdateFunc,
  currPath?: string
}

export class Bulker {
  private logs: string

  /**
   * @constructor
   */
  constructor() {
    this.logs = ''
  }

  log(...args: any[]): void {
    this.logs += args.reduce((prev, curr) => (curr !== null && typeof(curr) === 'object')
        ? prev + ' ' + inspect(curr, { showHidden: false, depth: null, colors: false })
        : prev + ' ' + curr
      , '') + '\n'
  }

  getLog(): string {
    return this.logs
  }

  clearLog(): void {
    this.logs = ''
  }

  static buildTestFunc(body: string): TestFunc {
    return new Function('$node', '$log', '$path', body) as TestFunc
  }

  static buildUpdateFunc(body: string): UpdateFunc {
    return new Function('$node', '$log', '$path', body) as UpdateFunc
  }

  /**
   * Traverses thru data accordingly the filter path and
   * checks values against test func, filter out branches where the test func returns false (it keeps original arrays to a separate branch)
   * (see SquidexService.bulkUpdate)
   *
   * @param {JSONObject} data
   * @returns JSONObject | undefined
   */
  filterPaths(data: JSONObject, cfg: BulkUpdateConfig): JSONObject | undefined {
    const testFunc = assertNonNullable(cfg.testFunc)
    let currPath = assertNonNullable(cfg.currPath)

    const [head, ...tail] = assertNonNullable(cfg.path2test)
    const [head0, head1] = head.split('[')
    let nextData, idx

    if (Array.isArray(data[head0])) {
      if (head1 && head1 !== '*]') {
        // head segment contains [N] part and N is not *, parse index
        idx = parseFloat(head1.slice(0, -1))
        if (isNaN(idx)) {
          // index parse failure, throws
          throw new APIError(400, 'Bulker:testPath error: array index parse failure')
        }
        // here's the index, using array elem
        nextData = data[head0][idx]
      } else {
        // no index, using the array itself
        nextData = data[head0]
      }
    } else {
      // it's not an array, using property
      nextData = data[head0]
    }

    const id = data.id?.iv || data.id
    currPath = currPath + (id ? `(${id})` : '')
    const nextPath = `${currPath ? currPath + '.' : ''}${head0}`
    if (tail.length === 0) {
      // last segment, get value and apply testFunc
      try {
        return testFunc(nextData, this.log.bind(this), nextPath) ? data : undefined
      } catch (error) {
        logger.error('testFunc exec error. Parameters: data', nextData, ', path', nextPath, ', error', (<Error>error).message)
        throw error
      }
    } else {
      if (Array.isArray(nextData)) {
        // nextData is an array, filter it
        const nextRes = nextData
          .map((nd, idx) => {
            return this.filterPaths(nd, {
              path2test: tail,
              testFunc,
              currPath: `${nextPath}[${idx}]`
            })
          })
          .filter(nd => nd !== undefined)

        // store both filtered and original values
        if (idx !== undefined) {
          data[head0 + '$orig'][idx] = nextData
          data[head0][idx] = nextRes
        } else {
          data[head0 + '$orig'] = nextData
          data[head0] = nextRes
        }

        return nextRes.length ? data : undefined
      } else if (typeof nextData === 'object' && nextData !== null) {
        const nextRes = this.filterPaths(nextData, {
          path2test: tail,
          testFunc,
          currPath: nextPath
        })
        return nextRes ? data : undefined
      } else {
        return undefined
      }
    }
  }

  /**
   * Traverses thru update path(assuming only remaining branches) and
   * applies update func to the above path nodes
   * (see SquidexService.bulkUpdate)
   *
   * @param data
   */
  updatePaths(data: JSONObject, cfg: BulkUpdateConfig): void {
    const updateFunc = assertNonNullable(cfg.updateFunc)
    let currPath = assertNonNullable(cfg.currPath)

    const [head, ...tail] = assertNonNullable(cfg.path2update)
    const [head0, head1] = head.split('[')
    let nextData, idx

    if (Array.isArray(data[head0])) {
      if (head1 && head1 !== '*]') {
        // head segment contains [N] part and N is not *, parse index
        idx = parseFloat(head1.slice(0, -1))
        if (isNaN(idx)) {
          // index parse failure, throws
          throw new APIError(400, 'Bulker:updatePaths error: array index parse failure')
        }
        // here's the index, using array elem
        nextData = data[head0][idx]
      } else {
        // no index, using the array itself
        nextData = data[head0]
      }
    } else {
      // it's not an array, using property
      nextData = data[head0]
    }

    const id = data.id?.iv || data.id
    currPath = currPath + (id ? `(${id})` : '')
    const nextPath = `${currPath ? currPath + '.' : ''}${head0}`
    if (tail.length === 0) {
      // last segment, get value and updateFunc
      try {
        updateFunc(nextData, this.log.bind(this), nextPath)
      } catch (error) {
        logger.error('updateFunc exec error. Parameters: data', nextData, ', path', nextPath, ', error', (<Error>error).message)
        throw error
      }
    } else {
      if (Array.isArray(nextData)) {
        // nextData is an array, filter it
        nextData.map((nd, idx) => this.updatePaths(nd, {
          path2update: tail,
          updateFunc,
          currPath: `${nextPath}[${idx}]`
        }))
      } else if (typeof nextData === 'object' && nextData !== null) {
        this.updatePaths(nextData, {
          path2update: tail,
          updateFunc,
          currPath: nextPath
        })
      }
    }
  }

  /**
   * Restores filtered out branches
   * (see SquidexService.bulkUpdate)
   *
   * @param data
   */
  restoreOrigArrays(data: JSONObject): void {
    if (Array.isArray(data)) {
      data.forEach(item => this.restoreOrigArrays(item))
    } else if (typeof data === 'object' && data !== null) {
      for (const prop in data) {
        if (prop.endsWith('$orig')) {
          continue
        }
        if (data[prop + '$orig']) {
          data[prop] = data[prop + '$orig']
          delete data[prop + '$orig']
        }

        this.restoreOrigArrays(data[prop])
      }
    }
  }

}
