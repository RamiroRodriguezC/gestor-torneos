const mode = import.meta.env.VITE_APP_MODE || 'local_test'

export function getApiBaseUrl() {
  return import.meta.env[`VITE_API_BASE_URL_${mode.toUpperCase()}`]
}
