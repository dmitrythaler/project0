import assert from 'node:assert'
import { SquidexService } from '../../src/services/squidex'
import type * as T from '../../src/services/squidex'
// import { logger } from '@p0/common'

describe('Squidex Service suite', () => {

  const wait = async ms => new Promise(res => setTimeout(res, ms))

  const appName = 'some-test-course'
  let service: SquidexService
  let moduleId: string
  let itemId: string
  let courseId: string
  let topicId: string
  let glossaryId: string

  beforeAll(async () => {
    service = new SquidexService(appName)
  })

  afterAll(async () => {
    await wait(1000)
  })

  //  ---------------------------------


  it('Should retrieve Entities', async () => {
    const data = await service.getEntity({
      entity: 'topic',
      limit: 3
    }) as T.Entities
    assert.ok(data.total)
    assert.strictEqual(data.items.length, 3)
    assert.strictEqual(data.total, 3)
  })

  it('Should retrieve Entity by id', async () => {
    const data = await service.getEntity({
      entity: 'topic',
      id: topicId
    }) as T.Entities
    assert.ok(data)
    // assert.strictEqual(data.id, moduleId)
  })


})
