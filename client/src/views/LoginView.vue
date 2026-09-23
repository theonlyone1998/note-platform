<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useAdminStore } from '@/stores/admin'

type LoginMode = 'front' | 'admin'

const router = useRouter()
const userStore = useUserStore()
const adminStore = useAdminStore()

const mode = ref<LoginMode>('front')
const form = reactive({
  email: 'test@example.com',
  password: '123456'
})

const isSubmitting = ref(false)
const errorMsg = ref('')

const FRONT_CREDENTIALS = { email: 'test@example.com', password: '123456' }
const ADMIN_CREDENTIALS = { email: 'admin@zhijian.local', password: '123456' }

watch(mode, (newMode) => {
  const creds = newMode === 'front' ? FRONT_CREDENTIALS : ADMIN_CREDENTIALS
  form.email = creds.email
  form.password = creds.password
  errorMsg.value = ''
}, { immediate: false })

const onSubmit = async () => {
  errorMsg.value = ''
  isSubmitting.value = true
  try {
    if (mode.value === 'admin') {
      const auth = await adminStore.login(form)
      if (auth.user.role !== 'admin') {
        errorMsg.value = '该账号没有管理员权限'
        return
      }
      router.push('/admin/dashboard')
    } else {
      const auth = await userStore.login(form)
      if (auth.user.role === 'admin') {
        adminStore.setAuth(auth)
      }
      router.push('/')
    }
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '登录失败，请重试'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6">
    <div class="w-full max-w-md">
      <div class="paper-card p-10 relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--paper-shadow)] via-[var(--accent)] to-[var(--paper-shadow)] opacity-70" />

        <div class="text-center mb-8">
          <h1 class="page-title text-4xl mb-2">纸间</h1>
          <p class="text-[var(--ink-muted)] text-sm tracking-widest uppercase">ZhiJian Notes</p>
        </div>

        <div class="flex rounded-lg bg-[var(--paper-deep)] p-1 mb-8">
          <button
            type="button"
            class="flex-1 py-1.5 text-sm rounded-md transition-colors"
            :class="mode === 'front' ? 'bg-[var(--paper)] text-[var(--ink)] shadow-sm' : 'text-[var(--ink-muted)]'"
            @click="mode = 'front'"
          >
            前台登录
          </button>
          <button
            type="button"
            class="flex-1 py-1.5 text-sm rounded-md transition-colors"
            :class="mode === 'admin' ? 'bg-[var(--paper)] text-[var(--ink)] shadow-sm' : 'text-[var(--ink-muted)]'"
            @click="mode = 'admin'"
          >
            后台登录
          </button>
        </div>

        <form @submit.prevent="onSubmit" class="space-y-6">
          <div>
            <label class="paper-label">邮箱</label>
            <input v-model="form.email" type="email" required class="paper-input" :placeholder="mode === 'front' ? 'test@example.com' : 'admin@zhijian.local'" />
          </div>
          <div>
            <label class="paper-label">密码</label>
            <input v-model="form.password" type="password" required class="paper-input" placeholder="输入密码" />
          </div>

          <p v-if="errorMsg" class="text-sm text-[var(--warn)]">{{ errorMsg }}</p>

          <button type="submit" :disabled="isSubmitting" class="paper-button w-full">
            {{ isSubmitting ? '登录中...' : mode === 'front' ? '进入书房' : '进入后台' }}
          </button>
        </form>

        <p class="mt-8 text-center text-sm text-[var(--ink-muted)]">
          还没有账号？
          <RouterLink to="/register" class="text-[var(--accent)] hover:text-[var(--accent-dark)] underline underline-offset-4 transition-colors">
            去注册
          </RouterLink>
        </p>
      </div>

      <p class="text-center text-xs text-[var(--ink-muted)] mt-6 tracking-wide">
        写下你的思绪，像纸一样温柔
      </p>
    </div>
  </div>
</template>
