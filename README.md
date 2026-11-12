# Destilatech Web Application

Web Application de **Destilatech** (startup **FuturosSeniors**), plataforma SaaS B2B para el ecosistema peruano del pisco:
monitoreo IoT de la producción, trazabilidad de lotes, inventario, pedidos, alertas y estimaciones de reposición para
**productores** y **comercializadores**.

Curso: Aplicaciones Web (1ASI0730) — UPC, ciclo 2026-20.

- Reporte: [destilatech-report](https://github.com/upc-pre-202620-1ASI0730-2620-8084-desti/destilatech-report)
- Landing Page: [destilatech-website](https://github.com/upc-pre-202620-1ASI0730-2620-8084-desti/destilatech-website)
- RESTful API: [destilatech-platform](https://github.com/upc-pre-202620-1ASI0730-2620-8084-desti/destilatech-platform)

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
| destilatech-platform (ASP.NET Core) | RESTful API que consume la app desde la v2.1.0 |
| json-server | Fake API de las versiones anteriores (se mantiene para pruebas sin backend) |

IDE recomendado: **JetBrains WebStorm**.

## Puesta en marcha

Requisitos: Node.js 20+ y npm.

```bash
npm install
```

### 1. RESTful API (terminal 1)

La app consume la RESTful API **destilatech-platform**. Clónala y ejecútala como indica su README (con MySQL o con
`docker compose up -d --build`). Debe responder en `http://localhost:5273/api/v1`.

La primera vez, carga los datos de demostración de `server/db.json` en la API (productos, lotes, lecturas, clientes,
pedidos y reposiciones). El script usa los endpoints de la API, así que las reglas del backend se aplican igual que en la
app; si una cuenta ya tiene productos, no la vuelve a cargar:

```bash
npm run seed-api
```

### 2. Web App (terminal 2)

```bash
npm run dev
```

Abre `http://localhost:5173`.

> Si aparece *"No response received from the server"*, la API no está corriendo en el puerto 5273.

### Sin backend (Fake API)

Para probar la interfaz sin la API se puede seguir usando json-server: `npm run fake-api` y, en `.env.development`,
`VITE_DESTILATECH_API_URL=http://localhost:3000/api/v1`. Desde la v2.1.0 la lógica de negocio (stock, alertas,
pagos) la resuelve la API, así que con el Fake API esas acciones no se reflejan igual.

## Variables de entorno

| Archivo | Se usa con | URL del API |
| :--- | :--- | :--- |
| `.env.development` | `npm run dev` | `http://localhost:5273/api/v1` (destilatech-platform local) |
| `.env.production` | `npm run build` | `https://destilatech-platform.onrender.com/api/v1` (destilatech-platform en Render) |

Ambos archivos definen la licencia de PrimeUI (`VITE_PRIME_UI_LICENSE_KEY`) y la ruta de cada endpoint
(`VITE_*_ENDPOINT_PATH`).

## Despliegue

| Parte | Servicio | URL |
| :--- | :--- | :--- |
| Web App | Firebase Hosting | https://destilatech-webapp.web.app |
| RESTful API | Render (Docker) | https://destilatech-platform.onrender.com/scalar |
| Base de datos | Railway (MySQL) | — |

Para publicar una nueva versión de la Web App:

```bash
npm run build
firebase deploy
```

Para cargar los datos de demostración en la API desplegada (solo una vez):

```bash
npm run seed-api -- https://destilatech-platform.onrender.com/api/v1
```

> El plan gratuito de Render apaga la API cuando no se usa: la primera petición puede tardar ~1 minuto.

## Pagos (Stripe Checkout)

La suscripción se paga con **Stripe Checkout en modo de prueba**:

1. Al elegir un plan, la app pide a la API una sesión de pago (`POST /checkout-sessions`) y abre la página de Stripe.
2. Al pagar, Stripe regresa a `/billing/checkout/success?session_id=...`; la app confirma la sesión
   (`POST /checkout-sessions/{id}/confirmation`) y la API registra el pago, activa la suscripción y extiende el acceso.
3. Si el usuario cancela, Stripe regresa a `/billing/checkout/cancelled`.

No se realiza ningún cobro real. Para probar se usa la tarjeta `4242 4242 4242 4242` con cualquier fecha futura y
cualquier CVC. La clave de Stripe solo vive en la API (variables de entorno), nunca en la Web App.

## Usuarios (sin IAM en este sprint)

El inicio de sesión y el registro (bounded context **IAM**) no forman parte de este sprint. Mientras tanto, la app trabaja
con los usuarios de la API y se cambia de uno a otro con los botones **Productor / Comercializador** de la barra
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
├── billing/                       # Planes, suscripción, pago con Stripe Checkout, historial de pagos, aviso de fin de prueba
├── production-monitoring/         # Lotes, etapas, variables de proceso, lecturas IoT (simulador), anomalías
├── inventory-stock/               # Productos, stock, movimientos, umbrales de stock bajo
├── orders-replenishment/          # Clientes, pedidos, reposición a proveedores
├── alerts-notifications/          # Bandeja de alertas (anomalías y stock bajo)
├── analytics-estimations/         # Dashboards por perfil, estimación de reposición, indicadores históricos
├── locales/                       # es.json, en.json
├── i18n.js · pinia.js · router.js · main.js · app.vue · style.css
server/                            # Datos de demostración y Fake API (json-server)
├── db.json                        # Datos del Fake API y de npm run seed-api
├── seed-platform.js               # Carga db.json en la RESTful API (npm run seed-api)
├── routes.json                    # Prefijo /api/v1
└── start.sh                       # Inicia json-server (alternativa a npm run fake-api)
```

### Comunicación entre bounded contexts

Desde la v2.1.0 estas reglas se ejecutan en la API (destilatech-platform); la Web App solo vuelve a leer los datos
afectados después de cada acción.

| Regla | Origen → destino |
| :--- | :--- |
| Alerta por anomalía | Production → Alerts: una lectura fuera de rango genera una alerta. |
| Stock embotellado | Production → Inventory: al embotellar un lote se suman las botellas al producto vinculado. |
| Alerta por stock bajo | Inventory → Alerts: stock en o bajo el umbral genera una alerta. |
| Descuento por pedido | Orders → Inventory: registrar un pedido descuenta stock; cancelarlo lo devuelve. |
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
| `/billing/checkout/success`, `/billing/checkout/cancelled` | Regreso desde Stripe Checkout | Ambos |

### Exportar a CSV

Pedidos, clientes, inventario e indicadores históricos tienen el botón **Exportar CSV**, que descarga lo que se ve en la
tabla (con los filtros aplicados). El archivo usa `;` como separador y UTF-8 con BOM para abrirse bien en Excel.

## Versiones

| Versión | Entrega | Cambios principales |
| :--- | :--- | :--- |
| v1.0.0 | TB1 | Primera versión: 6 bounded contexts, dashboards por perfil, Fake API y despliegue en Firebase. |
| v2.0.0 | AV2 | Pago simulado en lugar de Stripe, marcar todas las alertas como atendidas, exportación a CSV, datos de prueba en inglés y script `npm run fake-api`. |
| v2.1.0 | AV2 | Conexión con la RESTful API destilatech-platform (Render + MySQL en Railway), pago con Stripe Checkout y script `npm run seed-api`. |

## Build de producción

```bash
npm run build
```

Genera la carpeta `dist/` (`index.html` y `assets/`) usando `.env.production`.

## Convenciones

- Código, commits y nombres en inglés; textos de interfaz siempre por i18n (`src/locales`).
- Archivos en `kebab-case` (`batch-detail.vue`, `inventory.store.js`); componentes PrimeVue registrados con prefijo `pv-`.
- Git Flow: `main`, `develop`, `feature/*`. Commits con Conventional Commits (`feat(inventory): ...`).
