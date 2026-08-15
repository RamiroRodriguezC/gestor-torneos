import { getApiBaseUrl } from './env.js'
import { getToken, logout } from '../data/auth.js'

const API = getApiBaseUrl()

// Wrapper de fetch que adjunta el JWT en cada request.
// Si el backend responde 401 (token ausente/vencido), cierra la sesión y vuelve al login.
export async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API}${path}`, { ...options, headers })

  if (res.status === 401) {
    logout()
    window.location.href = '/login'
    throw new Error('La sesión expiró. Volvé a iniciar sesión.')
  }

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json.error?.message || json.error || `HTTP ${res.status}`)
  }
  return json
}