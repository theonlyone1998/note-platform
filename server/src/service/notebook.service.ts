import { delCache, getCache, setCache } from '@/utils/redis'
import { prisma } from '@/utils/prisma'
import { clearNoteCache } from './note.service'
import type { Notebook } from '@shared/types'

function notebookCacheKey(userId: number) {
  return `notebooks:${userId}`
}

export async function getNotebooks(userId: number): Promise<Notebook[]> {
  const cacheKey = notebookCacheKey(userId)
  const cached = await getCache<Notebook[]>(cacheKey)
  if (cached) return cached

  const notebooks = await prisma.notebook.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' }
  })
  await setCache(cacheKey, notebooks, 600)
  return notebooks
}

export async function createNotebook(userId: number, name: string): Promise<Notebook> {
  try {
    const notebook = await prisma.notebook.create({
      data: { name, userId }
    })
    await delCache(notebookCacheKey(userId))
    return notebook
  } catch (err: any) {
    if (err.code === 'P2002') {
      throw Object.assign(new Error('同名笔记本已存在'), { status: 409 })
    }
    throw err
  }
}

export async function updateNotebook(id: number, userId: number, name: string): Promise<Notebook> {
  const exists = await prisma.notebook.findFirst({ where: { id, userId } })
  if (!exists) {
    throw Object.assign(new Error('笔记本不存在'), { status: 404 })
  }

  try {
    const notebook = await prisma.notebook.update({
      where: { id },
      data: { name }
    })
    await delCache(notebookCacheKey(userId))
    await clearNoteCache(userId)
    return notebook
  } catch (err: any) {
    if (err.code === 'P2002') {
      throw Object.assign(new Error('同名笔记本已存在'), { status: 409 })
    }
    throw err
  }
}

export async function deleteNotebook(id: number, userId: number): Promise<void> {
  const exists = await prisma.notebook.findFirst({ where: { id, userId } })
  if (!exists) {
    throw Object.assign(new Error('笔记本不存在'), { status: 404 })
  }

  await prisma.$transaction([
    prisma.note.updateMany({
      where: { notebookId: id, userId },
      data: { notebookId: null }
    }),
    prisma.notebook.delete({ where: { id } })
  ])
  await delCache(notebookCacheKey(userId))
  await clearNoteCache(userId)
}
