import { GenericContainer, Wait } from "testcontainers"
import type { TestContainer, StartedTestContainer } from "testcontainers"

//  ---------------------------------

const gtc: TestContainer = new GenericContainer('minio/minio:RELEASE.2024-01-16T16-07-38Z')
  .withStartupTimeout(30_000)
  .withExposedPorts(9000)
  .withEnvironment({
    MINIO_ROOT_USER: 'root',
    MINIO_ROOT_PASSWORD: 'brokenDefib',
    MINIO_VOLUMES: '/data',
  })
  .withCommand(['server', '/data']) //  without this it stops immediately after start
  .withWaitStrategy(Wait.forLogMessage('Documentation: '))
  // .withLogConsumer(stream => {
  //   stream.on("data", line => console.log('MinIO>', line.replace(/\n/g, '')))
  //   stream.on("err", line => console.error(line))
  //   stream.on("end", () => console.log("Stream closed"))
  // })

let running: StartedTestContainer
let refCount = 0

export const startMinioContainer = async (): Promise<StartedTestContainer> => {
  if (refCount === 0) {
    console.log('MinIO container starting ...')
    running = await gtc.start()
    console.log('... done: id:', running.getId())
  }
  ++refCount
  return running
}

export const stopMinioContainer = async () => {
  if (--refCount <= 0) {
    console.log('MinIO container stopping ...')
    await running.stop()
    console.log('... done')
    refCount = 0
  }
}
