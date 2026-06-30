import { db } from '../lib/db.js'

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
