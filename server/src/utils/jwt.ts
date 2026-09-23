import jwt from 'jsonwebtoken'
import { config } from '@/config'
import type { JwtPayload } from '@/types'

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn })
}
