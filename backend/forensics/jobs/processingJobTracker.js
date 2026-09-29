import ProcessingJob from '../models/ProcessingJob.js'

export async function recordQueuedJob({ job, type, caseId, evidenceId, reportId, requestedBy, metadata }) {
  return ProcessingJob.create({
    queueJobId: String(job.id),
    queueName: job.queueName,
    type,
    status: 'queued',
    progress: 0,
    message: 'Job queued',
    caseId,
    evidenceId,
    reportId,
    requestedBy,
    metadata,
  })
}

export async function updateTrackedJob(job, updates) {
  const queueName = job.queueName || job.queue?.name
  return ProcessingJob.findOneAndUpdate(
    { queueJobId: String(job.id), queueName },
    { $set: updates },
    { new: true }
  )
}

export async function markJobRunning(job, message) {
  return updateTrackedJob(job, {
    status: 'running',
    message: message || 'Job running',
    startedAt: new Date(),
    attempts: job.attemptsMade,
  })
}

export async function markJobCompleted(job, message) {
  return updateTrackedJob(job, {
    status: 'completed',
    progress: 100,
    message: message || 'Job completed',
    completedAt: new Date(),
    attempts: job.attemptsMade,
    error: '',
  })
}

export async function markJobFailed(job, err) {
  const willRetry = job.attemptsMade < (job.opts.attempts || 1)
  return updateTrackedJob(job, {
    status: willRetry ? 'retrying' : 'failed',
    message: willRetry ? 'Job failed; retry scheduled' : 'Job failed',
    attempts: job.attemptsMade,
    error: err?.message || String(err),
  })
}
