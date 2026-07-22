const IORedis = require('ioredis')

/**
 * Shared IORedis connection for BullMQ queues and workers.
 * Requires maxRetriesPerRequest: null as per BullMQ specs.
 * Only connects if REDIS_URL is configured.
 */
let connection = null

if (process.env.REDIS_URL) {
  connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null
  })

  connection.on('error', (err) => {
    console.error('[Redis Queue Connection Error]:', err.message)
  })
}

module.exports = connection
