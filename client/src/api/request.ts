/// <reference types="vite/client" />
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useUserStore } from '@/stores/user'
import { useAdminStore } from '@/stores/admin'

// 统一返回体类型
export interface ApiResponse<T = unknown> {
  code: number
  data: T
  msg: string
}

let isRedirectingToLogin = false

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const userStore = useUserStore()
  const adminStore = useAdminStore()
  const token = adminStore.token || userStore.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse
    if (res.code !== 200) {
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
    return response
  },
  (error: AxiosError<ApiResponse>) => {
    const status = error.response?.status
    const msg = error.response?.data?.msg || error.message || '网络错误'
    if (status === 401 && !isRedirectingToLogin) {
      isRedirectingToLogin = true
      const userStore = useUserStore()
      const adminStore = useAdminStore()
      const isAdminPath = window.location.pathname.startsWith('/admin')
      if (isAdminPath) {
        adminStore.logout()
        window.location.href = '/login'
      } else {
        userStore.logout()
        window.location.href = '/login'
      }
      setTimeout(() => {
        isRedirectingToLogin = false
      }, 500)
    }
    return Promise.reject(new Error(msg))
  }
)

export default request
