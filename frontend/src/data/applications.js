import { db } from '../lib/db.js'

export async function getApplicationById(id) {
  return db.applications.get(id)
}

export async function getApplicationsByTournament(tournamentId) {
  return db.applications
    .where('tournamentId')
    .equals(tournamentId)
    .toArray()
}

export async function getApplicationsByApplicant(userId) {
  return db.applications
    .where('applicantId')
    .equals(userId)
    .toArray()
}

export async function getApplicationsByParticipant(participantId) {
  return db.applications
    .where('participantId')
    .equals(participantId)
    .toArray()
}

export async function getApplicationsByStatus(status) {
  return db.applications
    .where('status')
    .equals(status)
    .toArray()
}

export async function putApplication(application) {
  return db.applications.put(application)
}

export async function bulkPutApplications(applications) {
  return db.applications.bulkPut(applications)
}

export async function removeApplication(id) {
  return db.applications.delete(id)
}
