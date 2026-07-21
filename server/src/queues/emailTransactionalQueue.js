const { Queue } = require('bullmq')
const connection = require('./connection')

let emailTransactionalQueue = null

if (process.env.REDIS_URL && connection) {
  emailTransactionalQueue = new Queue('email-transactional', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: true,
      removeOnFail: false
    }
  })

  emailTransactionalQueue.on('error', (err) => {
    console.error('[emailTransactionalQueue Error]:', err.message)
  })
} else {
  // Fallback dummy stub when REDIS_URL is not set so BullMQ does not connect or keep event loop open
  emailTransactionalQueue = {
    add: async () => null,
    on: () => {}
  }
}

module.exports = emailTransactionalQueue
