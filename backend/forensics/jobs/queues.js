import { Queue } from 'bullmq'
import { getRedisConnection } from './redis.js'

export const EVIDENCE_QUEUE_NAME = 'evidence-processing'

export const evidenceQueue = new Queue(EVIDENCE_QUEUE_NAME, {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 60 * 60 * 24 * 7,
      count: 1000,
    },
    removeOnFail: {
      age: 60 * 60 * 24 * 14,
    },
  },
})

evidenceQueue.on('error', () => {
  // Prevent unhandled error event crashes when Redis is offline
})
