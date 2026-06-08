/**
 * Descarga la config como JSON.
 */
export function exportConfig(config, filename = 'itop-dashboard.json') {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Lee un archivo JSON y parsea la config.
 * Devuelve una promesa con el objeto o lanza error.
 */
export function importConfig(file) {
  return new Promise((resolve, reject) => {
    if (!file || file.type !== 'application/json') {
      reject(new Error('Debe ser un archivo .json'))
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result)
        if (!config || !config.version) {
          reject(new Error('Config inválida: falta version'))
          return
        }
        resolve(config)
      } catch {
        reject(new Error('Archivo JSON inválido'))
      }
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsText(file)
  })
}
