import type { Context, Next } from 'koa'

export async function errorMiddleware(ctx: Context, next: Next) {
  try {
    await next()
  } catch (err) {
    const error = err as Error
    const status = (error as any).status || 500
    ctx.status = status
    ctx.body = {
      code: status,
      data: null,
      msg: error.message || 'Internal Server Error'
    }
    if (status === 500) {
      console.error(error)
    }
  }
}
