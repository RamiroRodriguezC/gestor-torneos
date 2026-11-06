import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db.js'

export function useFields() {
  return useLiveQuery(() => db.fields.filter((f) => !f.isDeleted).toArray(), [], [])
}

export function useField(id) {
  return useLiveQuery(() => (id ? db.fields.get(id) : null), [id], null)
}

export function useFieldsByTournament(tournamentId) {
  return useLiveQuery(
    () => {
      if (!tournamentId) return []
      return db.fields
        .where('tournamentId')
        .equals(tournamentId)
        .filter((f) => !f.isDeleted)
        .toArray()
    },
    [tournamentId],
    []
  )
}
