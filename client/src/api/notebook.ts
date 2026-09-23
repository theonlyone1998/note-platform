import request from './request'
import type { ApiResponse } from './request'
import type { Notebook } from '@shared/types'

export function getNotebooks() {
  return request.get<ApiResponse<Notebook[]>>('/notebook')
}

export function createNotebook(name: string) {
  return request.post<ApiResponse<Notebook>>('/notebook', { name })
}

export function updateNotebook(id: number, name: string) {
  return request.put<ApiResponse<Notebook>>(`/notebook/${id}`, { name })
}

export function deleteNotebook(id: number) {
  return request.delete<ApiResponse<null>>(`/notebook/${id}`)
}
