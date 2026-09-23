import { delCache, getCache, setCache } from '@/utils/redis'
import { prisma } from '@/utils/prisma'
import { hashPassword, comparePassword } from '@/utils/hash'
import type { LoginDto, RegisterDto } from '@/types'

export function userProfileCacheKey(userId: number) {
  return `user:profile:${userId}`
}

export async function registerUser(data: RegisterDto) {
  const exists = await prisma.user.findUnique({ where: { email: data.email } })
  if (exists) {
    throw Object.assign(new Error('邮箱已被注册'), { status: 409 })
  }

  const password = await hashPassword(data.password)
  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      password
    },
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
      updatedAt: true
    }
  })
  return user
}

export async function loginUser(data: LoginDto) {
  const user = await prisma.user.findUnique({ where: { email: data.email } })
  if (!user) {
    throw Object.assign(new Error('用户不存在'), { status: 404 })
  }

  const valid = await comparePassword(data.password, user.password)
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

export async function findUserById(userId: number) {
  const cacheKey = userProfileCacheKey(userId)
  const cached = await getCache<{
    id: number
    email: string
    username: string
    createdAt: Date
    updatedAt: Date
  }>(cacheKey)
  if (cached) return cached

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
      updatedAt: true
    }
  })
  if (!user) {
    throw Object.assign(new Error('用户不存在'), { status: 404 })
  }
  await setCache(cacheKey, user, 1800)
  return user
}
