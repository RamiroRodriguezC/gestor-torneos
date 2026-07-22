import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db.js'

export function useUser(id) {
  return useLiveQuery(() => (id ? db.users.get(id) : null), [id], null)
}

export function useUserByEmail(email) {
  return useLiveQuery(() => db.users.where('email').equals(email).first(), [email], null)
}

export function useUsersByIds(ids) {
  return useLiveQuery(() => {
    if (!ids || ids.length === 0) return []
    return db.users.where('_id').anyOf(ids).toArray()
  }, [ids], [])
}
