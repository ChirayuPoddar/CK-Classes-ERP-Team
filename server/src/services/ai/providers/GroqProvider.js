const BaseAIProvider = require('./BaseAIProvider')
const ApiError = require('../../../utils/ApiError')

class GroqProvider extends BaseAIProvider {
  constructor() {
    super()
    this.apiKey = process.env.GROQ_API_KEY
    this.modelName = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
  }

  async generateResponse(prompt, systemContext = '', options = {}) {
    if (!this.apiKey) {
      throw new ApiError('Groq API key is not configured on the server.', 500, 'AI_CONFIG_ERROR')
    }

    const messages = []

    if (systemContext && systemContext.trim()) {
      messages.push({
        role: 'system',
        content: systemContext.trim()
      })
    }

    messages.push({
      role: 'user',
      content: prompt
    })

    const requestBody = {
      model: this.modelName,
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4096
    }

    try {
      let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      let data = await response.json()

      // Automatic fallback to high-quota llama-3.1-8b-instant if 70b hits daily TPD limit (HTTP 429)
      if (response.status === 429 && requestBody.model !== 'llama-3.1-8b-instant') {
        console.log('Groq 70b rate limit hit (429). Retrying automatically with llama-3.1-8b-instant...')
        requestBody.model = 'llama-3.1-8b-instant'
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })
        data = await response.json()
      }

      if (!response.ok) {
        const errorMsg = data?.error?.message || 'Failed to generate response from Groq API.'
        throw new ApiError(`Groq API Error (${response.status}): ${errorMsg}`, response.status || 500, 'AI_PROVIDER_ERROR')
      }

      const textResponse = data?.choices?.[0]?.message?.content

      if (!textResponse) {
        throw new ApiError('Received empty content from Groq API response.', 500, 'AI_PROVIDER_INVALID_RESPONSE')
      }

      return textResponse
    } catch (err) {
      if (err instanceof ApiError) throw err
      throw new ApiError(`Failed to connect to Groq AI Service: ${err.message}`, 500, 'AI_CONNECTION_ERROR')
    }
  }
}

module.exports = GroqProvider
