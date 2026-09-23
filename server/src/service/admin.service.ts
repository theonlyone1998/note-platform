import { delCache, getCache, getRedis, setCache } from '@/utils/redis'
import { prisma } from '@/utils/prisma'
import { userProfileCacheKey } from './user.service'
import { comparePassword, hashPassword } from '@/utils/hash'

function adminUsersCacheKey(params: Record<string, unknown>) {
  const suffix = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v ?? 'all'}`)
    .join(':')
  return `admin:users:${suffix}`
}

function adminUserCacheKey(id: number) {
  return `admin:user:${id}`
}

function adminDashboardStatsCacheKey() {
  return 'admin:dashboard:stats'
}

export async function loginAdmin(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.role !== 'admin') {
    throw Object.assign(new Error('管理员账号不存在'), { status: 404 })
  }
  if (!user.isActive) {
    throw Object.assign(new Error('管理员账号已被禁用'), { status: 403 })
  }

  const valid = await comparePassword(password, user.password)
  if (!valid) {
    throw Object.assign(new Error('密码错误'), { status: 401 })
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    isActive: user.isActive
  }
}

interface ListUsersParams {
  page?: number
  pageSize?: number
  keyword?: string
}

async function clearAdminUserCache(userId: number) {
  await delCache(adminUserCacheKey(userId))
  await delCache(userProfileCacheKey(userId))
  const redis = getRedis()
  const stream = redis.scanStream({ match: 'admin:users:*' })
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

export async function listUsers(params: ListUsersParams) {
  const page = Math.max(1, params.page || 1)
  const pageSize = Math.min(50, Math.max(1, params.pageSize || 10))
  const cacheParams = { page, pageSize, keyword: params.keyword || 'all' }
  const cacheKey = adminUsersCacheKey(cacheParams)
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
      { username: { contains: params.keyword } },
      { email: { contains: params.keyword } }
    ]
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { notes: true, notebooks: true, tags: true } }
      }
    }),
    prisma.user.count({ where })
  ])

  const result = { items, total, page, pageSize }
  await setCache(cacheKey, result, 300)
  return result
}

export async function getUserById(id: number) {
  const cacheKey = adminUserCacheKey(id)
  const cached = await getCache(cacheKey)
  if (cached) return cached

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { notes: true, notebooks: true, tags: true } }
    }
  })
  if (!user) throw Object.assign(new Error('用户不存在'), { status: 404 })
  await setCache(cacheKey, user, 1800)
  return user
}

export async function getDashboardStats() {
  const cacheKey = adminDashboardStatsCacheKey()
  const cached = await getCache<{
    totalUsers: number
    totalNotes: number
    totalDrafts: number
    totalTrash: number
  }>(cacheKey)
  if (cached) return cached

  const [totalUsers, totalNotes, totalDrafts, totalTrash] = await Promise.all([
    prisma.user.count(),
    prisma.note.count({ where: { isDeleted: false } }),
    prisma.note.count({ where: { isDeleted: false, isDraft: true } }),
    prisma.note.count({ where: { isDeleted: true } })
  ])
  const result = { totalUsers, totalNotes, totalDrafts, totalTrash }
  await setCache(cacheKey, result, 30)
  return result
}

export async function updateUserStatus(id: number, isActive: boolean) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw Object.assign(new Error('用户不存在'), { status: 404 })
  if (user.role === 'admin') {
    throw Object.assign(new Error('不能禁用管理员账号'), { status: 403 })
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  })
  await clearAdminUserCache(id)
  return updated
}

export async function resetUserPassword(id: number) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw Object.assign(new Error('用户不存在'), { status: 404 })
  if (user.role === 'admin') {
    throw Object.assign(new Error('不能重置管理员密码'), { status: 403 })
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { password: await hashPassword('123456') },
    select: { id: true, updatedAt: true }
  })
  await clearAdminUserCache(id)
  return updated
}

export async function deleteUser(id: number) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw Object.assign(new Error('用户不存在'), { status: 404 })
  if (user.role === 'admin') {
    throw Object.assign(new Error('不能删除管理员账号'), { status: 403 })
  }

  await prisma.user.delete({ where: { id } })
  await clearAdminUserCache(id)
  await delCache(adminDashboardStatsCacheKey())
  return { id }
}
