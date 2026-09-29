# Evidence Job Pipeline

The server uses BullMQ with Redis for background evidence processing.

## Run Locally

Start Redis, then run the API and worker in separate terminals:

```bash
cd server
npm run dev
npm run worker:evidence
```

Required environment values:

```env
REDIS_URL=redis://127.0.0.1:6379
EVIDENCE_STORE_DIR=./evidence-store
WORKING_DIR=./tmp/processing
EVIDENCE_ENCRYPTION_KEY=generate_32_byte_base64_or_64_hex_key
```

## Job Flow

The upload API creates a MongoDB evidence record, queues a BullMQ job, and returns immediately. The worker then performs:

1. SHA-256 hashing of the original artifact.
2. AES-256-GCM encryption into secure evidence storage.
3. Removal of the temporary raw upload.
4. Controlled decrypt into a temporary working file.
5. File-type-specific parsing.
6. Matching normalization into the common event schema.
7. IOC enrichment, MITRE mapping, and risk scoring.
8. Storage of normalized events on the evidence record.

The API exposes job status through:

```text
GET /api/jobs
GET /api/jobs/:id
```

The original evidence is treated as immutable. Parsed events are derived data and can be regenerated.
