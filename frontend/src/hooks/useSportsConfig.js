import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db.js'

export function useSports() {
  return useLiveQuery(() => db.sportsConfig.toArray(), [], [])
}

export function useSport(id) {
  return useLiveQuery(() => db.sportsConfig.get(id), [id], null)
}

export function useSportByName(name) {
  return useLiveQuery(() => db.sportsConfig.where('name').equals(name).first(), [name], null)
}
