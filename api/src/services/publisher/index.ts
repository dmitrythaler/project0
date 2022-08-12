import { Publisher, Phase, Result } from './publisher.js'
import { PublisherWatcher, PublisherStatus } from './watcher.js'

const publisher = new Publisher()
const watcher = new PublisherWatcher(publisher)

export { Publisher, PublisherWatcher, Phase as PublishPhase, Result as PublishResult }
export type { PublisherStatus }
export { publisher, watcher }
