import api from './api'

/**
 * AI Integration Service for Frontend
 */
export const queryAI = async (prompt) => {
  const response = await api.post('/ai/query', { prompt })
  return response.data?.data || response.data
}

export const generateQuiz = async (params) => {
  const response = await api.post('/ai/generate-quiz', params)
  return response.data?.data || response.data
}

export const getAIStatus = async () => {
  const response = await api.get('/ai/status')
  return response.data?.data || response.data
}

export default {
  queryAI,
  generateQuiz,
  getAIStatus
}
