import { db } from '../lib/db.js'

export async function getAllTeams() {
  return db.teams.toArray()
}

export async function getTeamById(id) {
  return db.teams.get(id)
}

export async function getTeamsByDiscipline(sportConfigId) {
  return db.teams.where('discipline').equals(sportConfigId).toArray()
}

export async function getTeamsByCaptain(userId) {
  return db.teams.where('capitanId').equals(userId).toArray()
}

export async function putTeam(team) {
  return db.teams.put(team)
}

export async function bulkPutTeams(teams) {
  return db.teams.bulkPut(teams)
}

export async function removeTeam(id) {
  return db.teams.delete(id)
}
