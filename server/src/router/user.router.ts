import Router from '@koa/router'
import { register, login, getCurrentUser } from '@/controller/user.controller'

const router = new Router()

router.post('/user/register', register)
router.post('/user/login', login)
router.get('/user/me', getCurrentUser)

export default router
