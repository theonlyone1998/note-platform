import type { Context } from 'koa'
import { z } from 'zod'
import {
  getNoteById,
  hardDeleteNote,
  listNotes,
  toggleNoteTrash,
  updateNote
} from '@/service/adminNote.service'

const updateNoteSchema = z.object({
  title: z.string().min(1, '标题不能为空').optional(),
  content: z.string().optional(),
  notebookId: z.number().nullable().optional(),
  tagIds: z.array(z.number()).optional()
})

export async function adminListNotes(ctx: Context) {
  const query = ctx.query as Record<string, string>
  const result = await listNotes({
    page: query.page ? Number(query.page) : undefined,
    pageSize: query.pageSize ? Number(query.pageSize) : undefined,
    keyword: query.keyword,
    userId: query.userId ? Number(query.userId) : undefined,
    isDeleted: query.isDeleted !== undefined ? query.isDeleted === 'true' : undefined
  })
  ctx.success(result)
}

export async function adminGetNote(ctx: Context) {
  const id = Number(ctx.params.id)
  const note = await getNoteById(id)
  ctx.success(note)
}

export async function adminUpdateNote(ctx: Context) {
  const id = Number(ctx.params.id)
  const parsed = updateNoteSchema.safeParse(ctx.request.body)
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join('; ')
    throw Object.assign(new Error(message), { status: 400 })
  }

  const note = await updateNote(id, parsed.data)
  ctx.success(note)
}

export async function adminToggleNoteTrash(ctx: Context) {
  const id = Number(ctx.params.id)
  const note = await toggleNoteTrash(id)
  ctx.success(note)
}

export async function adminHardDeleteNote(ctx: Context) {
  const id = Number(ctx.params.id)
  await hardDeleteNote(id)
  ctx.success({ id })
}
