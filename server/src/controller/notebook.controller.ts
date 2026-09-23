import type { Context } from 'koa'
import {
  createNotebook as createNotebookService,
  deleteNotebook as deleteNotebookService,
  getNotebooks as getNotebooksService,
  updateNotebook as updateNotebookService
} from '@/service/notebook.service'

function getUserId(ctx: Context): number {
  return ctx.state.user.userId as number
}

export async function getNotebooks(ctx: Context) {
  const userId = getUserId(ctx)
  const notebooks = await getNotebooksService(userId)
  ctx.success(notebooks)
}

export async function createNotebook(ctx: Context) {
  const userId = getUserId(ctx)
  const { name } = ctx.request.body as { name?: string }
  if (!name || !name.trim()) {
    return ctx.fail('笔记本名称不能为空')
  }
  const notebook = await createNotebookService(userId, name.trim())
  ctx.success(notebook)
}

export async function updateNotebook(ctx: Context) {
  const userId = getUserId(ctx)
  const id = Number(ctx.params.id)
  const { name } = ctx.request.body as { name?: string }
  if (!name || !name.trim()) {
    return ctx.fail('笔记本名称不能为空')
  }
  const notebook = await updateNotebookService(id, userId, name.trim())
  ctx.success(notebook)
}

export async function deleteNotebook(ctx: Context) {
  const userId = getUserId(ctx)
  const id = Number(ctx.params.id)
  await deleteNotebookService(id, userId)
  ctx.success(null)
}
