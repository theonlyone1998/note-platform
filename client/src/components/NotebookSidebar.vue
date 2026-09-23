<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Notebook, Tag } from '@shared/types'

const props = defineProps<{
  notebooks: Notebook[]
  tags: Tag[]
  activeNotebookId?: number | null
  activeTagId?: number | null
  activeView?: 'notes' | 'trash'
  keyword?: string
}>()

const emit = defineEmits<{
  (e: 'update:keyword', value: string): void
  (e: 'create-notebook', name: string): void
  (e: 'update-notebook', id: number, name: string): void
  (e: 'delete-notebook', id: number): void
  (e: 'create-tag', name: string): void
  (e: 'update-tag', id: number, name: string): void
  (e: 'delete-tag', id: number): void
  (e: 'refresh'): void
}>()

const router = useRouter()

const localKeyword = ref(props.keyword || '')
const showNotebookInput = ref(false)
const showTagInput = ref(false)
const newNotebookName = ref('')
const newTagName = ref('')

const editingNotebookId = ref<number | null>(null)
const editingNotebookName = ref('')
const editingTagId = ref<number | null>(null)
const editingTagName = ref('')

const allNotesActive = computed(() => {
  return props.activeView === 'notes' && props.activeNotebookId === undefined && props.activeTagId === undefined
})

watch(
  () => props.keyword,
  (val) => {
    localKeyword.value = val || ''
  }
)

const debouncedSearch = (() => {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (val: string) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      emit('update:keyword', val)
    }, 300)
  }
})()

const onKeywordInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  localKeyword.value = val
  debouncedSearch(val)
}

const submitNotebook = () => {
  const name = newNotebookName.value.trim()
  if (!name) {
    showNotebookInput.value = false
    return
  }
  emit('create-notebook', name)
  newNotebookName.value = ''
  showNotebookInput.value = false
}

const submitTag = () => {
  const name = newTagName.value.trim()
  if (!name) {
    showTagInput.value = false
    return
  }
  emit('create-tag', name)
  newTagName.value = ''
  showTagInput.value = false
}

const navigateToNotes = () => {
  router.push('/')
}

const navigateToTrash = () => {
  router.push('/trash')
}

const navigateToNotebook = (id: number | null) => {
  if (id === null) {
    router.push('/')
  } else {
    router.push(`/notebook/${id}`)
  }
}

const navigateToTag = (id: number) => {
  router.push(`/tag/${id}`)
}

const createNote = () => {
  router.push('/note')
}

const startEditNotebook = (notebook: Notebook) => {
  editingNotebookId.value = notebook.id
  editingNotebookName.value = notebook.name
}

const submitEditNotebook = () => {
  if (!editingNotebookId.value) return
  const name = editingNotebookName.value.trim()
  if (!name) {
    editingNotebookId.value = null
    return
  }
  emit('update-notebook', editingNotebookId.value, name)
  editingNotebookId.value = null
}

const cancelEditNotebook = () => {
  editingNotebookId.value = null
  editingNotebookName.value = ''
}

const confirmDeleteNotebook = (id: number, name: string) => {
  if (confirm(`确定删除笔记本「${name}」吗？该笔记本中的笔记不会被删除。`)) {
    emit('delete-notebook', id)
  }
}

const startEditTag = (tag: Tag) => {
  editingTagId.value = tag.id
  editingTagName.value = tag.name
}

const submitEditTag = () => {
  if (!editingTagId.value) return
  const name = editingTagName.value.trim()
  if (!name) {
    editingTagId.value = null
    return
  }
  emit('update-tag', editingTagId.value, name)
  editingTagId.value = null
}

const cancelEditTag = () => {
  editingTagId.value = null
  editingTagName.value = ''
}

const confirmDeleteTag = (id: number, name: string) => {
  if (confirm(`确定删除标签「${name}」吗？已关联的笔记将移除该标签。`)) {
    emit('delete-tag', id)
  }
}

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  const notebookSection = document.getElementById('notebook-section')
  const tagSection = document.getElementById('tag-section')
  if (showNotebookInput.value) {
    if (!notebookSection?.contains(target)) {
      newNotebookName.value = ''
      showNotebookInput.value = false
    }
  }
  if (showTagInput.value) {
    if (!tagSection?.contains(target)) {
      newTagName.value = ''
      showTagInput.value = false
    }
  }
  if (editingNotebookId.value) {
    if (!target.closest(`#notebook-item-${editingNotebookId.value}`)) {
      cancelEditNotebook()
    }
  }
  if (editingTagId.value) {
    if (!target.closest(`#tag-item-${editingTagId.value}`)) {
      cancelEditTag()
    }
  }
}

const focusInput = async (type: 'notebook' | 'tag' | 'edit-notebook' | 'edit-tag') => {
  await nextTick()
  const idMap = {
    notebook: 'new-notebook-input',
    tag: 'new-tag-input',
    'edit-notebook': 'edit-notebook-input',
    'edit-tag': 'edit-tag-input'
  }
  const input = document.getElementById(idMap[type])
  input?.focus()
}

watch(showNotebookInput, (val) => {
  if (val) {
    cancelEditNotebook()
    focusInput('notebook')
  }
})

watch(showTagInput, (val) => {
  if (val) {
    cancelEditTag()
    focusInput('tag')
  }
})

watch(editingNotebookId, (val) => {
  if (val) focusInput('edit-notebook')
})

watch(editingTagId, (val) => {
  if (val) focusInput('edit-tag')
})

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <aside class="w-64 flex flex-col h-full bg-[rgba(253,251,247,0.85)] backdrop-blur-sm shadow-[1px_0_0_rgba(230,223,211,0.5)]">
    <div class="p-5 border-b border-[var(--paper-shadow)]">
      <button
        @click="createNote"
        class="paper-button w-full"
      >
        <span class="text-lg leading-none">+</span>
        <span>新建笔记</span>
      </button>
    </div>

    <div class="p-5 border-b border-[var(--paper-shadow)]">
      <div class="relative">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          :value="localKeyword"
          @input="onKeywordInput"
          type="text"
          placeholder="搜索笔记..."
          autocomplete="off"
          class="paper-input pl-9 text-sm"
        />
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-5 space-y-6">
      <!-- Views -->
      <section>
        <h3 class="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-widest mb-3 pl-1">视图</h3>
        <nav class="space-y-1">
          <button
            @click="navigateToNotes"
            :class="['nav-item flex items-center gap-2', allNotesActive ? 'nav-item-active' : '']"
          >
            <svg class="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            全部笔记
          </button>
          <button
            @click="navigateToTrash"
            :class="['nav-item flex items-center gap-2', activeView === 'trash' ? 'nav-item-active' : '']"
          >
            <svg class="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            回收站
          </button>
        </nav>
      </section>

      <!-- Notebooks -->
      <section id="notebook-section">
        <div class="flex items-center justify-between mb-3 pl-1">
          <h3 class="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-widest">笔记本</h3>
          <button
            @click="showNotebookInput = !showNotebookInput"
            class="w-6 h-6 rounded-md flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--accent)] hover:bg-[var(--paper-deep)] transition-colors"
            title="新建笔记本"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <div v-if="notebooks.length === 0" class="text-sm text-[var(--ink-muted)] pl-1">
          还没有笔记本
        </div>
        <nav v-else class="space-y-1">
          <div
            v-for="notebook in notebooks"
            :key="notebook.id"
            :id="`notebook-item-${notebook.id}`"
            :class="[
              'group flex items-center gap-1 rounded-lg transition-colors',
              activeNotebookId === notebook.id ? 'bg-[var(--paper-deep)]' : 'hover:bg-[var(--paper-deep)]'
            ]"
          >
            <input
              v-if="editingNotebookId === notebook.id"
              v-model="editingNotebookName"
              @keyup.enter="submitEditNotebook"
              @blur="submitEditNotebook"
              @keyup.esc="cancelEditNotebook"
              type="text"
              id="edit-notebook-input"
              autocomplete="off"
              class="paper-input text-sm flex-1 mx-1 my-0.5"
            />
            <template v-else>
              <button
                @click="navigateToNotebook(notebook.id)"
                :class="['nav-item flex-1 flex items-center gap-2 min-w-0', activeNotebookId === notebook.id ? 'nav-item-active bg-transparent' : '']"
              >
                <svg class="w-4 h-4 opacity-60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                </svg>
                <span class="truncate">{{ notebook.name }}</span>
              </button>
              <div class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                <button
                  @click="startEditNotebook(notebook)"
                  class="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--accent)]"
                  title="重命名"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  @click="confirmDeleteNotebook(notebook.id, notebook.name)"
                  class="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--warn)]"
                  title="删除"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </template>
          </div>
        </nav>
        <div v-if="showNotebookInput" class="mt-2">
          <input
            v-model="newNotebookName"
            @keyup.enter="submitNotebook"
            @blur="submitNotebook"
            type="text"
            id="new-notebook-input"
            placeholder="输入笔记本名称"
            autocomplete="off"
            class="paper-input text-sm"
          />
        </div>
      </section>

      <!-- Tags -->
      <section id="tag-section">
        <div class="flex items-center justify-between mb-3 pl-1">
          <h3 class="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-widest">标签</h3>
          <button
            @click="showTagInput = !showTagInput"
            class="w-6 h-6 rounded-md flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--accent)] hover:bg-[var(--paper-deep)] transition-colors"
            title="新建标签"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <div v-if="tags.length === 0" class="text-sm text-[var(--ink-muted)] pl-1">还没有标签</div>
        <nav v-else class="space-y-1">
          <div
            v-for="tag in tags"
            :key="tag.id"
            :id="`tag-item-${tag.id}`"
            :class="[
              'group flex items-center gap-1 rounded-lg transition-colors',
              activeTagId === tag.id ? 'bg-[var(--paper-deep)]' : 'hover:bg-[var(--paper-deep)]'
            ]"
          >
            <input
              v-if="editingTagId === tag.id"
              v-model="editingTagName"
              @keyup.enter="submitEditTag"
              @blur="submitEditTag"
              @keyup.esc="cancelEditTag"
              type="text"
              id="edit-tag-input"
              autocomplete="off"
              class="paper-input text-sm flex-1 mx-1 my-0.5"
            />
            <template v-else>
              <button
                @click="navigateToTag(tag.id)"
                :class="['nav-item flex-1 flex items-center gap-2 min-w-0', activeTagId === tag.id ? 'nav-item-active bg-transparent' : '']"
              >
                <span class="w-3.5 h-3.5 rounded-full flex items-center justify-center bg-[var(--paper-deep)] border border-[var(--paper-shadow)] flex-shrink-0">
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :style="{ backgroundColor: tag.color || 'var(--accent)' }"
                  />
                </span>
                <span class="truncate">{{ tag.name }}</span>
              </button>
              <div class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                <button
                  @click="startEditTag(tag)"
                  class="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--accent)]"
                  title="重命名"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  @click="confirmDeleteTag(tag.id, tag.name)"
                  class="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--warn)]"
                  title="删除"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </template>
          </div>
        </nav>
        <div v-if="showTagInput" class="mt-2">
          <input
            id="new-tag-input"
            v-model="newTagName"
            @keyup.enter="submitTag"
            @blur="submitTag"
            type="text"
            placeholder="输入标签名称"
            autocomplete="off"
            class="paper-input text-sm"
          />
        </div>
      </section>
    </div>
  </aside>
</template>
