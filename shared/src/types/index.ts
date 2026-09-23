export interface UserInfo {
  id: number
  email: string
  username: string
  role?: string
  isActive?: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface RegisterDto {
  email: string
  username: string
  password: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface Notebook {
  id: number
  name: string
  userId: number
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Tag {
  id: number
  name: string
  color?: string | null
  userId: number
  createdAt: Date | string
  updatedAt: Date | string
}

export interface NoteTagItem {
  tagId: number
  tag: Tag
}

export interface Note {
  id: number
  title: string
  content: string
  contentType: string
  isDraft: boolean
  notebookId?: number | null
  notebook?: Notebook | null
  userId: number
  tags?: Tag[]
  isDeleted: boolean
  deletedAt?: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface CreateNoteDto {
  title: string
  content: string
  contentType?: string
  notebookId?: number | null
  tagIds?: number[]
  isDraft?: boolean
}

export interface UpdateNoteDto {
  title?: string
  content?: string
  contentType?: string
  notebookId?: number | null
  tagIds?: number[]
  isDraft?: boolean
}

export interface PagedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiResponse<T = unknown> {
  code: number
  data: T
  msg: string
}

export interface AdminLoginDto {
  email: string
  password: string
}

export interface AdminUserCount {
  notes: number
  notebooks: number
  tags: number
}

export interface AdminUser {
  id: number
  email: string
  username: string
  role: string
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
  _count?: AdminUserCount
}

export interface AdminUserListResult {
  items: AdminUser[]
  total: number
  page: number
  pageSize: number
}

export interface AdminNoteTag {
  tagId: number
  tag: Tag
}

export interface AdminNoteUser {
  id: number
  username: string
  email: string
}

export interface AdminNoteNotebook {
  id: number
  name: string
}

export interface AdminNote {
  id: number
  title: string
  content: string
  contentType: string
  isDraft: boolean
  notebookId?: number | null
  notebook?: AdminNoteNotebook | null
  userId: number
  user?: AdminNoteUser
  tags?: AdminNoteTag[]
  isDeleted: boolean
  deletedAt?: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface AdminNoteListResult {
  items: AdminNote[]
  total: number
  page: number
  pageSize: number
}

export interface AdminDashboardStats {
  totalUsers: number
  totalNotes: number
  totalDrafts: number
  totalTrash: number
}
