import { db } from '../lib/db.js'
import { apiFetch } from '../utils/apiFetch.js'

export async function getUserById(id) {
  return db.users.get(id)
}

export async function getUserByEmail(email) {
  return db.users.where('email').equals(email).first()
}

export async function putUser(user) {
  const safe = { ...user }
  delete safe.hashedPassword
  return db.users.put(safe)
}

export async function bulkPutUsers(users) {
  const safe = users.map(({ hashedPassword: _, ...rest }) => rest)
  return db.users.bulkPut(safe)
}

export async function getUsersByIds(ids) {
  if (!ids || ids.length === 0) return []
  return db.users.where('_id').anyOf(ids).toArray()
}

export async function removeUser(id) {
  return db.users.delete(id)
}

export async function updateUserProfile(userId, updateData) {
  const json = await apiFetch(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  })
  const updated = json.data ?? json
  if (updated) {
    await putUser(updated)
  }
  return updated
}

