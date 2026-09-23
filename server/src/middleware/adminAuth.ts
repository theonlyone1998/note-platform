import type { Context, Next } from 'koa'
import jwt from 'jsonwebtoken'
import { prisma } from '@/utils/prisma'
import { config } from '@/config'
import type { JwtPayload } from '@/types'

export async function adminAuthMiddleware(ctx: Context, next: Next) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    return ctx.fail('未提供认证令牌', 401)
  }

  const token = authHeader.replace('Bearer ', '')
  let decoded: JwtPayload
  try {
    decoded = jwt.verify(token, config.jwtSecret) as JwtPayload
  } catch {
    return ctx.fail('认证失败', 401)
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, role: true, isActive: true }
  })

  if (!user || user.role !== 'admin') {
    return ctx.fail('需要管理员权限', 403)
  }
  if (!user.isActive) {
    return ctx.fail('管理员账号已被禁用', 403)
  }

  ctx.state.user = decoded
  await next()
}
