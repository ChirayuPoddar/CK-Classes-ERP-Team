const BaseAIProvider = require('./BaseAIProvider')
const ApiError = require('../../../utils/ApiError')

class GroqProvider extends BaseAIProvider {
  constructor() {
    super()
    this.apiKey = process.env.GROQ_API_KEY
    this.modelName = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
    // Fallback chain models to multiply total quota limits by 16x
    this.modelChain = [
      this.modelName,
      'llama-3.1-8b-instant',
      'gemma2-9b-it'
    ]
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

    // Try models sequentially on rate limit (429) errors
    for (let i = 0; i < this.modelChain.length; i++) {
      requestBody.model = this.modelChain[i]
      
      try {
        console.log(`[Groq AI] Requesting response using model: ${requestBody.model}`)
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })

        const data = await response.json()

        if (response.status === 429) {
          console.warn(`[Groq AI] Model ${requestBody.model} rate limited (429). Trying next fallback...`)
          continue
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
        // If it's a rate limit retry, continue. Else throw.
        if (err instanceof ApiError && err.statusCode === 429) {
          continue
        }
        throw err
      }
    }

    throw new ApiError('All Groq fallback models exhausted due to rate limits.', 429, 'AI_PROVIDER_RATE_LIMIT')
  }
}

module.exports = GroqProvider
