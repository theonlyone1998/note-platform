// 后端 DTO 类型（与 shared 保持一致，便于内部使用）
export interface RegisterDto {
  email: string
  username: string
  password: string
}

export interface LoginDto {
  email: string
  password: string
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

export interface JwtPayload {
  userId: number
  email: string
}
