import cron, { type ScheduledTask } from 'node-cron'
import { cleanupOldTrash } from '@/service/note.service'

let task: ScheduledTask | null = null

export function startTrashCleanupSchedule() {
  if (task) return

  task = cron.schedule('0 2 * * *', async () => {
    try {
      const count = await cleanupOldTrash(30)
      console.log(`[trash cleanup] removed ${count} expired notes`)
    } catch (err) {
      console.error('[trash cleanup] failed', err)
    }
  }, {
    timezone: 'Asia/Shanghai'
  })

  console.log('[trash cleanup] scheduled daily at 02:00 Asia/Shanghai')
}

export function stopTrashCleanupSchedule() {
  if (task) {
    task.stop()
    task = null
    console.log('[trash cleanup] stopped')
  }
}
