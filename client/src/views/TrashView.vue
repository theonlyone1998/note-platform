<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { emptyTrash, getTrashNotes, permanentDeleteNote, restoreNote } from '@/api/note'
import { createNotebook, deleteNotebook, getNotebooks, updateNotebook } from '@/api/notebook'
import { createTag, deleteTag, getTags, updateTag } from '@/api/tag'
import NotebookSidebar from '@/components/NotebookSidebar.vue'
import MarkdownPreview from '@/components/MarkdownPreview.vue'
import type { Notebook, Note, Tag } from '@shared/types'

const router = useRouter()
const userStore = useUserStore()

const notes = ref<Note[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const notebooks = ref<Notebook[]>([])
const tags = ref<Tag[]>([])
const isLoading = ref(false)
const errorMsg = ref('')
const keyword = ref('')

const activeView = computed<'trash'>(() => 'trash')
const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

const loadNotes = async () => {
  isLoading.value = true
  errorMsg.value = ''
  try {
    const { data } = await getTrashNotes({
      page: page.value,
      pageSize: pageSize.value,
      search: keyword.value || undefined
    })
    notes.value = data.data.items
    total.value = data.data.total
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '加载回收站失败'
  } finally {
    isLoading.value = false
  }
}

const loadMeta = async () => {
  try {
    const [nbRes, tagRes] = await Promise.all([getNotebooks(), getTags()])
    notebooks.value = nbRes.data.data
    tags.value = tagRes.data.data
  } catch (err) {
    console.error('加载笔记本/标签失败', err)
  }
}

const handleRestore = async (id: number) => {
  try {
    await restoreNote(id)
    await loadNotes()
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '恢复失败'
  }
}

const handlePermanentDelete = async (id: number) => {
  if (!confirm('彻底删除后无法恢复，确定继续吗？')) return
  try {
    await permanentDeleteNote(id)
    await loadNotes()
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '删除失败'
  }
}

const handleEmptyTrash = async () => {
  if (!confirm('清空回收站将彻底删除所有笔记，确定继续吗？')) return
  try {
    await emptyTrash()
    await loadNotes()
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '清空失败'
  }
}

const handleCreateNotebook = async (name: string) => {
  try {
    await createNotebook(name)
    await loadMeta()
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '创建笔记本失败'
  }
}

const handleCreateTag = async (name: string) => {
  try {
    await createTag(name)
    await loadMeta()
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '创建标签失败'
  }
}

const handleUpdateNotebook = async (id: number, name: string) => {
  try {
    await updateNotebook(id, name)
    await loadMeta()
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '更新笔记本失败'
  }
}

const handleDeleteNotebook = async (id: number) => {
  try {
    await deleteNotebook(id)
    await loadMeta()
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '删除笔记本失败'
  }
}

const handleUpdateTag = async (id: number, name: string) => {
  try {
    await updateTag(id, { name })
    await loadMeta()
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '更新标签失败'
  }
}

const handleDeleteTag = async (id: number) => {
  try {
    await deleteTag(id)
    await loadMeta()
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '删除标签失败'
  }
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

const handlePageChange = (newPage: number) => {
  page.value = newPage
  loadNotes()
}

watch(keyword, () => {
  page.value = 1
  loadNotes()
})

onMounted(() => {
  loadNotes()
  loadMeta()
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b border-[var(--paper-shadow)] bg-[rgba(253,251,247,0.9)] backdrop-blur-sm z-10">
      <div class="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <div class="flex items-baseline gap-3">
          <h1 class="page-title text-2xl">纸间</h1>
          <span class="text-xs text-[var(--ink-muted)] tracking-widest uppercase hidden sm:inline">ZhiJian</span>
        </div>
        <div class="flex items-center gap-5">
          <span class="text-sm text-[var(--ink-light)]">欢迎，{{ userStore.userInfo?.username || '读者' }}</span>
          <button @click="handleLogout" class="text-sm text-[var(--ink-muted)] hover:text-[var(--warn)] transition-colors">
            退出
          </button>
        </div>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden" style="height: calc(100vh - 64px)">
      <NotebookSidebar
        :notebooks="notebooks"
        :tags="tags"
        :active-view="activeView"
        :keyword="keyword"
        @update:keyword="(val) => { keyword = val }"
        @create-notebook="handleCreateNotebook"
        @update-notebook="handleUpdateNotebook"
        @delete-notebook="handleDeleteNotebook"
        @create-tag="handleCreateTag"
        @update-tag="handleUpdateTag"
        @delete-tag="handleDeleteTag"
        @refresh="loadNotes"
      />

      <main class="flex-1 overflow-y-auto p-6 lg:p-8">
        <div class="mb-8 flex justify-between items-center">
          <div>
            <h2 class="section-title text-2xl text-[var(--warn)]">回收站</h2>
            <p class="text-sm text-[var(--ink-muted)] mt-1">
              {{ total }}篇已删除的笔记
            </p>
          </div>
          <button
            v-if="notes.length > 0"
            @click="handleEmptyTrash"
            class="paper-button-danger"
          >
            清空回收站
          </button>
        </div>

        <p v-if="errorMsg" class="text-sm text-[var(--warn)] mb-4">{{ errorMsg }}</p>

        <div v-if="isLoading" class="text-center text-[var(--ink-muted)] py-12">加载中...</div>

        <div v-else class="space-y-4">
          <article
            v-for="note in notes"
            :key="note.id"
            class="paper-card p-5 border-l-4 border-[var(--warn)] opacity-90"
          >
            <div class="flex justify-between items-start gap-4">
              <div class="flex-1 min-w-0">
                <h3 class="section-title text-lg line-through text-[var(--ink-muted)] mb-1 truncate">{{ note.title || '无标题' }}</h3>
                <div class="text-[var(--ink-muted)] text-sm line-clamp-2 markdown-preview-inline">
                  <MarkdownPreview :content="note.content" />
                </div>
                <p class="text-[11px] text-[var(--ink-muted)] mt-3">
                  删除于 {{ new Date(note.deletedAt || note.updatedAt).toLocaleString() }}
                </p>
              </div>
              <div class="flex flex-col gap-2">
                <button
                  @click="handleRestore(note.id)"
                  class="paper-button-secondary text-xs px-3 py-1.5"
                >
                  恢复
                </button>
                <button
                  @click="handlePermanentDelete(note.id)"
                  class="paper-button-danger text-xs px-3 py-1.5"
                >
                  彻底删除
                </button>
              </div>
            </div>
          </article>

          <div v-if="notes.length === 0" class="text-center py-16">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--paper-deep)] flex items-center justify-center text-[var(--ink-muted)]">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <p class="text-[var(--ink-muted)]">
              回收站是空的
            </p>
          </div>

          <div v-if="totalPages > 1" class="flex items-center justify-between pt-4 border-t border-[var(--paper-shadow)]">
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
      </main>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.markdown-preview-inline {
  max-height: 3em;
  overflow: hidden;
}
</style>
