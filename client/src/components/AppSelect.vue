<script setup lang="ts">
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions
} from '@headlessui/vue'
import { computed } from 'vue'

export interface SelectOption {
  value: string | number | null
  label: string
  disabled?: boolean
}

const props = defineProps<{
  modelValue: string | number | null
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()

const selectedLabel = computed(() => {
  const found = props.options.find((o) => o.value === props.modelValue)
  return found?.label ?? props.placeholder ?? '请选择'
})

const isEmpty = computed(() => props.options.length === 0)
const showPlaceholder = computed(() => props.modelValue === '' || props.modelValue === null || props.modelValue === undefined)
</script>

<template>
  <Listbox
    :model-value="modelValue ?? ''"
    @update:model-value="emit('update:modelValue', $event as string | number | null)"
    :disabled="disabled || isEmpty"
    as="div"
    class="relative"
  >
    <ListboxButton
      class="w-full text-left flex items-center justify-between gap-2
        px-3.5 py-2.5 rounded-lg border
        bg-white/70 border-[var(--paper-shadow)] text-[var(--ink)]
        outline-none transition-all duration-200
        hover:border-[#d6cfc3] hover:bg-white/90
        focus:border-[var(--accent-light)] focus:ring-[3px] focus:ring-[var(--ring)] focus:bg-white
        disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-[var(--paper-deep)]"
    >
      <span class="truncate text-[0.9375rem]" :class="{ 'text-[var(--ink-muted)]': showPlaceholder }">
        {{ selectedLabel }}
      </span>
      <span class="shrink-0 pointer-events-none text-[var(--ink-muted)] transition-transform data-[headlessui-state~='open']:rotate-180">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </ListboxButton>

    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-1 scale-[0.98]"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-[0.98]"
    >
      <ListboxOptions
        class="absolute z-50 mt-1.5 w-full min-w-max max-h-60 overflow-auto
          rounded-lg border border-[var(--paper-shadow)] bg-[var(--paper)]
          shadow-[0_4px_14px_-4px_var(--shadow-color)] py-1 text-sm focus:outline-none"
      >
        <ListboxOption
          v-for="option in options"
          :key="String(option.value)"
          :value="option.value"
          :disabled="option.disabled"
          v-slot="{ active, selected }"
        >
          <li
            :class="[
              'relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors',
              active ? 'bg-[var(--paper-deep)] text-[var(--accent-dark)]' : 'text-[var(--ink-light)]',
              selected ? 'font-medium text-[var(--ink)]' : '',
              option.disabled ? 'opacity-50 cursor-not-allowed' : ''
            ]"
          >
            <span class="block truncate">
              {{ option.label }}
            </span>
            <span
              v-if="selected"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--accent)]"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </li>
        </ListboxOption>
        <li v-if="options.length === 0" class="px-3 py-2 text-[var(--ink-muted)] text-sm">
          暂无选项
        </li>
      </ListboxOptions>
    </transition>
  </Listbox>
</template>
