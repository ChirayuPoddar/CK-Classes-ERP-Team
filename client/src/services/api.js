import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Request Interceptor: Browser automatically attaches HttpOnly cookies (withCredentials: true)
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor with automatic queueing for access token rotation
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  async (error) => {
    const originalRequest = error.config

    // If request failed with 401 and hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we are currently checking for a session refresh on the auth routes, don't loop
      if (originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/login')) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Queue the request until token refresh resolves
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => {
            return api(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Trigger refresh request (browser sends HttpOnly refresh cookie)
        await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
        
        isRefreshing = false
        processQueue(null)
        
        // Retry the original request
        return api(originalRequest)
      } catch (refreshError) {
        isRefreshing = false
        processQueue(refreshError, null)
        
        // Wipe legacy token if present
        try { localStorage.removeItem('ck_token') } catch {}
        
        // Refresh token is expired too - wipe local auth and redirect
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth/login?session_expired=true'
        }
        
        return Promise.reject(refreshError)
      }
    }

    const errorMessage = 
      error.response?.data?.message || 
      error.response?.data?.error?.message || 
      error.response?.data?.error || 
      error.message || 
      'An unexpected error occurred'
    
    const customError = new Error(errorMessage)
    if (error.response?.data?.errors) {
      customError.errors = error.response.data.errors
    }
    return Promise.reject(customError)
  }
)

export default api
