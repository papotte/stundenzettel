import { getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { NextRequest } from 'next/server'

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

export interface AuthenticatedUser {
  uid: string
  email: string | null
}

export async function verifyAuthToken(
  request: NextRequest,
): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.split('Bearer ')[1]
    if (!token) {
      return null
    }

    const decodedToken = await getAuth().verifyIdToken(token)
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
    }
  } catch (error) {
    console.error('Error verifying auth token:', error)
    return null
  }
}

export function createUnauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}
