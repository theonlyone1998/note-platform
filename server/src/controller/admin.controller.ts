import type { Context } from 'koa'
import { z } from 'zod'
import { generateToken } from '@/utils/jwt'
import { ensureAdminUser } from '@/utils/admin'
import {
  deleteUser,
  getDashboardStats,
  getUserById,
  listUsers,
  loginAdmin,
  resetUserPassword,
  updateUserStatus
} from '@/service/admin.service'

const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空')
})

export async function adminLogin(ctx: Context) {
  await ensureAdminUser()

  const parsed = loginSchema.safeParse(ctx.request.body)
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join('; ')
    throw Object.assign(new Error(message), { status: 400 })
  }

  const user = await loginAdmin(parsed.data.email, parsed.data.password)
  const token = generateToken({ userId: user.id, email: user.email })
  ctx.success({ token, user })
}

export async function adminGetCurrentUser(ctx: Context) {
  const userId = ctx.state.user.userId as number
  const user = await getUserById(userId)
  ctx.success(user)
}

export async function adminListUsers(ctx: Context) {
  const query = ctx.query as Record<string, string>
  const result = await listUsers({
    page: query.page ? Number(query.page) : undefined,
    pageSize: query.pageSize ? Number(query.pageSize) : undefined,
    keyword: query.keyword
  })
  ctx.success(result)
}

export async function adminGetUser(ctx: Context) {
  const id = Number(ctx.params.id)
  const user = await getUserById(id)
  ctx.success(user)
}

const statusSchema = z.object({
  isActive: z.boolean()
})

export async function adminUpdateUserStatus(ctx: Context) {
  const id = Number(ctx.params.id)
  const parsed = statusSchema.safeParse(ctx.request.body)
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join('; ')
    throw Object.assign(new Error(message), { status: 400 })
  }

  const user = await updateUserStatus(id, parsed.data.isActive)
  ctx.success(user)
}

export async function adminResetUserPassword(ctx: Context) {
  const id = Number(ctx.params.id)
  const user = await resetUserPassword(id)
  ctx.success(user)
}

export async function adminDeleteUser(ctx: Context) {
  const id = Number(ctx.params.id)
  await deleteUser(id)
  ctx.success({ id })
}

export async function adminGetDashboardStats(ctx: Context) {
  const stats = await getDashboardStats()
  ctx.success(stats)
}
