import type { Context } from 'koa'
import {
  createNote as createNoteService,
  deleteNote as deleteNoteService,
  emptyTrash as emptyTrashService,
  getNoteById as getNoteByIdService,
  getNotes as getNotesService,
  permanentDeleteNote as permanentDeleteNoteService,
  restoreNote as restoreNoteService,
  saveDraft as saveDraftService,
  updateNote as updateNoteService
} from '@/service/note.service'
import type { CreateNoteDto, UpdateNoteDto } from '@/types'

function getUserId(ctx: Context): number {
  return ctx.state.user.userId as number
}

function parseQueryParam(value: unknown): number | undefined {
  const n = Number(value)
  return Number.isNaN(n) ? undefined : n
}

function parseBooleanParam(value: unknown): boolean | undefined {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

export async function getNotes(ctx: Context) {
  const userId = getUserId(ctx)
  const { notebookId, tagId, isDraft, search, page, pageSize } = ctx.query as Record<string, string | undefined>

  const result = await getNotesService(userId, {
    notebookId: notebookId === 'null' ? null : parseQueryParam(notebookId),
    tagId: parseQueryParam(tagId),
    isDraft: parseBooleanParam(isDraft),
    search,
    page: parseQueryParam(page),
    pageSize: parseQueryParam(pageSize)
  })

  ctx.success(result)
}

export async function getNoteById(ctx: Context) {
  const userId = getUserId(ctx)
  const id = Number(ctx.params.id)
  const note = await getNoteByIdService(id, userId)
  ctx.success(note)
}

export async function createNote(ctx: Context) {
  const userId = getUserId(ctx)
  const body = ctx.request.body as CreateNoteDto
  const note = await createNoteService(userId, body)
  ctx.success(note)
}

export async function updateNote(ctx: Context) {
  const userId = getUserId(ctx)
  const id = Number(ctx.params.id)
  const body = ctx.request.body as UpdateNoteDto
  const note = await updateNoteService(id, userId, body)
  ctx.success(note)
}

export async function deleteNote(ctx: Context) {
  const userId = getUserId(ctx)
  const id = Number(ctx.params.id)
  const note = await deleteNoteService(id, userId)
  ctx.success(note)
}

export async function restoreNote(ctx: Context) {
  const userId = getUserId(ctx)
  const id = Number(ctx.params.id)
  const note = await restoreNoteService(id, userId)
  ctx.success(note)
}

export async function permanentDeleteNote(ctx: Context) {
  const userId = getUserId(ctx)
  const id = Number(ctx.params.id)
  await permanentDeleteNoteService(id, userId)
  ctx.success(null)
}

export async function getTrashNotes(ctx: Context) {
  const userId = getUserId(ctx)
  const { page, pageSize } = ctx.query as Record<string, string | undefined>
  const result = await getNotesService(userId, {
    includeDeleted: true,
    page: parseQueryParam(page),
    pageSize: parseQueryParam(pageSize)
  })
  ctx.success(result)
}

export async function emptyTrash(ctx: Context) {
  const userId = getUserId(ctx)
  const count = await emptyTrashService(userId)
  ctx.success({ deletedCount: count })
}

export async function saveDraft(ctx: Context) {
  const userId = getUserId(ctx)
  const rawId = ctx.params.id
  const id = rawId === 'null' || rawId === undefined || rawId === '' ? null : Number(rawId)
  const body = ctx.request.body as UpdateNoteDto
  const note = await saveDraftService(id, userId, body)
  ctx.success(note)
}
