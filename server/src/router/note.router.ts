import Router from '@koa/router'
import {
  createNote,
  deleteNote,
  emptyTrash,
  getNoteById,
  getNotes,
  getTrashNotes,
  permanentDeleteNote,
  restoreNote,
  saveDraft,
  updateNote
} from '@/controller/note.controller'

const router = new Router()

router.get('/note', getNotes)
router.get('/note/trash', getTrashNotes)
router.post('/note', createNote)
router.put('/note/:id', updateNote)
router.delete('/note/:id/empty-trash', emptyTrash)
router.put('/note/:id/draft', saveDraft)
router.put('/note/:id/restore', restoreNote)
router.delete('/note/:id/permanent', permanentDeleteNote)
router.delete('/note/:id', deleteNote)
router.get('/note/:id', getNoteById)

export default router
