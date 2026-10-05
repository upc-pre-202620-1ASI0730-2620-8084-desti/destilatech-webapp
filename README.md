# Destilatech Web Application

Web Application de **Destilatech** (startup **FuturosSeniors**), plataforma SaaS B2B para el ecosistema peruano del pisco:
monitoreo IoT de la producción, trazabilidad de lotes, inventario, pedidos, alertas y estimaciones de reposición para
**productores** y **comercializadores**.

Curso: Aplicaciones Web (1ASI0730) — UPC, ciclo 2026-20.

- Reporte: [destilatech-report](https://github.com/upc-pre-202620-1ASI0730-2620-8084-desti/destilatech-report)
- Landing Page: [destilatech-website](https://github.com/upc-pre-202620-1ASI0730-2620-8084-desti/destilatech-website)

## Tecnologías

| Herramienta | Uso |
| :--- | :--- |
| Vue 3 (Composition API, `<script setup>`) + Vite | SPA |
| PrimeVue 5 + PrimeFlex + PrimeIcons | Componentes UI |
| Pinia | Stores de la capa de aplicación de cada bounded context |
| Vue Router | Navegación entre vistas |
| vue-i18n | Internacionalización español / inglés |
| Axios | Cliente HTTP (`BaseApi` / `BaseEndpoint`) |
| Chart.js (vía `pv-chart`) | Gráficos de monitoreo, dashboards e indicadores |
| json-server | Fake API mientras se construye la RESTful API en ASP.NET Core |

IDE recomendado: **JetBrains WebStorm**.

## Puesta en marcha

Requisitos: Node.js 20+ y npm.

```bash
npm install
```

### 1. Fake API (terminal 1)

json-server expone `http://localhost:3000/api/v1/...` a partir de `server/db.json` (`routes.json` agrega el prefijo
`/api/v1`). Todo lo que la app crea o modifica se guarda en `db.json`.

```bash
cd server
sh start.sh
```

En Windows, la terminal de WebStorm usa PowerShell, que no trae `sh`. Puedes:

- Cambiar la terminal a Git Bash: *Settings → Tools → Terminal → Shell path* = `C:\Program Files\Git\bin\bash.exe`.
- O ejecutar directamente el comando de `start.sh` dentro de `server`:

  ```bash
  npx json-server --watch db.json --routes routes.json
  ```

### 2. Web App (terminal 2)

```bash
npm run dev
```

Abre `http://localhost:5173`.

> Si aparece *"No response received from the server"*, el Fake API no está corriendo.
> Si aparece `EADDRINUSE ... 3000`, ya hay otro json-server abierto: ciérralo con `Ctrl + C` en su terminal.

## Variables de entorno

| Archivo | Se usa con | URL del API |
| :--- | :--- | :--- |
| `.env.development` | `npm run dev` | `http://localhost:3000/api/v1` (json-server local) |
| `.env.production` | `npm run build` | CRUD API de [Beeceptor](https://beeceptor.com) (`https://<endpoint>.free.beeceptor.com/api/v1`) |

Ambos archivos definen la licencia de PrimeUI (`VITE_PRIME_UI_LICENSE_KEY`) y la ruta de cada endpoint
(`VITE_*_ENDPOINT_PATH`).

## Autenticación (IAM)

El contexto IAM ya tiene sus capas completas (`SignInCommand`, `SignUpCommand`, `SignInResource`, `SignUpResource`,
assemblers, `iam.interceptor.js` y `authentication.guard.js`), pero aún **no hay un backend de autenticación**. Por ello,
igual que en el proyecto de referencia del curso:

- `router.js` no aplica el `authenticationGuard`. La app abre directamente con la cuenta de productor de `db.json`.
- `iam-api.js` emula el inicio de sesión y el registro con el recurso `/users` de json-server.

Cuando exista la RESTful API se descomentan las llamadas a `/authentication/sign-in` y `/authentication/sign-up` en
`iam-api.js`, y `return authenticationGuard(to, from);` en `router.js`.

### Cuentas de demostración

| Cuenta | Contraseña | Perfil |
| :--- | :--- | :--- |
| `productor@destilatech.pe` | `Destilatech2026` | Productor (Bodega Santa Rosa): lotes, monitoreo IoT, inventario y pedidos. |
| `comercializador@destilatech.pe` | `Destilatech2026` | Comercializador (Licorería El Cóndor): inventario, pedidos y reposición. |

Para cambiar de perfil: menú de usuario → **Cerrar sesión** → iniciar sesión con la otra cuenta. También puedes crear
una cuenta nueva desde `/sign-up`; se guarda en `db.json` con su prueba gratuita de 14 días.

## Arquitectura (Domain-Driven Design)

El frontend replica los **7 bounded contexts** definidos en el Design-Level Event Storming del reporte.
Cada uno se organiza en cuatro capas:

| Capa | Contenido |
| :--- | :--- |
| `domain/model` | Entidades, value objects, enums y commands con sus reglas de negocio. |
| `infrastructure` | Adaptadores de la API (`*-api.js`, extienden `BaseApi`) y *assemblers* (recurso ⇄ entidad). |
| `application` | Stores de Pinia: orquestan casos de uso y la comunicación entre contextos. |
| `presentation` | Vistas, componentes y rutas del contexto (`*-routes.js`). |

```
src/
├── shared/                        # Shared Kernel
│   ├── domain/model/              # DateTime, Money (value objects)
│   ├── infrastructure/            # BaseApi, BaseEndpoint, BaseAssembler, error.interceptor
│   └── presentation/              # layout, side-navigation, top-bar, language-switcher, kpi-card, page-header,
│                                  # empty-state, footer-content, page-not-found
├── iam/                           # Sign-in/sign-up, interceptor, guard, prueba gratuita, perfil
├── billing/                       # Planes, suscripción, historial de pagos, aviso de fin de prueba
├── production-monitoring/         # Lotes, etapas, variables de proceso, lecturas IoT (simulador), anomalías
├── inventory-stock/               # Productos, stock, movimientos, umbrales de stock bajo
├── orders-replenishment/          # Clientes, pedidos, reposición a proveedores
├── alerts-notifications/          # Bandeja de alertas (anomalías y stock bajo)
├── analytics-estimations/         # Dashboards por perfil, estimación de reposición, indicadores históricos
├── locales/                       # es.json, en.json
├── i18n.js · pinia.js · router.js · main.js · app.vue · style.css
server/                            # Fake API (json-server)
├── db.json                        # Datos del Fake API
├── routes.json                    # Prefijo /api/v1
└── start.sh                       # Inicia json-server (cd server && sh start.sh)
```

### Comunicación entre bounded contexts

| Policy | Origen → destino |
| :--- | :--- |
| `StartTrialOnRegistration` | IAM: al registrar la cuenta se crea la prueba de 14 días. |
| `RaiseAlertOnAnomaly` | Production → Alerts: una lectura fuera de rango genera una alerta. |
| `AddBottledStock` | Production → Inventory: al embotellar un lote se suman las botellas al producto vinculado. |
| `RaiseAlertOnLowStock` | Inventory → Alerts: stock en o bajo el umbral genera una alerta. |
| `DiscountStockOnOrder` | Orders → Inventory: registrar un pedido descuenta stock; cancelarlo lo devuelve. |
| Recepción de reposición | Orders → Inventory: recibir una reposición suma el stock. |
| Estimación de reposición | Inventory → Analytics: las estimaciones se calculan con el historial de movimientos. |

### Rutas principales

| Ruta | Vista | Perfil |
| :--- | :--- | :--- |
| `/sign-in`, `/sign-up`, `/registro` | Inicio de sesión y registro | Público |
| `/dashboard` | Dashboard Productor / Comercial | Ambos |
| `/production/monitoring` | Monitoreo IoT (simulación en vivo) | Productor |
| `/production/batches`, `/production/batches/:id` | Gestión y trazabilidad de lotes | Productor |
| `/inventory`, `/inventory/products/:id` | Inventario y ficha de producto con estimación | Ambos |
| `/orders`, `/orders/customers`, `/orders/replenishment` | Pedidos, clientes y reposición | Ambos |
| `/alerts` | Centro de alertas | Ambos |
| `/analytics/indicators` | Indicadores históricos | Ambos |
| `/billing/plans`, `/account/profile` | Suscripción y perfil | Ambos |

La Landing Page enlaza a `/registro?plan=basico|profesional|empresarial`, que abre el registro con el plan preseleccionado.

## Build de producción

```bash
npm run build
```

Genera la carpeta `dist/` (`index.html` y `assets/`) usando `.env.production`.

## Convenciones

- Código, commits y nombres en inglés; textos de interfaz siempre por i18n (`src/locales`).
- Archivos en `kebab-case` (`batch-detail.vue`, `inventory.store.js`); componentes PrimeVue registrados con prefijo `pv-`.
- Git Flow: `main`, `develop`, `feature/*`. Commits con Conventional Commits (`feat(inventory): ...`).
