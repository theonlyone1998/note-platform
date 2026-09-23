<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createNote,
  getNoteById,
  saveDraft,
  updateNote
} from '@/api/note'
import { getNotebooks } from '@/api/notebook'
import { getTags } from '@/api/tag'
import AppSelect from '@/components/AppSelect.vue'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import type { CreateNoteDto, Note, Notebook, Tag } from '@shared/types'

const route = useRoute()
const router = useRouter()
const noteId = computed(() => Number(route.params.id) || 0)
const isSubmitting = ref(false)
const isLoading = ref(false)
const isSavingDraft = ref(false)
const errorMsg = ref('')
const draftSavedAt = ref('')
const draftNoteId = ref<number | null>(null)

const currentNoteId = computed(() => noteId.value || draftNoteId.value)

const notebooks = ref<Notebook[]>([])
const tags = ref<Tag[]>([])
const isLoadingMeta = ref(false)

const notebookOptions = computed(() =>
  notebooks.value.map((nb) => ({ value: nb.id, label: nb.name }))
)

const form = reactive<CreateNoteDto>({
  title: '',
  content: '',
  contentType: 'markdown',
  notebookId: null,
  tagIds: []
})

const hasUnsavedChanges = ref(false)
const lastSavedHash = ref('')

const currentHash = computed(() => {
  return JSON.stringify({
    title: form.title,
    content: form.content,
    notebookId: form.notebookId,
    tagIds: form.tagIds
  })
})

watch(currentHash, (val) => {
  hasUnsavedChanges.value = val !== lastSavedHash.value
})

const loadNote = async () => {
  const localId = localStorage.getItem('note_draft_new_id')
  if (localId && !noteId.value) {
    draftNoteId.value = Number(localId)
  }

  const targetId = noteId.value || draftNoteId.value
  if (!targetId) {
    return
  }

  isLoading.value = true
  errorMsg.value = ''
  try {
    const { data } = await getNoteById(targetId)
    form.title = data.data.title
    form.content = data.data.content
    form.contentType = data.data.contentType || 'markdown'
    form.notebookId = data.data.notebookId ?? null
    form.tagIds = (data.data.tags || []).map((t) => t.id)
    lastSavedHash.value = currentHash.value
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '加载笔记失败'
  } finally {
    isLoading.value = false
  }
}

const loadMeta = async () => {
  isLoadingMeta.value = true
  try {
    const [nbRes, tagRes] = await Promise.all([getNotebooks(), getTags()])
    notebooks.value = nbRes.data.data
    tags.value = tagRes.data.data
  } catch (err) {
    console.error('加载笔记本/标签失败', err)
  } finally {
    isLoadingMeta.value = false
  }
}

let draftTimer: ReturnType<typeof setTimeout> | null = null

const doAutoSave = async () => {
  if (!hasUnsavedChanges.value) return

  isSavingDraft.value = true
  try {
    const res = await saveDraft(currentNoteId.value, {
      title: form.title,
      content: form.content,
      notebookId: form.notebookId,
      tagIds: form.tagIds
    })
    if (!noteId.value && !draftNoteId.value) {
      const created = res.data.data as Note
      draftNoteId.value = created.id
      localStorage.setItem('note_draft_new_id', String(created.id))
      router.replace(`/note/${created.id}`)
    }
    draftSavedAt.value = new Date().toLocaleTimeString()
    lastSavedHash.value = currentHash.value
  } catch (err) {
    console.error('自动保存失败', err)
  } finally {
    isSavingDraft.value = false
  }
}

const scheduleAutoSave = () => {
  if (draftTimer) clearTimeout(draftTimer)
  draftTimer = setTimeout(() => {
    doAutoSave()
  }, 3000)
}

watch(
  () => [form.title, form.content, form.notebookId, form.tagIds],
  () => {
    scheduleAutoSave()
  },
  { deep: true }
)

const onBeforeLeave = (e: BeforeUnloadEvent) => {
  if (hasUnsavedChanges.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

const onSubmit = async () => {
  if (draftTimer) clearTimeout(draftTimer)
  isSubmitting.value = true
  errorMsg.value = ''
  try {
    const targetId = noteId.value || draftNoteId.value
    if (targetId) {
      await updateNote(targetId, { ...form, isDraft: false })
      if (draftNoteId.value) {
        localStorage.removeItem('note_draft_new_id')
      }
    } else {
      const res = await createNote({ ...form, isDraft: false })
      localStorage.removeItem('note_draft_new_id')
      lastSavedHash.value = currentHash.value
      hasUnsavedChanges.value = false
      router.replace(`/note/${res.data.data.id}`)
      return
    }
    lastSavedHash.value = currentHash.value
    hasUnsavedChanges.value = false
    router.push('/')
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '保存失败'
  } finally {
    isSubmitting.value = false
  }
}

const toggleTag = (id: number) => {
  const idx = form.tagIds?.indexOf(id) ?? -1
  if (idx >= 0) {
    form.tagIds?.splice(idx, 1)
  } else {
    if (!form.tagIds) form.tagIds = []
    form.tagIds.push(id)
  }
}

onMounted(() => {
  loadNote()
  loadMeta()
  window.addEventListener('beforeunload', onBeforeLeave)
})

onBeforeUnmount(() => {
  if (draftTimer) clearTimeout(draftTimer)
  window.removeEventListener('beforeunload', onBeforeLeave)
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b border-[var(--paper-shadow)] bg-[rgba(253,251,247,0.95)] backdrop-blur-sm z-10">
      <div class="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between gap-4">
        <div class="flex items-center gap-4 min-w-0">
          <button @click="router.push('/')" class="text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors flex items-center gap-1 text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回
          </button>
          <h1 class="section-title text-lg truncate">{{ noteId ? '编辑笔记' : '新建笔记' }}</h1>
        </div>
        <div class="flex items-center gap-4">
          <span v-if="isSavingDraft" class="text-xs text-[var(--ink-muted)]">保存中...</span>
          <span v-else-if="draftSavedAt" class="text-xs text-[var(--ink-muted)]">
            草稿已保存 {{ draftSavedAt }}
          </span>
          <button
            type="button"
            @click="onSubmit"
            :disabled="isSubmitting"
            class="paper-button"
          >
            {{ isSubmitting ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1 mx-auto max-w-7xl w-full px-6 py-5 flex flex-col">
      <p v-if="errorMsg" class="text-sm text-[var(--warn)] mb-4">{{ errorMsg }}</p>

      <div v-if="isLoading" class="text-center text-[var(--ink-muted)] py-12">加载中...</div>

      <div v-else class="paper-card flex flex-col flex-1 overflow-hidden">
        <!-- Meta bar -->
        <div class="border-b border-[var(--paper-shadow)] p-4 flex flex-wrap items-end gap-4 bg-[var(--paper)]">
          <div class="w-64 min-w-[200px] flex flex-col">
            <label class="paper-label">标题</label>
            <input
              v-model="form.title"
              type="text"
              required
              class="paper-input"
              placeholder="输入笔记标题"
            />
          </div>
          <div class="w-56 flex flex-col">
            <label class="paper-label">笔记本</label>
            <AppSelect
              v-model="(form.notebookId as number | null)"
              :options="notebookOptions"
              placeholder="选择一个笔记本"
              :disabled="notebooks.length === 0"
            />
          </div>
          <div class="flex-1 min-w-[200px] flex flex-col">
            <label class="paper-label">标签</label>
            <div class="flex flex-wrap items-center gap-2 min-h-[42px]">
              <button
                v-for="tag in tags"
                :key="tag.id"
                @click="toggleTag(tag.id)"
                :class="[
                  'px-2.5 py-1 rounded-full text-xs transition-all duration-150 border cursor-pointer',
                  form.tagIds?.includes(tag.id)
                    ? 'bg-[rgba(180,95,68,0.08)] text-[var(--accent-dark)] border-[var(--accent)] font-medium'
                    : 'bg-[var(--paper-deep)] text-[var(--ink-light)] border-[var(--paper-shadow)] hover:bg-[rgba(180,95,68,0.08)] hover:text-[var(--accent-dark)] hover:border-[var(--accent-light)]'
                ]"
              >
                {{ tag.name }}
              </button>
              <span v-if="tags.length === 0" class="text-sm text-[var(--ink-muted)]">暂无标签</span>
            </div>
          </div>
        </div>

        <!-- Markdown Editor -->
        <div class="flex-1 overflow-hidden bg-[var(--paper)]">
          <MarkdownEditor v-model="form.content" class="h-full" />
        </div>
      </div>
    </main>
  </div>
</template>
