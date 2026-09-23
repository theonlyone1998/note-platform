import type { Context } from 'koa'
import { z } from 'zod'
import { registerUser, loginUser, findUserById } from '@/service/user.service'
import { generateToken } from '@/utils/jwt'
import type { LoginDto } from '@/types'

const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  username: z.string().min(2, '用户名至少 2 个字符').max(20, '用户名最多 20 个字符'),
  password: z.string().min(6, '密码至少 6 个字符').max(32, '密码最多 32 个字符')
})

export async function register(ctx: Context) {
  const parsed = registerSchema.safeParse(ctx.request.body)
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join('; ')
    throw Object.assign(new Error(message), { status: 400 })
  }
  const user = await registerUser(parsed.data)
  const token = generateToken({ userId: user.id, email: user.email })
  ctx.success({ token, user })
}

export async function login(ctx: Context) {
  const body = ctx.request.body as LoginDto
  const user = await loginUser(body)
  const token = generateToken({ userId: user.id, email: user.email })
  ctx.success({ token, user })
}

export async function getCurrentUser(ctx: Context) {
  const userId = ctx.state.user.userId as number
  const user = await findUserById(userId)
  ctx.success(user)
}
