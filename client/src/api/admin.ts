import request from './request'
import type { ApiResponse } from './request'
import type { AdminDashboardStats, AdminNote, AdminNoteListResult, AdminUser, AdminUserListResult } from '@shared/types'
import type { LoginDto } from '@shared/types'

export type AdminAuthPayload = { token: string; user: AdminUser }

export function adminLogin(data: LoginDto) {
  return request.post<ApiResponse<AdminAuthPayload>>('/admin/login', data)
}

export function getAdminCurrentUser() {
  return request.get<ApiResponse<AdminUser>>('/admin/me')
}

export function getAdminUsers(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return request.get<ApiResponse<AdminUserListResult>>('/admin/users', { params })
}

export function getAdminUser(id: number) {
  return request.get<ApiResponse<AdminUser>>(`/admin/users/${id}`)
}

export function updateAdminUserStatus(id: number, isActive: boolean) {
  return request.patch<ApiResponse<AdminUser>>(`/admin/users/${id}/status`, { isActive })
}

export function resetAdminUserPassword(id: number) {
  return request.patch<ApiResponse<{ id: number; updatedAt: Date | string }>>(`/admin/users/${id}/reset-password`)
}

export function deleteAdminUser(id: number) {
  return request.delete<ApiResponse<{ id: number }>>(`/admin/users/${id}`)
}

export function getAdminNotes(params?: { page?: number; pageSize?: number; keyword?: string; userId?: number; isDeleted?: boolean }) {
  return request.get<ApiResponse<AdminNoteListResult>>('/admin/notes', { params })
}

export function getAdminNote(id: number) {
  return request.get<ApiResponse<AdminNote>>(`/admin/notes/${id}`)
}

export function updateAdminNote(id: number, data: Partial<AdminNote>) {
  return request.patch<ApiResponse<AdminNote>>(`/admin/notes/${id}`, data)
}

export function toggleAdminNoteTrash(id: number) {
  return request.patch<ApiResponse<AdminNote>>(`/admin/notes/${id}/trash`)
}

export function hardDeleteAdminNote(id: number) {
  return request.delete<ApiResponse<{ id: number }>>(`/admin/notes/${id}`)
}

export function getAdminDashboardStats() {
  return request.get<ApiResponse<AdminDashboardStats>>('/admin/dashboard/stats')
}
