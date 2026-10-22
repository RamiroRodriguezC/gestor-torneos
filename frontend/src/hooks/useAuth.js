import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db.js'

function isTokenExpired(token) {
  if (!token) return true
  try {
    const payloadBase64 = token.split('.')[1]
    if (!payloadBase64) return true
    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(payloadJson)
    if (!payload.exp) return false
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

export function useAuth() {
  const token = localStorage.getItem('token')
  const userId = localStorage.getItem('currentUserId')
  const tokenExpired = isTokenExpired(token)

  if (token && tokenExpired) {
    localStorage.removeItem('token')
    localStorage.removeItem('currentUserId')
  }

  const effectiveUserId = tokenExpired ? null : userId
  const user = useLiveQuery(() => (effectiveUserId ? db.users.get(effectiveUserId) : null), [effectiveUserId])

  return { user, isLoggedIn: !!(effectiveUserId && !tokenExpired) }
}
