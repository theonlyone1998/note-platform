<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const props = defineProps<{
  content: string
}>()

const highlight = (str: string, lang?: string): string => {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`
    } catch {
      // fallthrough
    }
  }
  return `<pre class="hljs"><code>${str}</code></pre>`
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight
})

const rendered = computed(() => md.render(props.content || ''))
</script>

<template>
  <div class="markdown-preview prose prose-sm max-w-none h-full overflow-auto p-6" v-html="rendered"></div>
</template>

<style>
.markdown-preview pre.hljs {
  background-color: #1e293b;
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
}
.markdown-preview pre.hljs code {
  color: #e2e8f0;
  background: transparent;
}
</style>
