if (__filename.endsWith('.js')) {
  require('module-alias/register')
}
import app from './app'
import { config } from './config'
import { startTrashCleanupSchedule, stopTrashCleanupSchedule } from './schedule/trashCleanup'

const PORT = config.port

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
  startTrashCleanupSchedule()
})

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  stopTrashCleanupSchedule()
  server.close(() => {
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  stopTrashCleanupSchedule()
  server.close(() => {
    process.exit(0)
  })
})
