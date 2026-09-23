<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { deleteNote, getNotes } from '@/api/note'
import { createNotebook, deleteNotebook, getNotebooks, updateNotebook } from '@/api/notebook'
import { createTag, deleteTag, getTags, updateTag } from '@/api/tag'
import NotebookSidebar from '@/components/NotebookSidebar.vue'
import MarkdownPreview from '@/components/MarkdownPreview.vue'
import type { Note, Notebook, Tag } from '@shared/types'

const router = useRouter()
const route = useRoute()
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

const activeNotebookId = computed<number | null>(() => {
  const id = route.params.notebookId
  if (id === undefined) return undefined as unknown as null
  const n = Number(id)
  return Number.isNaN(n) ? null : n
})

const activeTagId = computed<number | undefined>(() => {
  const id = route.params.tagId
  if (id === undefined) return undefined
  const n = Number(id)
  return Number.isNaN(n) ? undefined : n
})

const activeView = computed<'notes'>(() => 'notes')

const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

const pageTitle = computed(() => {
  if (activeTagId.value) return tags.value.find((t) => t.id === activeTagId.value)?.name || '标签'
  if (activeNotebookId.value !== undefined && activeNotebookId.value !== null) {
    return notebooks.value.find((n) => n.id === activeNotebookId.value)?.name || '笔记本'
  }
  if (keyword.value) return `「${keyword.value}」的搜索结果`
  return '全部笔记'
})

const loadNotes = async () => {
  isLoading.value = true
  errorMsg.value = ''
  try {
    const { data } = await getNotes({
      notebookId: activeNotebookId.value,
      tagId: activeTagId.value,
      search: keyword.value || undefined,
      page: page.value,
      pageSize: pageSize.value
    })
    notes.value = data.data.items
    total.value = data.data.total
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '加载笔记失败'
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

const handleDelete = async (id: number) => {
  if (!confirm('确定删除这篇笔记吗？删除后可在回收站恢复。')) return
  try {
    await deleteNote(id)
    await loadNotes()
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '删除失败'
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
    await Promise.all([loadMeta(), loadNotes()])
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '更新笔记本失败'
  }
}

const handleDeleteNotebook = async (id: number) => {
  try {
    await deleteNotebook(id)
    await loadMeta()
    if (activeNotebookId.value === id) {
      router.push('/')
    } else {
      await loadNotes()
    }
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '删除笔记本失败'
  }
}

const handleUpdateTag = async (id: number, name: string) => {
  try {
    await updateTag(id, { name })
    await Promise.all([loadMeta(), loadNotes()])
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '更新标签失败'
  }
}

const handleDeleteTag = async (id: number) => {
  try {
    await deleteTag(id)
    await loadMeta()
    if (activeTagId.value === id) {
      router.push('/')
    } else {
      await loadNotes()
    }
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

watch(
  () => [route.params.notebookId, route.params.tagId, keyword.value],
  () => {
    page.value = 1
    loadNotes()
  },
  { immediate: false }
)

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
        :active-notebook-id="activeNotebookId"
        :active-tag-id="activeTagId"
        :active-view="activeView"
        :keyword="keyword"
        @update:keyword="(val) => { keyword = val; page = 1; loadNotes() }"
        @create-notebook="handleCreateNotebook"
        @update-notebook="handleUpdateNotebook"
        @delete-notebook="handleDeleteNotebook"
        @create-tag="handleCreateTag"
        @update-tag="handleUpdateTag"
        @delete-tag="handleDeleteTag"
        @refresh="loadNotes"
      />

      <main class="flex-1 overflow-y-auto p-6 lg:p-8">
        <div class="mb-8">
          <h2 class="section-title text-2xl">{{ pageTitle }}</h2>
          <p class="text-sm text-[var(--ink-muted)] mt-1">
            共 {{ total }} 篇笔记
          </p>
        </div>

        <p v-if="errorMsg" class="text-sm text-[var(--warn)] mb-4">{{ errorMsg }}</p>

        <div v-if="isLoading" class="text-center text-[var(--ink-muted)] py-12">加载中...</div>

        <div v-else class="space-y-4">
          <article
            v-for="note in notes"
            :key="note.id"
            class="paper-card p-5 group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            @click="router.push(`/note/${note.id}`)"
          >
            <div class="flex justify-between items-start gap-4">
              <div class="flex-1 min-w-0">
                <h3 class="section-title text-lg mb-2 truncate leading-tight">{{ note.title || '无标题' }}</h3>
                <div class="text-[var(--ink-light)] text-sm leading-relaxed line-clamp-2 markdown-preview-inline">
                  <MarkdownPreview :content="note.content" class="note-preview" />
                </div>
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-2">
                  <span
                    v-for="tag in note.tags"
                    :key="tag.id"
                    class="text-[11px] px-2 py-0.5 rounded-full bg-[rgba(180,95,68,0.08)] text-[var(--accent-dark)] border border-[var(--accent-light)]"
                  >
                    {{ tag.name }}
                  </span>
                  <span class="text-[11px] text-[var(--ink-muted)]">更新于 {{ new Date(note.updatedAt).toLocaleDateString() }}</span>
                </div>
              </div>
              <button
                @click.stop="handleDelete(note.id)"
                class="opacity-0 group-hover:opacity-100 text-[var(--warn)] hover:bg-[var(--warn-bg)] p-2 rounded-md transition-all"
                title="删除"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </article>

          <div v-if="notes.length === 0" class="text-center py-16">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--paper-deep)] flex items-center justify-center text-[var(--ink-muted)]">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <p class="text-[var(--ink-muted)]">
              还没有笔记，来创建一篇吧
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

:deep(.markdown-preview) {
  padding: 0 !important;
}

.note-preview :deep(.markdown-preview > *:first-child) {
  margin-top: 0;
}

.note-preview :deep(.markdown-preview p:last-child) {
  margin-bottom: 0;
}
</style>
