import Koa from 'koa'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import logger from 'koa-logger'
import { errorMiddleware } from './middleware/error'
import { responseMiddleware } from './middleware/response'
import { authMiddleware } from './middleware/auth'
import router from './router'
import adminRouter from './router/admin.router'

const app = new Koa()

app.use(errorMiddleware)
app.use(responseMiddleware)
app.use(cors())
app.use(bodyParser())
if (process.env.NODE_ENV !== 'test') {
  app.use(logger())
}
app.use(authMiddleware)
router.use('/admin', adminRouter.routes(), adminRouter.allowedMethods())
app.use(router.routes()).use(router.allowedMethods())

export default app
