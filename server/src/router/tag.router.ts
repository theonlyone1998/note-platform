import Router from '@koa/router'
import {
  createTag,
  deleteTag,
  getTags,
  updateTag
} from '@/controller/tag.controller'

const router = new Router()

router.get('/tag', getTags)
router.post('/tag', createTag)
router.put('/tag/:id', updateTag)
router.delete('/tag/:id', deleteTag)

export default router