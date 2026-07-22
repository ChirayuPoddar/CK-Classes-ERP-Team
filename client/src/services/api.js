import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api/v1'

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

// Request Interceptor: Attach Bearer token from localStorage or let browser attach HttpOnly cookies
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('ck_access_token') || localStorage.getItem('ck_token')
      if (token && !config.headers.Authorization && !config.headers.authorization) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch {}

    // Ensure FormData requests automatically generate boundary headers
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
      delete config.headers['content-type']
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

const formatApiError = (error) => {
  if (error instanceof Error && error.statusCode) {
    return error
  }
  const errorMessage = 
    error.response?.data?.message || 
    error.response?.data?.error?.message || 
    (typeof error.response?.data?.error === 'string' ? error.response.data.error : null) || 
    error.message || 
    'An unexpected error occurred'
  
  const customError = new Error(errorMessage)
  customError.code = error.response?.data?.code || error.response?.data?.error?.code || error.code
  customError.status = error.response?.status
  customError.statusCode = error.response?.status
  customError.response = error.response
  customError.data = error.response?.data
  if (error.response?.data?.errors) {
    customError.errors = error.response.data.errors
  }
  return customError
}

// Response Interceptor with automatic queueing for access token rotation
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  async (error) => {
    const originalRequest = error.config

    // If request failed with 401 and hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we are currently checking for a session refresh or on public auth check without refresh tokens, don't loop
      const storedRefreshToken = typeof localStorage !== 'undefined' ? localStorage.getItem('ck_refresh_token') : null
      if (originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/login') || (originalRequest.url.includes('/auth/me') && !storedRefreshToken)) {
        return Promise.reject(formatApiError(error))
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
            return Promise.reject(formatApiError(err))
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const storedRefreshToken = typeof localStorage !== 'undefined' ? localStorage.getItem('ck_refresh_token') : null
        const refreshData = await axios.post(
          `${API_URL}/auth/refresh`,
          storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
          {
            withCredentials: true,
            headers: storedRefreshToken ? { Authorization: `Bearer ${storedRefreshToken}` } : {}
          }
        )

        const resBody = refreshData?.data || {}
        if (resBody.accessToken && typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('ck_access_token', resBody.accessToken)
            if (resBody.refreshToken) localStorage.setItem('ck_refresh_token', resBody.refreshToken)
          } catch {}
        }

        isRefreshing = false
        processQueue(null)

        return api(originalRequest)
      } catch (refreshError) {
        isRefreshing = false
        processQueue(formatApiError(refreshError), null)

        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('ck_token')
            localStorage.removeItem('ck_access_token')
            localStorage.removeItem('ck_refresh_token')
          }
        } catch {}

        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth') && !originalRequest?.url?.includes('/auth/me')) {
          window.location.href = '/auth/login?session_expired=true'
        }

        return Promise.reject(formatApiError(refreshError))
      }
    }

    return Promise.reject(formatApiError(error))
  }
)

// Persistent GET Request Caching with 15-minute TTL, sessionStorage sync, and Stale-While-Revalidate (SWR)
const originalGet = api.get.bind(api)
const originalPost = api.post.bind(api)
const originalPut = api.put.bind(api)
const originalPatch = api.patch.bind(api)
const originalDelete = api.delete.bind(api)

const CACHE_KEY_STORAGE = 'ck_api_cache_v2'
const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

// Initialize cache from sessionStorage if available
const apiCache = new Map()
try {
  if (typeof sessionStorage !== 'undefined') {
    const stored = sessionStorage.getItem(CACHE_KEY_STORAGE)
    if (stored) {
      const parsed = JSON.parse(stored)
      Object.entries(parsed).forEach(([key, value]) => {
        apiCache.set(key, value)
      })
    }
  }
} catch {}

const saveCacheToStorage = () => {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const obj = {}
      apiCache.forEach((value, key) => {
        obj[key] = value
      })
      sessionStorage.setItem(CACHE_KEY_STORAGE, JSON.stringify(obj))
    }
  } catch {}
}

api.clearCache = () => {
  apiCache.clear()
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(CACHE_KEY_STORAGE)
    }
  } catch {}
}

api.get = async (url, config = {}) => {
  if (config.skipCache || url.includes('/auth/') || url.includes('/activation/')) {
    return originalGet(url, config)
  }

  let cacheKey = url
  if (config.params) {
    try {
      cacheKey += '?' + JSON.stringify(config.params)
    } catch {}
  }

  const cached = apiCache.get(cacheKey)
  if (cached) {
    const isFresh = Date.now() - cached.timestamp < CACHE_TTL
    if (isFresh) {
      return cached.data
    } else {
      // Stale-While-Revalidate (SWR): Return cached data immediately (0ms) so zero spinner appears,
      // and refresh cache silently in the background!
      originalGet(url, config).then((res) => {
        if (res && (res.success || Array.isArray(res) || res.data)) {
          apiCache.set(cacheKey, { timestamp: Date.now(), data: res })
          saveCacheToStorage()
        }
      }).catch(() => {})
      return cached.data
    }
  }

  const res = await originalGet(url, config)
  if (res && (res.success || Array.isArray(res) || res.data)) {
    apiCache.set(cacheKey, { timestamp: Date.now(), data: res })
    saveCacheToStorage()
  }
  return res
}

api.post = async (url, data, config) => {
  if (!url.includes('/auth/')) api.clearCache()
  return originalPost(url, data, config)
}

api.put = async (url, data, config) => {
  if (!url.includes('/auth/')) api.clearCache()
  return originalPut(url, data, config)
}

api.patch = async (url, data, config) => {
  if (!url.includes('/auth/')) api.clearCache()
  return originalPatch(url, data, config)
}

api.delete = async (url, config) => {
  if (!url.includes('/auth/')) api.clearCache()
  return originalDelete(url, config)
}

export default api
