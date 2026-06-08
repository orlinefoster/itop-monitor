const STORAGE_KEY = 'itop-dashboard-config'

/**
 * Carga la config desde localStorage.
 * Si no existe, devuelve null.
 */
export function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Guarda la config en localStorage.
 */
export function saveConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (e) {
    console.warn('Failed to save dashboard config:', e)
  }
}

/**
 * Elimina la config guardada.
 */
export function clearConfig() {
  localStorage.removeItem(STORAGE_KEY)
}
