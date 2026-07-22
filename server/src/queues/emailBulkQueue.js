const { Queue } = require('bullmq')
const connection = require('./connection')

let emailBulkQueue = null

if (process.env.REDIS_URL && connection) {
  emailBulkQueue = new Queue('email-bulk', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: true,
      removeOnFail: false
    }
  })

  emailBulkQueue.on('error', (err) => {
    console.error('[emailBulkQueue Error]:', err.message)
  })
} else {
  // Fallback dummy stub when REDIS_URL is not set so BullMQ does not connect or keep event loop open
  emailBulkQueue = {
    add: async () => null,
    on: () => {}
  }
}

module.exports = emailBulkQueue
