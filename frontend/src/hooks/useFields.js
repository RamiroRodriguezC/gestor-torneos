import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db.js'

export function useFields() {
  return useLiveQuery(() => db.fields.toArray(), [], [])
}

export function useField(id) {
  return useLiveQuery(() => (id ? db.fields.get(id) : null), [id], null)
}
