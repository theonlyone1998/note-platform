<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  deleteAdminUser,
  getAdminUsers,
  resetAdminUserPassword,
  updateAdminUserStatus
} from '@/api/admin'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { AdminUser } from '@shared/types'

const users = ref<AdminUser[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')
const isLoading = ref(false)
const errorMsg = ref('')

const dialogVisible = ref(false)
const dialogTitle = ref('确认操作')
const dialogMessage = ref('')
const dialogDanger = ref(false)
const pendingAction = ref<(() => void) | null>(null)

const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

const loadUsers = async () => {
  isLoading.value = true
  errorMsg.value = ''
  try {
    const { data } = await getAdminUsers({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined
    })
    users.value = data.data.items
    total.value = data.data.total
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  loadUsers()
}

const handlePageChange = (newPage: number) => {
  page.value = newPage
  loadUsers()
}

const toggleStatus = async (user: AdminUser) => {
  try {
    await updateAdminUserStatus(user.id, !user.isActive)
    await loadUsers()
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '操作失败'
  }
}

const openDialog = (options: {
  title?: string
  message: string
  danger?: boolean
  onConfirm: () => void
}) => {
  dialogTitle.value = options.title || '确认操作'
  dialogMessage.value = options.message
  dialogDanger.value = options.danger || false
  pendingAction.value = options.onConfirm
  dialogVisible.value = true
}

const handleDialogConfirm = () => {
  pendingAction.value?.()
  pendingAction.value = null
}

const handleResetPassword = (user: AdminUser) => {
  openDialog({
    title: '重置密码',
    message: `确定重置用户「${user.username}」的密码为 123456 吗？`,
    onConfirm: async () => {
      try {
        await resetAdminUserPassword(user.id)
        alert('密码已重置为 123456')
      } catch (err) {
        errorMsg.value = err instanceof Error ? err.message : '重置失败'
      }
    }
  })
}

const handleDelete = (user: AdminUser) => {
  openDialog({
    title: '删除用户',
    message: `确定删除用户「${user.username}」吗？该用户的所有笔记、笔记本、标签将被一并删除。`,
    danger: true,
    onConfirm: async () => {
      try {
        await deleteAdminUser(user.id)
        await loadUsers()
      } catch (err) {
        errorMsg.value = err instanceof Error ? err.message : '删除失败'
      }
    }
  })
}

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString()
}

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <h2 class="section-title text-2xl">用户管理</h2>
      <div class="flex items-center gap-2">
        <input
          v-model="keyword"
          @keyup.enter="handleSearch"
          type="text"
          placeholder="搜索用户名或邮箱"
          autocomplete="off"
          class="paper-input text-sm w-64"
        />
        <button @click="handleSearch" class="paper-button">搜索</button>
      </div>
    </div>

    <p v-if="errorMsg" class="text-sm text-[var(--warn)] mb-4">{{ errorMsg }}</p>
    <div v-if="isLoading" class="text-center text-[var(--ink-muted)] py-12">加载中...</div>

    <div v-else class="paper-card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-[var(--paper-deep)] text-[var(--ink-light)]">
          <tr>
            <th class="text-left px-4 py-3 font-medium">ID</th>
            <th class="text-left px-4 py-3 font-medium">用户名</th>
            <th class="text-left px-4 py-3 font-medium">邮箱</th>
            <th class="text-left px-4 py-3 font-medium">角色</th>
            <th class="text-left px-4 py-3 font-medium">状态</th>
            <th class="text-left px-4 py-3 font-medium">笔记数</th>
            <th class="text-left px-4 py-3 font-medium">注册时间</th>
            <th class="text-left px-4 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--paper-shadow)]">
          <tr v-for="user in users" :key="user.id" class="hover:bg-[var(--paper-deep)]/50">
            <td class="px-4 py-3">{{ user.id }}</td>
            <td class="px-4 py-3">{{ user.username }}</td>
            <td class="px-4 py-3 text-[var(--ink-muted)]">{{ user.email }}</td>
            <td class="px-4 py-3">
              <span
                class="text-[11px] px-2 py-0.5 rounded-full"
                :class="user.role === 'admin' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--paper-deep)] text-[var(--ink-light)]'"
              >
                {{ user.role === 'admin' ? '管理员' : '用户' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                class="text-[11px] px-2 py-0.5 rounded-full"
                :class="user.isActive ? 'bg-green-100 text-green-700' : 'bg-[var(--warn-bg)] text-[var(--warn)]'"
              >
                {{ user.isActive ? '正常' : '禁用' }}
              </span>
            </td>
            <td class="px-4 py-3">{{ user._count?.notes ?? 0 }}</td>
            <td class="px-4 py-3 text-[var(--ink-muted)]">{{ formatDate(user.createdAt) }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <button
                  v-if="user.role !== 'admin'"
                  @click="toggleStatus(user)"
                  class="text-xs px-2 py-1 rounded border border-[var(--paper-shadow)] hover:border-[var(--accent-light)] hover:text-[var(--accent-dark)] transition-colors"
                >
                  {{ user.isActive ? '禁用' : '启用' }}
                </button>
                <button
                  v-if="user.role !== 'admin'"
                  @click="handleResetPassword(user)"
                  class="text-xs px-2 py-1 rounded border border-[var(--paper-shadow)] hover:border-[var(--accent-light)] hover:text-[var(--accent-dark)] transition-colors"
                >
                  重置密码
                </button>
                <button
                  v-if="user.role !== 'admin'"
                  @click="handleDelete(user)"
                  class="text-xs px-2 py-1 rounded border border-[var(--warn)]/25 text-[var(--warn)] hover:bg-[var(--warn-bg)] transition-colors"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="users.length === 0" class="text-center text-[var(--ink-muted)] py-12">
        暂无用户
      </div>

      <div class="flex items-center justify-between px-4 py-3 border-t border-[var(--paper-shadow)]">
        <span class="text-xs text-[var(--ink-muted)]">
          共 {{ total }} 条，第 {{ page }} / {{ totalPages }} 页
        </span>
        <div class="flex items-center gap-2">
          <button
            :disabled="page <= 1"
            @click="handlePageChange(page - 1)"
            class="text-xs px-3 py-1.5 rounded border border-[var(--paper-shadow)] disabled:opacity-40 hover:border-[var(--accent-light)] transition-colors"
          >
            上一页
          </button>
          <button
            :disabled="page >= totalPages"
            @click="handlePageChange(page + 1)"
            class="text-xs px-3 py-1.5 rounded border border-[var(--paper-shadow)] disabled:opacity-40 hover:border-[var(--accent-light)] transition-colors"
          >
            下一页
          </button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      v-model:visible="dialogVisible"
      :title="dialogTitle"
      :message="dialogMessage"
      :danger="dialogDanger"
      @confirm="handleDialogConfirm"
    />
  </div>
</template>
