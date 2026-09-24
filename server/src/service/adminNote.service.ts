import { getCache, setCache } from '@/utils/redis'
import { prisma } from '@/utils/prisma'
import { clearAdminNoteCache, adminNoteCacheKey, adminNotesCacheKey } from './cache.service'

interface ListNotesParams {
  page?: number
  pageSize?: number
  keyword?: string
  userId?: number
  isDeleted?: boolean
}

export async function listNotes(params: ListNotesParams) {
  const page = Math.max(1, params.page || 1)
  const pageSize = Math.min(50, Math.max(1, params.pageSize || 10))
  const cacheParams = {
    page,
    pageSize,
    keyword: params.keyword || 'all',
    userId: params.userId ?? 'all',
    isDeleted: params.isDeleted ?? 'all'
  }
  const cacheKey = adminNotesCacheKey(cacheParams)
  const cached = await getCache<{
    items: any[]
    total: number
    page: number
    pageSize: number
  }>(cacheKey)
  if (cached) return cached

  const where: any = {}

  if (params.keyword) {
    where.OR = [
      { title: { contains: params.keyword } },
      { content: { contains: params.keyword } }
    ]
  }
  if (params.userId) where.userId = params.userId
  if (params.isDeleted !== undefined) where.isDeleted = params.isDeleted

  const [items, total] = await Promise.all([
    prisma.note.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, username: true, email: true } },
        notebook: { select: { id: true, name: true } },
        tags: { include: { tag: { select: { id: true, name: true, color: true } } } }
      }
    }),
    prisma.note.count({ where })
  ])

  const result = { items, total, page, pageSize }
  await setCache(cacheKey, result, 300)
  return result
}

export async function getNoteById(id: number) {
  const cacheKey = adminNoteCacheKey(id)
  const cached = await getCache(cacheKey)
  if (cached) return cached

  const note = await prisma.note.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, email: true } },
      notebook: { select: { id: true, name: true } },
      tags: { include: { tag: { select: { id: true, name: true, color: true } } } }
    }
  })
  if (!note) throw Object.assign(new Error('笔记不存在'), { status: 404 })
  await setCache(cacheKey, note, 1800)
  return note
}

export async function updateNote(id: number, data: { title?: string; content?: string; notebookId?: number | null; tagIds?: number[] }) {
  const note = await prisma.note.findUnique({ where: { id } })
  if (!note) throw Object.assign(new Error('笔记不存在'), { status: 404 })

  const updateData: any = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.content !== undefined) updateData.content = data.content
  if (data.notebookId !== undefined) updateData.notebookId = data.notebookId

  if (data.tagIds !== undefined) {
    updateData.tags = {
      deleteMany: {},
      create: data.tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } }))
    }
  }

  const updated = await prisma.note.update({
    where: { id },
    data: updateData,
    include: {
      user: { select: { id: true, username: true, email: true } },
      notebook: { select: { id: true, name: true } },
      tags: { include: { tag: { select: { id: true, name: true, color: true } } } }
    }
  })
  await clearAdminNoteCache(id, note.userId)
  return updated
}

export async function toggleNoteTrash(id: number) {
  const note = await prisma.note.findUnique({ where: { id } })
  if (!note) throw Object.assign(new Error('笔记不存在'), { status: 404 })

  const updated = await prisma.note.update({
    where: { id },
    data: {
      isDeleted: !note.isDeleted,
      deletedAt: note.isDeleted ? null : new Date()
    },
    include: {
      user: { select: { id: true, username: true, email: true } },
      notebook: { select: { id: true, name: true } },
      tags: { include: { tag: { select: { id: true, name: true, color: true } } } }
    }
  })
  await clearAdminNoteCache(id, note.userId)
  return updated
}

export async function hardDeleteNote(id: number) {
  const note = await prisma.note.findUnique({ where: { id } })
  if (!note) throw Object.assign(new Error('笔记不存在'), { status: 404 })

  await prisma.note.delete({ where: { id } })
  await clearAdminNoteCache(id, note.userId)
  return { id }
}
