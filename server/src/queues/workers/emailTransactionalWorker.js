const { Worker } = require('bullmq')
const connection = require('../connection')
const emailService = require('../../services/emailService')

let emailTransactionalWorker = null

if (process.env.REDIS_URL && connection) {
  emailTransactionalWorker = new Worker(
    'email-transactional',
    async (job) => {
      if (job.data.otp && job.data.purpose) {
        return await emailService.sendOtpEmail(job.data)
      }
      return await emailService.sendEmail(job.data)
    },
    {
      connection,
      concurrency: 10
    }
  )

  emailTransactionalWorker.on('failed', (job, err) => {
    console.error(`[emailTransactionalWorker Failed] Job ID: ${job?.id}, Error: ${err.message}`)
  })

  emailTransactionalWorker.on('error', (err) => {
    console.error('[emailTransactionalWorker System Error]:', err.message)
  })
}

module.exports = emailTransactionalWorker
