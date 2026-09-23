import Router from '@koa/router'
import { adminAuthMiddleware } from '@/middleware/adminAuth'
import {
  adminDeleteUser,
  adminGetCurrentUser,
  adminGetDashboardStats,
  adminGetUser,
  adminListUsers,
  adminLogin,
  adminResetUserPassword,
  adminUpdateUserStatus
} from '@/controller/admin.controller'
import {
  adminGetNote,
  adminHardDeleteNote,
  adminListNotes,
  adminToggleNoteTrash,
  adminUpdateNote
} from '@/controller/adminNote.controller'

const router = new Router()

// Public within admin scope
router.post('/login', adminLogin)

// Protected admin routes
router.use(adminAuthMiddleware)

router.get('/me', adminGetCurrentUser)
router.get('/dashboard/stats', adminGetDashboardStats)

router.get('/users', adminListUsers)
router.get('/users/:id', adminGetUser)
router.patch('/users/:id/status', adminUpdateUserStatus)
router.patch('/users/:id/reset-password', adminResetUserPassword)
router.delete('/users/:id', adminDeleteUser)

router.get('/notes', adminListNotes)
router.get('/notes/:id', adminGetNote)
router.patch('/notes/:id', adminUpdateNote)
router.patch('/notes/:id/trash', adminToggleNoteTrash)
router.delete('/notes/:id', adminHardDeleteNote)

export default router
