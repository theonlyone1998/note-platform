import { delCache, getCache, setCache } from '@/utils/redis'
import { prisma } from '@/utils/prisma'
import { clearNoteCache } from './cache.service'
import type { Tag } from '@shared/types'

function tagCacheKey(userId: number) {
  return `tags:${userId}`
}

export async function getTags(userId: number): Promise<Tag[]> {
  const cacheKey = tagCacheKey(userId)
  const cached = await getCache<Tag[]>(cacheKey)
  if (cached) return cached

  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' }
  })
  await setCache(cacheKey, tags, 600)
  return tags
}

export async function createTag(userId: number, name: string, color?: string): Promise<Tag> {
  try {
    const tag = await prisma.tag.create({
      data: { name, color, userId }
    })
    await delCache(tagCacheKey(userId))
    return tag
  } catch (err: any) {
    if (err.code === 'P2002') {
      throw Object.assign(new Error('同名标签已存在'), { status: 409 })
    }
    throw err
  }
}

export async function updateTag(id: number, userId: number, data: { name?: string; color?: string }): Promise<Tag> {
  const exists = await prisma.tag.findFirst({ where: { id, userId } })
  if (!exists) {
    throw Object.assign(new Error('标签不存在'), { status: 404 })
  }

  try {
    const tag = await prisma.tag.update({
      where: { id },
      data
    })
    await delCache(tagCacheKey(userId))
    await clearNoteCache(userId)
    return tag
  } catch (err: any) {
    if (err.code === 'P2002') {
      throw Object.assign(new Error('同名标签已存在'), { status: 409 })
    }
    throw err
  }
}

export async function deleteTag(id: number, userId: number): Promise<void> {
  const exists = await prisma.tag.findFirst({ where: { id, userId } })
  if (!exists) {
    throw Object.assign(new Error('标签不存在'), { status: 404 })
  }

  await prisma.$transaction([
    prisma.noteTag.deleteMany({ where: { tagId: id } }),
    prisma.tag.delete({ where: { id } })
  ])
  await delCache(tagCacheKey(userId))
  await clearNoteCache(userId)
}
