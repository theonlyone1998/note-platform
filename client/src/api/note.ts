import request from './request'
import type { ApiResponse } from './request'
import type { CreateNoteDto, Note, PagedResult, UpdateNoteDto } from '@shared/types'

export function getNotes(params?: {
  notebookId?: number | null
  tagId?: number
  isDraft?: boolean
  search?: string
  page?: number
  pageSize?: number
}) {
  return request.get<ApiResponse<PagedResult<Note>>>('/note', { params })
}

export function getNoteById(id: number) {
  return request.get<ApiResponse<Note>>(`/note/${id}`)
}

export function createNote(data: CreateNoteDto) {
  return request.post<ApiResponse<Note>>('/note', data)
}

export function updateNote(id: number, data: UpdateNoteDto) {
  return request.put<ApiResponse<Note>>(`/note/${id}`, data)
}

export function deleteNote(id: number) {
  return request.delete<ApiResponse<Note>>(`/note/${id}`)
}

export function restoreNote(id: number) {
  return request.put<ApiResponse<Note>>(`/note/${id}/restore`)
}

export function permanentDeleteNote(id: number) {
  return request.delete<ApiResponse<null>>(`/note/${id}/permanent`)
}

export function getTrashNotes(params?: { page?: number; pageSize?: number; search?: string }) {
  return request.get<ApiResponse<PagedResult<Note>>>('/note/trash', { params })
}

export function emptyTrash() {
  return request.delete<ApiResponse<{ deletedCount: number }>>('/note/null/empty-trash')
}

export function saveDraft(id: number | null, data: UpdateNoteDto) {
  const path = id ? `/note/${id}/draft` : '/note/null/draft'
  return request.put<ApiResponse<Note>>(path, data)
}
