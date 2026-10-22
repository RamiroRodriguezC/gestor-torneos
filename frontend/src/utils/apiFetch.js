import { getApiBaseUrl } from './env.js'
import { getToken, logout } from '../data/auth.js'

const API = getApiBaseUrl()

// Wrapper de fetch que adjunta el JWT en cada request.
// Si el backend responde 401 o 403 (token ausente, inválido o expirado), cierra la sesión y redirige al login.
export async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API}${path}`, { ...options, headers })

  const json = await res.json().catch(() => ({}))

  const isAuthError =
    res.status === 401 ||
    (res.status === 403 &&
      (json.error?.type === 'FORBIDDEN' ||
        json.error?.message?.toLowerCase().includes('token') ||
        json.error?.toLowerCase?.()?.includes('token')))

  if (isAuthError) {
    logout()
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
    throw new Error('La sesión expiró. Volvé a iniciar sesión.')
  }

  if (!res.ok) {
    throw new Error(json.error?.message || json.error || `HTTP ${res.status}`)
  }
  return json
}
