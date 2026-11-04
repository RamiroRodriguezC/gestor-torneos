import { db } from '../lib/db.js'
import { apiFetch } from '../utils/apiFetch.js'

export async function getAllSports() {
  return db.sportsConfig.toArray()
}

export async function getSportById(id) {
  return db.sportsConfig.get(id)
}

export async function getSportByName(name) {
  return db.sportsConfig.where('name').equals(name).first()
}

export async function putSport(sport) {
  return db.sportsConfig.put(sport)
}

export async function bulkPutSports(sports) {
  return db.sportsConfig.bulkPut(sports)
}

export async function syncSports() {
  try {
    const json = await apiFetch('/sports')
    const sports = json.data ?? json
    if (Array.isArray(sports) && sports.length > 0) {
      await bulkPutSports(sports)
      return sports
    }
  } catch (err) {
    console.warn('[sportsConfig] No se pudieron sincronizar los deportes:', err.message)
  }
  return []
}

