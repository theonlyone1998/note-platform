import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, register as registerApi, getCurrentUser } from '@/api/user'
import type { LoginDto, RegisterDto, UserInfo } from '@shared/types'
import type { AuthPayload } from '@/api/user'

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref('')
    const userInfo = ref<UserInfo | null>(null)
    const isLoggedIn = computed(() => !!token.value)

    const setToken = (value: string) => {
      token.value = value
    }

    const setAuth = (payload: AuthPayload) => {
      token.value = payload.token
      userInfo.value = payload.user
    }

    const fetchUserInfo = async () => {
      const { data } = await getCurrentUser()
      userInfo.value = data.data
    }

    const initUser = async () => {
      if (!token.value) return
      try {
        await fetchUserInfo()
      } catch {
        logout()
      }
    }

    const login = async (form: LoginDto) => {
      const { data } = await loginApi(form)
      setAuth(data.data)
      return data.data
    }

    const register = async (form: RegisterDto) => {
      const { data } = await registerApi(form)
      setAuth(data.data)
      return data.data
    }

    const logout = () => {
      token.value = ''
      userInfo.value = null
    }

    return {
      token,
      userInfo,
      isLoggedIn,
      setToken,
      setAuth,
      fetchUserInfo,
      initUser,
      login,
      register,
      logout
    }
  },
  {
    persist: {
      paths: ['token', 'userInfo']
    }
  }
)
