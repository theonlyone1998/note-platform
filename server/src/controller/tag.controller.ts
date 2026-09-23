import type { Context } from 'koa'
import {
  createTag as createTagService,
  deleteTag as deleteTagService,
  getTags as getTagsService,
  updateTag as updateTagService
} from '@/service/tag.service'

function getUserId(ctx: Context): number {
  return ctx.state.user.userId as number
}

export async function getTags(ctx: Context) {
  const userId = getUserId(ctx)
  const tags = await getTagsService(userId)
  ctx.success(tags)
}

export async function createTag(ctx: Context) {
  const userId = getUserId(ctx)
  const { name, color } = ctx.request.body as { name?: string; color?: string }
  if (!name || !name.trim()) {
    return ctx.fail('标签名称不能为空')
  }
  const tag = await createTagService(userId, name.trim(), color)
  ctx.success(tag)
}

export async function updateTag(ctx: Context) {
  const userId = getUserId(ctx)
  const id = Number(ctx.params.id)
  const { name, color } = ctx.request.body as { name?: string; color?: string }
  const tag = await updateTagService(id, userId, { name: name?.trim(), color })
  ctx.success(tag)
}

export async function deleteTag(ctx: Context) {
  const userId = getUserId(ctx)
  const id = Number(ctx.params.id)
  await deleteTagService(id, userId)
  ctx.success(null)
}
