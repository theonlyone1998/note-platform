<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getAdminDashboardStats } from '@/api/admin'
import type { AdminDashboardStats } from '@shared/types'

const stats = ref<AdminDashboardStats | null>(null)
const isLoading = ref(false)
const errorMsg = ref('')

const loadStats = async () => {
  isLoading.value = true
  errorMsg.value = ''
  try {
    const { data } = await getAdminDashboardStats()
    stats.value = data.data
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

<template>
  <div>
    <h2 class="section-title text-2xl mb-6">仪表盘</h2>

    <p v-if="errorMsg" class="text-sm text-[var(--warn)] mb-4">{{ errorMsg }}</p>
    <div v-if="isLoading" class="text-center text-[var(--ink-muted)] py-12">加载中...</div>

    <div v-else-if="stats" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="paper-card p-5">
        <p class="text-xs text-[var(--ink-muted)] uppercase tracking-wider">总用户数</p>
        <p class="text-3xl font-semibold text-[var(--accent-dark)] mt-2">{{ stats.totalUsers }}</p>
      </div>
      <div class="paper-card p-5">
        <p class="text-xs text-[var(--ink-muted)] uppercase tracking-wider">总笔记数</p>
        <p class="text-3xl font-semibold text-[var(--accent-dark)] mt-2">{{ stats.totalNotes }}</p>
      </div>
      <div class="paper-card p-5">
        <p class="text-xs text-[var(--ink-muted)] uppercase tracking-wider">草稿数</p>
        <p class="text-3xl font-semibold text-[var(--accent-dark)] mt-2">{{ stats.totalDrafts }}</p>
      </div>
      <div class="paper-card p-5">
        <p class="text-xs text-[var(--ink-muted)] uppercase tracking-wider">回收站</p>
        <p class="text-3xl font-semibold text-[var(--warn)] mt-2">{{ stats.totalTrash }}</p>
      </div>
    </div>
  </div>
</template>
