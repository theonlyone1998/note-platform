import type { Context, Next } from 'koa'

export interface ResponseBody<T = unknown> {
  code: number
  data: T
  msg: string
}

export async function responseMiddleware(ctx: Context, next: Next) {
  ctx.success = function <T>(data: T, msg = 'success') {
    this.body = {
      code: 200,
      data,
      msg
    }
  }

  ctx.fail = function (msg: string, code = 400) {
    this.status = code
    this.body = {
      code,
      data: null,
      msg
    }
  }

  await next()
}

declare module 'koa' {
  interface BaseContext {
    success<T>(data: T, msg?: string): void
    fail(msg: string, code?: number): void
  }
}
