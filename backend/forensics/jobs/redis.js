import IORedis from 'ioredis'

let sharedConnection

export function getRedisConnection() {
  if (sharedConnection) return sharedConnection

  const url = process.env.REDIS_URL
  const options = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      return Math.min(times * 1000, 15000)
    },
  }

  sharedConnection = url
    ? new IORedis(url, options)
    : new IORedis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      ...options,
    })

  let lastLoggedError = 0
  sharedConnection.on('error', err => {
    const now = Date.now()
    if (now - lastLoggedError > 30000) {
      console.warn('⚠️  Redis warning:', err.message, '(background queue will reconnect when Redis is started)')
      lastLoggedError = now
    }
  })

  return sharedConnection
}
