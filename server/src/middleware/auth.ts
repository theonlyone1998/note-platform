import jwt from 'jsonwebtoken'
import type { Context, Next } from 'koa'
import { config } from '@/config'
import type { JwtPayload } from '@/types'

const PUBLIC_PATHS = ['/api/user/register', '/api/user/login', '/api/admin/login', '/api/health']

export async function authMiddleware(ctx: Context, next: Next) {
  if (!ctx.path.startsWith('/api') || PUBLIC_PATHS.includes(ctx.path)) {
    return next()
  }

  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    return ctx.fail('未提供认证令牌', 401)
  }

  const token = authHeader.replace('Bearer ', '')
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload
    ctx.state.user = decoded
    await next()
  } catch {
    ctx.fail('认证失败', 401)
  }
}
