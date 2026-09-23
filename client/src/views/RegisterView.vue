<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  email: '',
  username: '',
  password: ''
})

const isSubmitting = ref(false)
const errorMsg = ref('')

const onSubmit = async () => {
  errorMsg.value = ''
  isSubmitting.value = true
  try {
    await userStore.register(form)
    router.push('/')
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '注册失败，请重试'
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

        <div class="text-center mb-10">
          <h1 class="page-title text-4xl mb-2">纸间</h1>
          <p class="text-[var(--ink-muted)] text-sm tracking-widest uppercase">Create Account</p>
        </div>

        <form @submit.prevent="onSubmit" class="space-y-5">
          <div>
            <label class="paper-label">邮箱</label>
            <input v-model="form.email" type="email" required class="paper-input" placeholder="your@email.com" />
          </div>
          <div>
            <label class="paper-label">用户名</label>
            <input v-model="form.username" type="text" required class="paper-input" placeholder="你的称呼" />
          </div>
          <div>
            <label class="paper-label">密码</label>
            <input v-model="form.password" type="password" required class="paper-input" placeholder="至少6位字符" />
          </div>

          <p v-if="errorMsg" class="text-sm text-[var(--warn)]">{{ errorMsg }}</p>

          <button type="submit" :disabled="isSubmitting" class="paper-button w-full">
            {{ isSubmitting ? '注册中...' : '创建账号' }}
          </button>
        </form>

        <p class="mt-8 text-center text-sm text-[var(--ink-muted)]">
          已有账号？
          <RouterLink to="/login" class="text-[var(--accent)] hover:text-[var(--accent-dark)] underline underline-offset-4 transition-colors">
            去登录
          </RouterLink>
        </p>
      </div>

      <p class="text-center text-xs text-[var(--ink-muted)] mt-6 tracking-wide">
        一个人的笔记本，一间沉淋的书房
      </p>
    </div>
  </div>
</template>
