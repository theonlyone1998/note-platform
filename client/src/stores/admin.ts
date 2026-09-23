import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { adminLogin, getAdminCurrentUser } from '@/api/admin'
import type { LoginDto, UserInfo } from '@shared/types'

export const useAdminStore = defineStore(
  'admin',
  () => {
    const token = ref('')
    const adminInfo = ref<UserInfo | null>(null)
    const isLoggedIn = computed(() => !!token.value)
    const isAdmin = computed(() => adminInfo.value?.role === 'admin')

    const setAuth = (payload: { token: string; user: UserInfo }) => {
      token.value = payload.token
      adminInfo.value = payload.user
    }

    const login = async (form: LoginDto) => {
      const { data } = await adminLogin(form)
      setAuth(data.data)
      return data.data
    }

    const fetchAdminInfo = async () => {
      const { data } = await getAdminCurrentUser()
      adminInfo.value = data.data
    }

    const initAdmin = async () => {
      if (!token.value) return
      try {
        await fetchAdminInfo()
      } catch {
        logout()
      }
    }

    const logout = () => {
      token.value = ''
      adminInfo.value = null
    }

    return {
      token,
      adminInfo,
      isLoggedIn,
      isAdmin,
      setAuth,
      fetchAdminInfo,
      initAdmin,
      login,
      logout
    }
  },
  {
    persist: {
      paths: ['token', 'adminInfo']
    }
  }
)
