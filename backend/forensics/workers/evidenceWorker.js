import 'dotenv/config'
import mongoose from 'mongoose'
import { Worker } from 'bullmq'
import { getRedisConnection } from '../jobs/redis.js'
import { EVIDENCE_QUEUE_NAME } from '../jobs/queues.js'
import { processEvidenceJob } from '../jobs/evidenceProcessor.js'

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/forensicai'
await mongoose.connect(mongoUri)
console.log('Evidence worker connected to MongoDB')

const worker = new Worker(EVIDENCE_QUEUE_NAME, processEvidenceJob, {
  connection: getRedisConnection(),
  concurrency: parseInt(process.env.EVIDENCE_WORKER_CONCURRENCY || '2', 10),
})

worker.on('completed', job => {
  console.log(`Evidence job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`Evidence job ${job?.id} failed:`, err.message)
})

process.on('SIGINT', async () => {
  await worker.close()
  await mongoose.disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await worker.close()
  await mongoose.disconnect()
  process.exit(0)
})
