import { putUser } from './users.js'

export async function login(email, password) {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error('Credenciales inválidas')

  const { usuario, token } = await res.json()
  localStorage.setItem('token', token)
  localStorage.setItem('currentUserId', usuario.id)
  await putUser({ _id: usuario.id, ...usuario })
  return usuario
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('currentUserId')
}

export function getToken() {
  return localStorage.getItem('token')
}

export function getCurrentUserId() {
  return localStorage.getItem('currentUserId')
}
