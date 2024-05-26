import { GenericContainer, Wait } from "testcontainers"
import type { TestContainer, StartedTestContainer } from "testcontainers"

//  ---------------------------------

const gtc: TestContainer = new GenericContainer('mongo')
  // .withName('test_mongo')
  .withStartupTimeout(30_000)
  .withExposedPorts(27017)
  // waiting for container port 27017 doesn't work here, bug?
  .withWaitStrategy(Wait.forLogMessage('Waiting for connections'))

let running: StartedTestContainer
let refCount = 0

export const startContainer = async (): Promise<StartedTestContainer> => {
  if (refCount === 0) {
    console.log('MongoDB container starting ...')
    running = await gtc.start()
    console.log('... done: id:', running.getId())
  }
  ++refCount
  return running
}

export const stopContainer = async () => {
  if (--refCount <= 0) {
    console.log('MongoDB container stopping ...')
    await running.stop()
    console.log('... done')
    refCount = 0
  }
}
