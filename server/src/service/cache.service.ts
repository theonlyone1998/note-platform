import { delCache, getRedis } from '@/utils/redis'

export function noteCacheKey(userId: number, options: Record<string, unknown> = {}) {
  const suffix = Object.entries(options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v ?? 'null'}`)
    .join(':')
  return suffix ? `notes:${userId}:${suffix}` : `notes:${userId}`
}

export function noteDetailCacheKey(id: number) {
  return `note:${id}`
}

export function adminNotesCacheKey(params: Record<string, unknown>) {
  const suffix = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v ?? 'all'}`)
    .join(':')
  return `admin:notes:${suffix}`
}

export function adminNoteCacheKey(id: number) {
  return `admin:note:${id}`
}

async function scanAndDelete(match: string) {
  const redis = getRedis()
  const stream = redis.scanStream({ match })
  const keysToDelete: string[] = []
  stream.on('data', (keys: string[]) => {
    if (keys.length) keysToDelete.push(...keys)
  })
  await new Promise<void>((resolve, reject) => {
    stream.on('end', resolve)
    stream.on('error', reject)
  })
  if (keysToDelete.length) await redis.del(...keysToDelete)
}

/**
 * 清除普通用户笔记缓存，同时级联清除后台笔记缓存
 * @param userId 笔记所属用户 ID
 * @param noteId 被操作的笔记 ID（可选）
 */
export async function clearNoteCache(userId: number, noteId?: number) {
  await scanAndDelete(`notes:${userId}:*`)
  await delCache(noteCacheKey(userId))
  if (noteId) {
    await delCache(noteDetailCacheKey(noteId))
    await delCache(adminNoteCacheKey(noteId))
  }
  await scanAndDelete('admin:notes:*')
}

/**
 * 清除后台笔记缓存，同时级联清除影响用户的普通笔记缓存
 * @param noteId 被操作的笔记 ID（可选）
 * @param userId 笔记所属用户 ID（可选）
 */
export async function clearAdminNoteCache(noteId?: number, userId?: number) {
  await scanAndDelete('admin:notes:*')
  if (noteId) await delCache(adminNoteCacheKey(noteId))
  if (userId) {
    await scanAndDelete(`notes:${userId}:*`)
    await delCache(noteCacheKey(userId))
    if (noteId) await delCache(noteDetailCacheKey(noteId))
  }
}
