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
npm run fake-api
```

Funciona igual en PowerShell, Git Bash o la terminal de WebStorm. También se puede iniciar con `cd server` y
`sh start.sh` (solo en Git Bash).

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
| `.env.production` | `npm run build` | `https://destilatech-api.onrender.com/api/v1` (json-server publicado en Render) |

Ambos archivos definen la licencia de PrimeUI (`VITE_PRIME_UI_LICENSE_KEY`) y la ruta de cada endpoint
(`VITE_*_ENDPOINT_PATH`).

## Despliegue

| Parte | Servicio | URL |
| :--- | :--- | :--- |
| Web App | Firebase Hosting | https://destilatech-webapp.web.app |
| Fake API | Render | https://destilatech-api.onrender.com/api/v1 |

Para publicar una nueva versión de la Web App:

```bash
npm run build
firebase deploy
```

> El plan gratuito de Render apaga el Fake API cuando no se usa: la primera petición puede tardar ~1 minuto.

## Pagos (simulados)

La suscripción se paga con un **pago simulado**: al elegir un plan se abre un formulario de tarjeta que valida el número
(algoritmo de Luhn), la fecha de vencimiento y el CVC, y registra el pago y la suscripción en el Fake API. No se realiza
ningún cobro real y solo se guarda la marca y los 4 últimos dígitos de la tarjeta. Para probar se puede usar la tarjeta
`4242 4242 4242 4242` con cualquier fecha futura y cualquier CVC.

La integración con una pasarela real (Stripe) se implementa en el backend (`destilatech-platform`), no en la Web App.

## Usuarios (sin IAM en este sprint)

El inicio de sesión y el registro (bounded context **IAM**) no forman parte de este sprint. Mientras tanto, la app trabaja
con los usuarios de `db.json` y se cambia de uno a otro con los botones **Productor / Comercializador** de la barra
superior. El usuario elegido se recuerda al recargar la página.

| Botón | Usuario | Qué ve |
| :--- | :--- | :--- |
| Productor | Mario Fernández · Bodega Santa Rosa | Lotes, monitoreo IoT, inventario, pedidos, alertas e indicadores. |
| Comercializador | Carlos Mendoza · Licorería El Cóndor | Inventario, pedidos, clientes, reposición, alertas e indicadores. |

El usuario actual vive en `src/shared/application/user.store.js` y se carga desde `/users` con
`src/shared/infrastructure/users-api.js`.

## Arquitectura (Domain-Driven Design)

El reporte define **7 bounded contexts** en el Design-Level Event Storming; en este sprint se implementan 6 (IAM queda
para un sprint posterior). Cada uno se organiza en cuatro capas:

| Capa | Contenido |
| :--- | :--- |
| `domain/model` | Entidades, value objects, enums y commands con sus reglas de negocio. |
| `infrastructure` | Adaptadores de la API (`*-api.js`, extienden `BaseApi`) y *assemblers* (recurso ⇄ entidad). |
| `application` | Stores de Pinia: orquestan casos de uso y la comunicación entre contextos. |
| `presentation` | Vistas, componentes y rutas del contexto (`*-routes.js`). |

```
src/
├── shared/                        # Shared Kernel
│   ├── domain/model/              # DateTime, Money (value objects), User, TrialPeriod, BusinessType
│   ├── application/               # user.store (usuario actual)
│   ├── infrastructure/            # BaseApi, BaseEndpoint, BaseAssembler, error.interceptor, users-api, user.assembler,
│   │                              # csv-exporter
│   └── presentation/              # layout, side-navigation, top-bar, user-switcher, language-switcher, kpi-card, page-header,
│                                  # empty-state, footer-content, page-not-found
├── billing/                       # Planes, suscripción, pago simulado, historial de pagos, aviso de fin de prueba
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
└── start.sh                       # Inicia json-server (alternativa a npm run fake-api)
```

### Comunicación entre bounded contexts

| Policy | Origen → destino |
| :--- | :--- |
| `RaiseAlertOnAnomaly` | Production → Alerts: una lectura fuera de rango genera una alerta. |
| `AddBottledStock` | Production → Inventory: al embotellar un lote se suman las botellas al producto vinculado. |
| `RaiseAlertOnLowStock` | Inventory → Alerts: stock en o bajo el umbral genera una alerta. |
| `DiscountStockOnOrder` | Orders → Inventory: registrar un pedido descuenta stock; cancelarlo lo devuelve. |
| Recepción de reposición | Orders → Inventory: recibir una reposición suma el stock. |
| Estimación de reposición | Inventory → Analytics: las estimaciones se calculan con el historial de movimientos. |

### Rutas principales

| Ruta | Vista | Perfil |
| :--- | :--- | :--- |
| `/dashboard` | Dashboard Productor / Comercial | Ambos |
| `/production/monitoring` | Monitoreo IoT (simulación en vivo) | Productor |
| `/production/batches`, `/production/batches/:id` | Gestión y trazabilidad de lotes | Productor |
| `/inventory`, `/inventory/products/:id` | Inventario y ficha de producto con estimación | Ambos |
| `/orders`, `/orders/customers`, `/orders/replenishment` | Pedidos, clientes y reposición | Ambos |
| `/alerts` | Centro de alertas | Ambos |
| `/analytics/indicators` | Indicadores históricos | Ambos |
| `/billing/plans` | Suscripción | Ambos |

### Exportar a CSV

Pedidos, clientes, inventario e indicadores históricos tienen el botón **Exportar CSV**, que descarga lo que se ve en la
tabla (con los filtros aplicados). El archivo usa `;` como separador y UTF-8 con BOM para abrirse bien en Excel.

## Versiones

| Versión | Entrega | Cambios principales |
| :--- | :--- | :--- |
| v1.0.0 | TB1 | Primera versión: 6 bounded contexts, dashboards por perfil, Fake API y despliegue en Firebase. |
| v1.1.0 | AV2 | Pago simulado en lugar de Stripe, marcar todas las alertas como atendidas, exportación a CSV, datos de prueba en inglés y script `npm run fake-api`. |

## Build de producción

```bash
npm run build
```

Genera la carpeta `dist/` (`index.html` y `assets/`) usando `.env.production`.

## Convenciones

- Código, commits y nombres en inglés; textos de interfaz siempre por i18n (`src/locales`).
- Archivos en `kebab-case` (`batch-detail.vue`, `inventory.store.js`); componentes PrimeVue registrados con prefijo `pv-`.
- Git Flow: `main`, `develop`, `feature/*`. Commits con Conventional Commits (`feat(inventory): ...`).
