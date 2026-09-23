import dotenv from 'dotenv'
import { existsSync } from 'fs'
import { resolve } from 'path'

const envPath = existsSync(resolve(process.cwd(), '.env'))
  ? resolve(process.cwd(), '.env')
  : resolve(__dirname, '../../.env')
dotenv.config({ path: envPath, override: true })

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'mysql://note_user:note_pass@localhost:3306/note_platform',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '7d') as `${number}d` | number
}
