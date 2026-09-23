import Router from '@koa/router'
import {
  createNotebook,
  deleteNotebook,
  getNotebooks,
  updateNotebook
} from '@/controller/notebook.controller'

const router = new Router()

router.get('/notebook', getNotebooks)
router.post('/notebook', createNotebook)
router.put('/notebook/:id', updateNotebook)
router.delete('/notebook/:id', deleteNotebook)

export default router