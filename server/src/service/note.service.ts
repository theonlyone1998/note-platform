import { Prisma } from '@prisma/client'
import { getCache, setCache } from '@/utils/redis'
import { prisma } from '@/utils/prisma'
import { clearNoteCache, noteCacheKey, noteDetailCacheKey } from './cache.service'
import type { CreateNoteDto, UpdateNoteDto } from '@/types'
import type { Note, Tag } from '@shared/types'

export const NOTE_CONTENT_TYPE = {
  MARKDOWN: 'markdown',
  RICH_TEXT: 'richText'
} as const

const DEFAULT_PAGE_SIZE = 20

type NoteListResult = {
  items: Note[]
  total: number
  page: number
  pageSize: number
}

export type NoteListOptions = {
  notebookId?: number | null
  tagId?: number
  isDraft?: boolean
  search?: string
  includeDeleted?: boolean
  page?: number
  pageSize?: number
}

function normalizePagination(page?: number, pageSize?: number) {
  const p = Math.max(1, page || 1)
  const ps = Math.min(100, Math.max(1, pageSize || DEFAULT_PAGE_SIZE))
  return { page: p, pageSize: ps }
}

async function ensureTags(userId: number, tagIds?: number[]): Promise<number[]> {
  if (!tagIds || tagIds.length === 0) return []
  const tags = await prisma.tag.findMany({
    where: { id: { in: tagIds }, userId }
  })
  if (tags.length !== tagIds.length) {
    throw Object.assign(new Error('包含不存在的标签'), { status: 400 })
  }
  return tags.map((t) => t.id)
}

function mapNoteTags(note: unknown): Note {
  const n = note as any
  return {
    ...n,
    tags: (n.tags || []).map((nt: any) => nt.tag as Tag)
  }
}

export async function getNotes(
  userId: number,
  options: NoteListOptions = {}
): Promise<NoteListResult> {
  const { page, pageSize } = normalizePagination(options.page, options.pageSize)
  const cacheKey = noteCacheKey(userId, { ...options, page, pageSize })
  const cached = await getCache<NoteListResult>(cacheKey)
  if (cached) return cached

  const where: Prisma.NoteWhereInput = { userId }

  if (options.includeDeleted) {
    where.isDeleted = true
  } else {
    where.isDeleted = false
  }

  if (options.isDraft !== undefined) {
    where.isDraft = options.isDraft
  } else if (!options.includeDeleted) {
    where.isDraft = false
  }

  if (options.notebookId !== undefined) {
    where.notebookId = options.notebookId
  }

  if (options.tagId) {
    where.tags = { some: { tagId: options.tagId } }
  }

  if (options.search && options.search.trim()) {
    const q = options.search.trim()
    where.OR = [
      { title: { search: q } },
      { content: { search: q } }
    ]
  }

  const [rows, total] = await Promise.all([
    prisma.note.findMany({
      where,
      include: {
        notebook: true,
        tags: { include: { tag: true } }
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.note.count({ where })
  ])

  const result: NoteListResult = {
    items: rows.map(mapNoteTags),
    total,
    page,
    pageSize
  }
  await setCache(cacheKey, result, 600)
  return result
}

export async function getNoteById(id: number, userId: number, includeDeleted = false) {
  const cacheKey = noteDetailCacheKey(id)
  const cached = await getCache<Note>(cacheKey)
  if (cached && (includeDeleted || !cached.isDeleted)) return cached

  const where: Prisma.NoteWhereInput = { id, userId }
  if (!includeDeleted) where.isDeleted = false

  const note = await prisma.note.findFirst({
    where,
    include: {
      notebook: true,
      tags: { include: { tag: true } }
    }
  })
  if (!note) {
    throw Object.assign(new Error('笔记不存在'), { status: 404 })
  }
  const result = mapNoteTags(note)
  await setCache(cacheKey, result, 1800)
  return result
}

async function createNoteCore(userId: number, data: CreateNoteDto, isDraft: boolean): Promise<Note> {
  const validTagIds = await ensureTags(userId, data.tagIds)

  const note = await prisma.note.create({
    data: {
      title: data.title || (isDraft ? '无标题草稿' : '无标题'),
      content: data.content,
      contentType: data.contentType || NOTE_CONTENT_TYPE.MARKDOWN,
      userId,
      notebookId: data.notebookId ?? null,
      isDraft,
      tags: {
        create: validTagIds.map((tagId) => ({ tag: { connect: { id: tagId } } }))
      }
    },
    include: {
      notebook: true,
      tags: { include: { tag: true } }
    }
  })

  await clearNoteCache(userId)
  return mapNoteTags(note)
}

export async function createNote(userId: number, data: CreateNoteDto) {
  return createNoteCore(userId, data, data.isDraft ?? false)
}

export async function createDraft(userId: number, data: CreateNoteDto) {
  return createNoteCore(userId, data, true)
}

export async function updateNote(id: number, userId: number, data: UpdateNoteDto) {
  const exists = await prisma.note.findFirst({ where: { id, userId } })
  if (!exists) {
    throw Object.assign(new Error('笔记不存在'), { status: 404 })
  }

  const validTagIds = data.tagIds !== undefined ? await ensureTags(userId, data.tagIds) : undefined

  const note = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (validTagIds) {
      await tx.noteTag.deleteMany({ where: { noteId: id } })
      if (validTagIds.length > 0) {
        await tx.noteTag.createMany({
          data: validTagIds.map((tagId) => ({ noteId: id, tagId }))
        })
      }
    }

    return tx.note.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        contentType: data.contentType,
        notebookId: data.notebookId !== undefined ? data.notebookId ?? null : undefined,
        isDraft: data.isDraft
      },
      include: {
        notebook: true,
        tags: { include: { tag: true } }
      }
    })
  })

  await clearNoteCache(userId, id)
  return mapNoteTags(note)
}

export async function deleteNote(id: number, userId: number) {
  const exists = await prisma.note.findFirst({ where: { id, userId } })
  if (!exists) {
    throw Object.assign(new Error('笔记不存在'), { status: 404 })
  }

  const note = await prisma.note.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
    include: {
      notebook: true,
      tags: { include: { tag: true } }
    }
  })

  await clearNoteCache(userId, id)
  return mapNoteTags(note)
}

export async function restoreNote(id: number, userId: number) {
  const note = await prisma.note.findFirst({ where: { id, userId, isDeleted: true } })
  if (!note) {
    throw Object.assign(new Error('笔记不存在或不在回收站'), { status: 404 })
  }

  const restored = await prisma.note.update({
    where: { id },
    data: { isDeleted: false, deletedAt: null },
    include: {
      notebook: true,
      tags: { include: { tag: true } }
    }
  })

  await clearNoteCache(userId, id)
  return mapNoteTags(restored)
}

export async function permanentDeleteNote(id: number, userId: number) {
  const exists = await prisma.note.findFirst({ where: { id, userId, isDeleted: true } })
  if (!exists) {
    throw Object.assign(new Error('笔记不存在或不在回收站'), { status: 404 })
  }

  await prisma.$transaction([
    prisma.noteTag.deleteMany({ where: { noteId: id } }),
    prisma.note.delete({ where: { id } })
  ])

  await clearNoteCache(userId, id)
}

export async function emptyTrash(userId: number) {
  const notes = await prisma.note.findMany({
    where: { userId, isDeleted: true },
    select: { id: true }
  })

  const ids = notes.map((n) => n.id)
  if (ids.length === 0) return 0

  await prisma.$transaction([
    prisma.noteTag.deleteMany({ where: { noteId: { in: ids } } }),
    prisma.note.deleteMany({ where: { userId, isDeleted: true } })
  ])

  await clearNoteCache(userId)
  return ids.length
}

export async function cleanupOldTrash(days = 30) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const notes = await prisma.note.findMany({
    where: {
      isDeleted: true,
      deletedAt: { lt: cutoff }
    },
    select: { id: true, userId: true }
  })

  const ids = notes.map((n) => n.id)
  if (ids.length === 0) return 0

  const userIds = [...new Set(notes.map((n) => n.userId))]

  await prisma.$transaction([
    prisma.noteTag.deleteMany({ where: { noteId: { in: ids } } }),
    prisma.note.deleteMany({ where: { id: { in: ids } } })
  ])

  await Promise.all(userIds.map((uid) => clearNoteCache(uid)))
  return ids.length
}

export async function saveDraft(
  id: number | null,
  userId: number,
  data: UpdateNoteDto
) {
  if (!id) {
    return createDraft(userId, data as CreateNoteDto)
  }
  return updateNote(id, userId, { ...data, isDraft: true })
}
