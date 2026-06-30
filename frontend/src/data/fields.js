import { db } from '../lib/db.js'

export async function getAllFields() {
  return db.fields.toArray()
}

export async function getFieldById(id) {
  return db.fields.get(id)
}

export async function putField(field) {
  return db.fields.put(field)
}

export async function bulkPutFields(fields) {
  return db.fields.bulkPut(fields)
}
