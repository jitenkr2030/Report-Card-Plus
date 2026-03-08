import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string
    email: string
    role: string
    name: string
  }
}

export async function authenticate(request: NextRequest): Promise<AuthenticatedRequest | null> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const payload = verifyToken(token)

  if (!payload) {
    return null
  }

  // Add user info to request
  const authenticatedRequest = request as AuthenticatedRequest
  authenticatedRequest.user = payload

  return authenticatedRequest
}

export function requireRole(allowedRoles: string[]) {
  return (request: AuthenticatedRequest): boolean => {
    if (!request.user) {
      return false
    }

    return allowedRoles.includes(request.user.role)
  }
}