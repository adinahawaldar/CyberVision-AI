import { evidenceQueue, EVIDENCE_QUEUE_NAME } from './queues.js'
import { recordQueuedJob } from './processingJobTracker.js'

export async function enqueueEvidenceProcessing({ evidenceId, caseId, requestedBy, reason = 'upload' }) {
  const job = await evidenceQueue.add('process_evidence', {
    evidenceId: evidenceId.toString(),
    caseId: caseId.toString(),
    requestedBy: requestedBy?.toString(),
    reason,
  })

  await recordQueuedJob({
    job: { id: job.id, queueName: EVIDENCE_QUEUE_NAME },
    type: 'process_evidence',
    caseId,
    evidenceId,
    requestedBy,
    metadata: { reason },
  })

  return job
}
