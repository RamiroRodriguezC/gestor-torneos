import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db.js'

export function useFields() {
  return useLiveQuery(() => db.fields.toArray(), [], [])
}

export function useField(id) {
  return useLiveQuery(() => db.fields.get(id), [id], null)
}
