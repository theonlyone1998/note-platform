import request from './request'
import type { ApiResponse } from './request'
import type { Tag } from '@shared/types'

export function getTags() {
  return request.get<ApiResponse<Tag[]>>('/tag')
}

export function createTag(name: string, color?: string) {
  return request.post<ApiResponse<Tag>>('/tag', { name, color })
}

export function updateTag(id: number, data: { name?: string; color?: string }) {
  return request.put<ApiResponse<Tag>>(`/tag/${id}`, data)
}

export function deleteTag(id: number) {
  return request.delete<ApiResponse<null>>(`/tag/${id}`)
}
