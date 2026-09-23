<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const adminStore = useAdminStore()
const userStore = useUserStore()

const navItems = [
  { path: '/admin/dashboard', label: '仪表盘', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { path: '/admin/users', label: '用户管理', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { path: '/admin/notes', label: '笔记管理', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' }
]

const handleLogout = () => {
  adminStore.logout()
  userStore.logout()
  window.location.href = '/login'
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b border-[var(--paper-shadow)] bg-[rgba(253,251,247,0.95)] backdrop-blur-sm z-10">
      <div class="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
        <div class="flex items-baseline gap-3">
          <h1 class="page-title text-xl">纸间后台</h1>
          <span class="text-xs text-[var(--ink-muted)]">Admin</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm text-[var(--ink-light)]">{{ adminStore.adminInfo?.username || '管理员' }}</span>
          <button @click="handleLogout" class="text-sm text-[var(--warn)] hover:text-[var(--accent)] transition-colors">
            退出
          </button>
        </div>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden" style="height: calc(100vh - 57px)">
      <aside class="w-56 flex flex-col h-full bg-[rgba(253,251,247,0.85)] backdrop-blur-sm shadow-[1px_0_0_rgba(230,223,211,0.5)]">
        <nav class="p-4 space-y-1">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            :class="[
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              route.path === item.path || route.path.startsWith(item.path + '/')
                ? 'bg-[rgba(180,95,68,0.08)] text-[var(--accent-dark)] font-medium'
                : 'text-[var(--ink-light)] hover:bg-[var(--paper-deep)] hover:text-[var(--ink)]'
            ]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
            </svg>
            {{ item.label }}
          </router-link>
        </nav>
      </aside>

      <main class="flex-1 overflow-y-auto p-6 lg:p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>
