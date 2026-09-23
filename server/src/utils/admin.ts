import { prisma } from '@/utils/prisma'
import { hashPassword } from '@/utils/hash'

const ADMIN_EMAIL = 'admin@zhijian.local'
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = '123456'

export async function ensureAdminUser() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } })
  if (existing) return existing

  return prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      password: await hashPassword(ADMIN_PASSWORD),
      role: 'admin',
      isActive: true
    },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  })
}
