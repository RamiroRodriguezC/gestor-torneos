import { db } from '../lib/db.js'

const API = process.env.API_BASE_URL;

async function fetchAndPut(endpoint, table) {
  const res = await fetch(`${API}/${endpoint}`)
  if (!res.ok) {
    console.warn(`⚠️  ${endpoint} — ${res.status} ${res.statusText}, se saltea`)
    return
  }
  const json = await res.json()
  const docs = json.data ?? json
  const arr = Array.isArray(docs) ? docs : [docs]
  if (arr.length === 0) return
  await db[table].bulkPut(arr)
  console.log(`✅ ${table}: ${arr.length} documentos`)
}

export async function seedDexie() {
  const seeded = localStorage.getItem('dexie-seeded')
  if (seeded === 'true') return

  console.log('🌱 Sembrando Dexie desde API...')

  await fetchAndPut('sports', 'sportsConfig')
  await fetchAndPut('teams', 'teams')
  await fetchAndPut('tournaments', 'tournaments')
  await fetchAndPut('matches', 'matches')
  await fetchAndPut('fields', 'fields')
  await fetchAndPut('users', 'users')

  localStorage.setItem('dexie-seeded', 'true')
  console.log('🌱 Seed completado')
}
