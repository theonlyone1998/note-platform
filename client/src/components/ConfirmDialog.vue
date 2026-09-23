<script setup lang="ts">
interface Props {
  visible: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

withDefaults(defineProps<Props>(), {
  title: '确认操作',
  confirmText: '确定',
  cancelText: '取消',
  danger: false
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const close = () => {
  emit('update:visible', false)
  emit('cancel')
}

const confirm = () => {
  emit('update:visible', false)
  emit('confirm')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="close"
      >
        <div class="absolute inset-0 bg-[var(--ink)]/20 backdrop-blur-[2px]" />
        <div class="relative w-full max-w-sm paper-card p-6 shadow-xl transform transition-all">
          <h3 class="page-title text-lg mb-3">{{ title }}</h3>
          <p class="text-sm text-[var(--ink-light)] leading-relaxed mb-6">{{ message }}</p>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              @click="close"
              class="px-4 py-2 text-sm rounded-lg border border-[var(--paper-shadow)] text-[var(--ink-light)] hover:bg-[var(--paper-deep)] transition-colors"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              @click="confirm"
              class="px-4 py-2 text-sm rounded-lg text-white transition-colors"
              :class="danger ? 'bg-[var(--warn)] hover:bg-[#b24a2e]' : 'bg-[var(--accent)] hover:bg-[var(--accent-dark)]'"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s var(--ease-out);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .paper-card,
.fade-leave-active .paper-card {
  transition: transform 0.2s var(--ease-out), opacity 0.2s var(--ease-out);
}

.fade-enter-from .paper-card,
.fade-leave-to .paper-card {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}
</style>
