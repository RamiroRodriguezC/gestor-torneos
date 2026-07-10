import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db.js'

export function useAuth() {
  const userId = localStorage.getItem('currentUserId')
  const user = useLiveQuery(() => (userId ? db.users.get(userId) : null), [userId])
  return { user, isLoggedIn: !!userId }
}
