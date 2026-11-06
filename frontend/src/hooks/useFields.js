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
    async () => {
      if (!tournamentId) return []
      // 1. Canchas con tournamentId directo
      const direct = await db.fields
        .where('tournamentId')
        .equals(tournamentId)
        .filter((f) => !f.isDeleted)
        .toArray()

      // 2. Canchas referenciadas en los partidos de este torneo
      const matches = await db.matches
        .where('tournamentId')
        .equals(tournamentId)
        .filter((m) => !m.isDeleted)
        .toArray()

      const matchFieldIds = new Set(matches.map((m) => m.field?.fieldId).filter(Boolean))
      const directIds = new Set(direct.map((f) => f._id))
      const extraFields = []

      for (const fId of matchFieldIds) {
        if (!directIds.has(fId)) {
          const f = await db.fields.get(fId)
          if (f && !f.isDeleted) {
            extraFields.push({ ...f, tournamentId })
          }
        }
      }

      return [...direct, ...extraFields]
    },
    [tournamentId],
    []
  )
}
