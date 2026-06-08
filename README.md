# iTOP Monitor

> Dashboard autogestionable + APIs livianas para iTOP.
>
> Una alternativa visual al iTOP tradicional: armá dashboards con KPIs,
> gráficos de flujo, tablas de rendimiento y tortas de distribución,
> todo configurable sin tocar código.

![screenshot](https://img.shields.io/badge/status-en%20desarrollo-yellow)
![Python](https://img.shields.io/badge/python-3.12-blue)
![Node](https://img.shields.io/badge/node-22-green)

---

## ¿Por qué existe?

iTOP tiene su propia interfaz, pero si necesitás:

- **Métricas rápidas** sin navegar mil pantallas
- **Dashboards personalizados** por equipo, agente o período
- **Gráficos de evolución** (nuevos, resueltos, pendientes día por día)
- **Tablas de rendimiento** con eficiencia calculada
- **Varias vistas** intercambiables sin cambiar la configuración del sistema

...iTOP Monitor es una capa liviana que se conecta vía REST API, cachea los datos y te deja armar tu propio panel.

---

## TL;DR

```bash
git clone https://github.com/orlinefoster/itop-monitor.git
cd itop-monitor

# Backend
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# EDITAR .env con tu URL de iTOP y usuario
python store_password.py   # guarda la password cifrada
uvicorn main:app --reload

# Frontend (otra terminal)
cd frontend
npm install
npm run dev
```

Abrí `http://localhost:5173` y empezá a armar dashboards.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Python + FastAPI + httpx |
| Cache | SQLite (actualización en background cada 30s) |
| Frontend | React + Vite + Recharts |
| Auth | Windows Credential Manager (DPAPI) |
| Fuente | iTOP REST/JSON API (v1.4) |

---

## Configuración

### 1. Archivo `.env`

Copiá el template y completá:

```bash
cp .env.example .env
```

| Variable | Descripción |
|----------|-------------|
| `ITOP_URL` | URL del webservice REST de iTOP (ej: `https://itop.miempresa.com/webservices/rest.php`) |
| `ITOP_USER` | Usuario con perfil "REST Services User" en iTOP |
| `ITOP_PASSWORD_SECRET` | Solo para dev — mejor usar el Credential Manager (ver abajo) |
| `AGENT_ID` | Tu ID de agente en iTOP (opcional, auto-descubrible) |
| `AGENT_NAME` | Tu nombre visible en el dashboard |

### 2. Windows Credential Manager (recomendado)

En vez de poner la contraseña en texto plano en `.env`, guardala cifrada con el sistema operativo:

```bash
python store_password.py
# Te va a pedir la contraseña por teclado (no se muestra al escribir)
```

Esto la almacena con DPAPI — solo tu usuario de Windows puede desencriptarla.

### 3. Probar conexión

```bash
curl http://localhost:8000/api/health
# → {"status":"ok","version":"0.1.0"}

curl http://localhost:8000/api/dashboard
# → datos del dashboard (puede tardar ~30s la primera vez)
```

---

## Endpoints de la API

| Endpoint | Devuelve |
|----------|----------|
| `GET /api/dashboard` | Dashboard principal (tickets activos, equipo, vencidos) |
| `GET /api/weekly` | Resumen semanal: KPIs + desglose por agente |
| `GET /api/flow` | Timeline diario: nuevos, resueltos, pendientes por grupo |
| `GET /api/filters` | Organizaciones, equipos y agentes disponibles |
| `GET /api/health` | Health check del backend |

Todos los endpoints aceptan filtros: `org_id`, `team_id`, `agent_id`, `date_from`, `date_to`.

---

## Dashboards

El frontend incluye un **builder visual** de dashboards:

- **Solapas** — creá todas las que quieras
- **Widgets** — KPI, gráfico mixto, líneas, barras, área, torta, tabla
- **Presets** — plantillas listas para usar (flujo semanal, resumen de tickets, rendimiento de agentes, etc.)
- **Personalización** — colores, títulos, altos, series, endpoints
- **Persistencia** — la configuración se guarda en localStorage del navegador
- **Export/Import** — llevate tu dashboard a otro navegador como JSON

### Widgets disponibles

| Widget | Qué muestra |
|--------|-------------|
| KPI | Número grande con label, color y subtítulo |
| Gráfico mixto | Barras apiladas + líneas (ideal para flujo diario) |
| Líneas | Una o más series en el tiempo |
| Barras | Comparación entre categorías |
| Área | Evolución con volumen |
| Torta / Dona | Distribución (pendientes por grupo, etc.) |
| Tabla | Datos en filas/columnas con totales |

---

## Wiki integrada

¿No sabés qué endpoint usar o qué campo poner? En la app, clickeá el botón **`?`** en la barra superior:

- Endpoints disponibles y sus campos
- Sintaxis de field paths (`days[last].pending_by_team`, `total_active`, etc.)
- Qué endpoint/field usar para cada tipo de widget
- Armado de columnas para tablas

---

## Estructura del proyecto

```
itop-monitor/
├── backend/
│   ├── main.py              # API endpoints
│   ├── itop_client.py       # Cliente REST iTOP
│   ├── config.py            # Config desde .env + Credential Manager
│   ├── credential.py        # Almacenamiento seguro de contraseñas
│   ├── store_password.py    # Script para guardar password en WCM
│   ├── database.py          # Cache SQLite
│   ├── models.py            # Pydantic models
│   └── .env.example         # Template de configuración
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # App principal con tabs y filtros
│   │   ├── api.js           # Cliente HTTP para la API
│   │   ├── components/      # Componentes del sistema (tickets, agentes)
│   │   ├── dashboard/       # Builder de dashboards
│   │   │   ├── DashboardBuilder.jsx
│   │   │   ├── DashboardContext.jsx
│   │   │   ├── WidgetConfigPanel.jsx
│   │   │   ├── SeriesEditor.jsx
│   │   │   ├── WidgetTypeSelector.jsx
│   │   │   ├── WikiModal.jsx
│   │   │   ├── presets.js
│   │   │   ├── defaults/
│   │   │   ├── lib/
│   │   │   ├── persistence/
│   │   │   └── widgets/     # KPI, charts, table
│   │   └── styles/          # Tema Lain Dark
│   └── package.json
└── README.md
```

---

## Licencia

Uso interno / educativo. No redistribuir sin permiso.
