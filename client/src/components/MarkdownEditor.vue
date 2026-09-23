<script setup lang="ts">
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import type { ToolbarNames } from 'md-editor-v3'

defineProps<{
  modelValue: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const excludedTools: ToolbarNames[] = ['image', 'save', 'preview']
</script>

<template>
  <MdEditor
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    language="zh-CN"
    previewTheme="default"
    codeTheme="atom"
    :toolbarsExclude="excludedTools"
  />
</template>

<style>
.md-editor {
  --md-color: var(--ink);
  --md-hover-color: var(--accent);
  --md-b-color: var(--paper-shadow);
  --md-bg-color: var(--paper);
  --md-scrollbar-bg-color: var(--paper-deep);
  --md-scrollbar-thumb-color: var(--paper-shadow);
  --md-scrollbar-thumb-hover-color: var(--accent-light);

  border: none !important;
  background-color: var(--paper) !important;
}

.md-editor .md-editor-toolbar {
  border-bottom-color: var(--paper-shadow);
  background-color: var(--paper-deep);
}

.md-editor .md-editor-toolbar-item {
  color: var(--ink-light);
}

.md-editor .md-editor-toolbar-item:hover {
  color: var(--accent);
  background-color: rgba(180, 95, 68, 0.08);
}

.md-editor .md-editor-input-wrapper {
  background-color: var(--paper);
}

.md-editor .cm-editor {
  background-color: var(--paper);
}

.md-editor .cm-editor .cm-scroller {
  background-color: var(--paper);
  font-family: var(--font-body);
}

.md-editor .cm-editor .cm-content {
  color: var(--ink);
  background-color: var(--paper);
  caret-color: var(--accent);
}

.md-editor .cm-editor .cm-gutters {
  background-color: var(--paper-deep);
  border-right-color: var(--paper-shadow);
  color: var(--ink-muted);
}

.md-editor .cm-editor .cm-activeLineGutter {
  background-color: rgba(180, 95, 68, 0.06);
}

.md-editor .cm-editor .cm-activeLine {
  background-color: rgba(180, 95, 68, 0.04);
}

.md-editor .cm-editor .cm-selectionBackground {
  background-color: rgba(180, 95, 68, 0.18) !important;
}

.md-editor .cm-editor .cm-cursor {
  border-left-color: var(--accent);
}

.md-editor .md-editor-preview {
  font-family: var(--font-body);
  color: var(--ink);
  line-height: 1.75;
  background-color: var(--paper);
}

.md-editor .md-editor-preview h1,
.md-editor .md-editor-preview h2,
.md-editor .md-editor-preview h3,
.md-editor .md-editor-preview h4 {
  font-family: var(--font-display);
  color: var(--ink);
  margin-top: 1.25rem;
  margin-bottom: 0.75rem;
}

.md-editor .md-editor-preview p {
  margin-bottom: 0.875rem;
}

.md-editor .md-editor-preview blockquote {
  border-left: 3px solid var(--accent-light);
  padding-left: 1rem;
  color: var(--ink-light);
  font-style: italic;
  margin: 1rem 0;
  background-color: transparent;
}

.md-editor .md-editor-preview code {
  font-family: 'SF Mono', Menlo, Monaco, Consolas, monospace;
  background-color: var(--paper-deep);
  padding: 0.15rem 0.35rem;
  border-radius: 0.25rem;
  font-size: 0.88em;
  color: var(--accent-dark);
}

.md-editor .md-editor-preview pre {
  background-color: #2d2926;
  color: #f0ece5;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1rem 0;
}

.md-editor .md-editor-preview pre code {
  background-color: transparent;
  color: inherit;
  padding: 0;
}

.md-editor .md-editor-preview hr {
  border: 0;
  border-top: 1px solid var(--paper-shadow);
  margin: 1.5rem 0;
}

.md-editor .md-editor-preview a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

.md-editor .md-editor-preview ul,
.md-editor .md-editor-preview ol {
  padding-left: 1.5rem;
  margin-bottom: 0.875rem;
}

.md-editor .md-editor-preview li {
  margin-bottom: 0.25rem;
}

.md-editor .md-editor-preview img {
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px var(--shadow-color);
  max-width: 100%;
}

.md-editor .md-editor-preview table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.92rem;
}

.md-editor .md-editor-preview th,
.md-editor .md-editor-preview td {
  border: 1px solid var(--paper-shadow);
  padding: 0.5rem 0.75rem;
}

.md-editor .md-editor-preview th {
  background-color: var(--paper-deep);
  font-weight: 600;
}

.md-editor .md-editor-resize-operate {
  background-color: var(--paper-shadow);
}

.md-editor ::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.md-editor ::-webkit-scrollbar-track {
  background: var(--paper-deep);
}

.md-editor ::-webkit-scrollbar-thumb {
  background: var(--paper-shadow);
  border-radius: 4px;
}

.md-editor ::-webkit-scrollbar-thumb:hover {
  background: var(--accent-light);
}
</style>
