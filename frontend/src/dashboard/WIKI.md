# 📖 Wiki del Dashboard — iTOP Monitor

## Endpoints disponibles

| Endpoint | Qué devuelve | Parámetros de filtro |
|----------|-------------|----------------------|
| `/api/weekly` | Resumen semanal: KPIs + agentes | `org_id`, `team_id`, `agent_id`, `date_from`, `date_to` |
| `/api/flow` | Timeline diario: nuevos, resueltos, pendientes por grupo | `org_id`, `team_id`, `agent_id`, `date_from`, `date_to` |
| `/api/dashboard` | Dashboard principal (mi Panel, activos, vencidos) | _(ninguno)_ |
| `/api/filters` | Organizaciones, equipos y agentes disponibles | `org_id`, `team_id` |

> Todos los endpoints aceptan los mismos filtros y se pasan automáticamente desde la barra de filtros.

---

## `/api/weekly` — Estructura completa

```json
{
  "week_start": "2026-06-01",
  "week_end": "2026-06-07",
  "new_tickets": 42,         ← tickets creados en el período
  "open_tickets": 15,        ← tickets abiertos (sin resolver)
  "resolved_tickets": 38,    ← tickets resueltos en el período
  "total_active": 127,       ← tickets activos en total
  "agents": [                ← desglose por agente
    {
      "agent_id": "12",
      "agent_name": "Fulanito",
      "new_assigned": 10,
      "resolved": 8,
      "total_active": 25
    }
  ]
}
```

### Campos alcanzables desde un widget KPI

| Field | Tipo | Qué muestra |
|-------|------|-------------|
| `new_tickets` | número | Creados en el período |
| `open_tickets` | número | Sin resolver |
| `resolved_tickets` | número | Resueltos en el período |
| `total_active` | número | Total activos en curso |
| `agents` | array | Lista de agentes (para tabla) |

---

## `/api/flow` — Estructura completa

```json
{
  "days": [
    {
      "date": "2026-06-01",
      "new": 12,                     ← tickets nuevos ese día
      "resolved": 9,                 ← resueltos ese día
      "pending": 45,                 ← pendientes acumulados
      "pending_by_team": {           ← pendientes por grupo
        "12": 15,                    ←   team_id → cantidad
        "7": 20,
        "3": 10
      }
    }
  ],
  "starting_pending": 30,           ← pendientes al inicio del período
  "teams": {                         ← mapa de team_id → nombre
    "12": "Soporte Técnico",
    "7": "Infraestructura",
    "3": "Desarrollo"
  }
}
```

### Campos alcanzables

| Field | Tipo | Qué muestra |
|-------|------|-------------|
| `days` | array | Un objeto por día |
| `days[last]` | objeto | El último día del array |
| `days[last].pending_by_team` | dict | `{team_id: cantidad}` del último día |
| `days[0]` | objeto | El primer día |
| `starting_pending` | número | Pendientes al arrancar el período |
| `teams` | dict | `{team_id: "nombre del equipo"}` |

---

## Sintaxis de field paths

Los widgets usan un **resolver de paths** para navegar dentro de la respuesta JSON.

| Sintaxis | Significado | Ejemplo |
|----------|-------------|---------|
| `campo` | Acceso directo a propiedad | `total_active` → `127` |
| `objeto.campo` | Anidado con punto | _(no hay ejemplo actual)_ |
| `array[campo]` | No soportado | — |
| `array[last]` | Último elemento del array | `days[last]` → el último `FlowDay` |
| `array[0]` | Primer elemento (índice) | `days[0]` → el primer `FlowDay` |
| `array[last].campo` | Campo del último elemento | `days[last].pending_by_team` → `{"12": 15, ...}` |

### Ejemplos de field paths funcionando

```text
new_tickets              → 42                                  (de /api/weekly)
total_active             → 127                                 (de /api/weekly)
agents                   → [ {...}, {...} ]                    (de /api/weekly, para tabla)
days                     → [ {...}, {...} ]                    (de /api/flow, para chart)
days[last]               → { fecha, new, resolved, pending }   (de /api/flow)
days[last].pending_by_team → { "12": 15, "7": 20 }             (de /api/flow, dict)
days[0].new              → 12                                  (primer día, nuevos)
```

---

## Widgets y qué esperan

### KPI
- **Endpoint**: `/api/weekly` (recomendado)
- **Field**: un campo numérico como `new_tickets`, `total_active`
- Muestra el **valor** del campo en grande

### Tabla
- **Endpoint**: `/api/weekly` (recomendado)
- **Field**: `agents` (el array de agentes)
- **Columnas**: cada columna apunta a un campo del objeto agente:
  - `agent_name`, `new_assigned`, `resolved`, `total_active`

### Gráfico mixto (ComposedChart)
- **Endpoint**: `/api/flow` (recomendado)
- **Field**: `days` (el array de días)
- **Barras**: `pending_by_team` se expande automáticamente a una barra apilada por equipo
- **Líneas**: `new`, `resolved`
- **X axis**: `date`

### Gráfico de líneas / barras / área
- **Endpoint**: `/api/flow` o `/api/weekly`
- **Field**: `days` (para flow) o un array
- **Series**: cada serie tiene `{ field, name, color }`
  - Para flow: `new`, `resolved`, `pending`
  - Para weekly: no hay array directo (no recomendado)
- **X axis**: `date` (para flow)

### Gráfico de torta
- **Endpoint**: `/api/flow` (recomendado)
- **Field**: `days[last].pending_by_team`
- Convierte automáticamente el dict `{team_id: count}` a porciones de torta
- **Donut**: sí por defecto

---

## Filtros automáticos

Cuando seleccionás una org, equipo o agente en la barra de filtros, todos los widgets que usen `/api/weekly` o `/api/flow` reciben automáticamente esos filtros como query params:

```
/api/weekly?org_id=5&team_id=12&agent_id=7&date_from=2026-06-01&date_to=2026-06-07
```

No necesitas configurar nada — los filtros se aplican a todos los widgets del dashboard activo.

---

## Tip: armado de columnas para tabla

Cada columna soporta estas propiedades:

```js
{
  label: "visible",        // texto del encabezado
  field: "agent_name",     // campo del objeto (o null si usás compute)
  primary: true,           // opcional: negrita
  color: "#3fb950",        // opcional: color del texto
  compute: "(row) => ..."  // opcional: función para calcular el valor
}
```

### Compute en string

Cuando el widget viene de un **preset** o de **import/export JSON**, `compute` se guarda como string (porque JSON no soporta funciones). El sistema lo convierte automáticamente a función. El formato es:

```js
compute: "(row) => { return Math.round((row.resolved / (row.new_assigned+row.resolved)) * 100) + '%' }"
```

> Usá **presets** si no querés pensar en esto ;)
