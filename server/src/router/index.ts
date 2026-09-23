import Router from '@koa/router'
import userRouter from './user.router'
import noteRouter from './note.router'
import notebookRouter from './notebook.router'
import tagRouter from './tag.router'

const router = new Router({ prefix: '/api' })

router.get('/health', (ctx) => {
  ctx.success('ok')
})

router.use(userRouter.routes(), userRouter.allowedMethods())
router.use(notebookRouter.routes(), notebookRouter.allowedMethods())
router.use(tagRouter.routes(), tagRouter.allowedMethods())
router.use(noteRouter.routes(), noteRouter.allowedMethods())

export default router
