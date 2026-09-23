<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getAdminNotes, getAdminUsers, hardDeleteAdminNote } from '@/api/admin'
import AppSelect from '@/components/AppSelect.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { AdminNote, AdminUser } from '@shared/types'

const notes = ref<AdminNote[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')
const selectedUserId = ref<number | null>(null)
const showTrash = ref(false)
const isLoading = ref(false)
const errorMsg = ref('')
const users = ref<AdminUser[]>([])

const userOptions = computed(() => [
  { value: null, label: '全部用户' },
  ...users.value.map((user) => ({ value: user.id, label: user.username }))
])

const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

const loadNotes = async () => {
  isLoading.value = true
  errorMsg.value = ''
  try {
    const { data } = await getAdminNotes({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      userId: selectedUserId.value ?? undefined,
      isDeleted: showTrash.value
    })
    notes.value = data.data.items
    total.value = data.data.total
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    isLoading.value = false
  }
}

const loadUsers = async () => {
  try {
    const { data } = await getAdminUsers({ pageSize: 100 })
    users.value = data.data.items.filter((u) => u.role !== 'admin')
  } catch (err) {
    console.error('加载用户列表失败', err)
  }
}

const handleSearch = () => {
  page.value = 1
  loadNotes()
}

const handlePageChange = (newPage: number) => {
  page.value = newPage
  loadNotes()
}

const dialogVisible = ref(false)
const dialogTitle = ref('确认操作')
const dialogMessage = ref('')
const pendingAction = ref<(() => void) | null>(null)

const openDialog = (options: {
  title?: string
  message: string
  onConfirm: () => void
}) => {
  dialogTitle.value = options.title || '确认操作'
  dialogMessage.value = options.message
  pendingAction.value = options.onConfirm
  dialogVisible.value = true
}

const handleDialogConfirm = () => {
  pendingAction.value?.()
  pendingAction.value = null
}

const handleHardDelete = (note: AdminNote) => {
  openDialog({
    title: '彻底删除笔记',
    message: `确定彻底删除笔记「${note.title || '无标题'}」吗？此操作不可恢复。`,
    onConfirm: async () => {
      try {
        await hardDeleteAdminNote(note.id)
        await loadNotes()
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
  loadNotes()
})
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <h2 class="section-title text-2xl">笔记管理</h2>
      <div class="flex flex-wrap items-center gap-2">
        <AppSelect v-model="selectedUserId" :options="userOptions" placeholder="全部用户" class="w-40" @update:modelValue="handleSearch" />
        <label class="flex items-center gap-2 text-sm text-[var(--ink-light)] cursor-pointer">
          <input v-model="showTrash" @change="handleSearch" type="checkbox" class="rounded border-[var(--paper-shadow)] text-[var(--accent)] focus:ring-[var(--accent)]" />
          仅看回收站
        </label>
        <input
          v-model="keyword"
          @keyup.enter="handleSearch"
          type="text"
          placeholder="搜索标题或内容"
          autocomplete="off"
          class="paper-input text-sm w-56"
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
            <th class="text-left px-4 py-3 font-medium">标题</th>
            <th class="text-left px-4 py-3 font-medium">作者</th>
            <th class="text-left px-4 py-3 font-medium">笔记本</th>
            <th class="text-left px-4 py-3 font-medium">状态</th>
            <th class="text-left px-4 py-3 font-medium">更新时间</th>
            <th class="text-left px-4 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--paper-shadow)]">
          <tr v-for="note in notes" :key="note.id" class="hover:bg-[var(--paper-deep)]/50">
            <td class="px-4 py-3">{{ note.id }}</td>
            <td class="px-4 py-3">
              <div class="max-w-xs truncate" :title="note.title || '无标题'">
                {{ note.title || '无标题' }}
              </div>
            </td>
            <td class="px-4 py-3 text-[var(--ink-muted)]">{{ note.user?.username || '未知用户' }}</td>
            <td class="px-4 py-3 text-[var(--ink-muted)]">{{ note.notebook?.name || '-' }}</td>
            <td class="px-4 py-3">
              <span
                class="text-[11px] px-2 py-0.5 rounded-full"
                :class="note.isDeleted ? 'bg-[var(--warn-bg)] text-[var(--warn)]' : 'bg-green-100 text-green-700'"
              >
                {{ note.isDeleted ? '回收站' : '正常' }}
              </span>
            </td>
            <td class="px-4 py-3 text-[var(--ink-muted)]">{{ formatDate(note.updatedAt) }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <button
                  @click="handleHardDelete(note)"
                  class="text-xs px-2 py-1 rounded border border-[var(--warn)]/25 text-[var(--warn)] hover:bg-[var(--warn-bg)] transition-colors"
                >
                  彻底删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="notes.length === 0" class="text-center text-[var(--ink-muted)] py-12">
        暂无笔记
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
      danger
      @confirm="handleDialogConfirm"
    />
  </div>
</template>
