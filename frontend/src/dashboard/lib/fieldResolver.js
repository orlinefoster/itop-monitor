/**
 * Navega un path como "team_stats.total_pending" dentro de un objeto.
 * Soporta índices de array con "last": "days[last].pending_by_team"
 */
export function fieldResolver(data, path) {
  if (!data || !path) return undefined

  const parts = path.split('.')
  let current = data

  for (const part of parts) {
    if (current == null) return undefined

    // ¿Tiene acceso a array con [last]?
    const arrMatch = part.match(/^(\w+)\[last\]$/)
    if (arrMatch) {
      const arr = current[arrMatch[1]]
      if (!Array.isArray(arr) || arr.length === 0) return undefined
      current = arr[arr.length - 1]
      continue
    }

    const bracketMatch = part.match(/^(\w+)\[(\d+)\]$/)
    if (bracketMatch) {
      const arr = current[bracketMatch[1]]
      if (!Array.isArray(arr)) return undefined
      current = arr[parseInt(bracketMatch[2], 10)]
      continue
    }

    current = current[part]
  }

  return current
}
