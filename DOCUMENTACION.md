# KanBia — Documentación integral del proyecto

Documento de revisión completo de **KanBia**, una aplicación web de gestión ágil de proyectos con tablero Kanban, jerarquía de trabajo Scrum (Proyectos → Épicas → Historias → Tareas), sistema de roles RBAC, calendario de eventos personal y panel de analíticas.

El sistema es una aplicación monorepo compuesta por dos partes:

- **Backend** (`server/`) — API REST con Node.js, Express y MongoDB.
- **Frontend** (`client/`) — SPA con React 19 + Vite.

---

## Índice

1. [Visión general](#1-visión-general)
2. [Arquitectura del sistema](#2-arquitectura-del-sistema)
3. [Backend — API REST](#3-backend--api-rest)
   - 3.1 [Stack tecnológico](#31-stack-tecnológico)
   - 3.2 [Estructura del proyecto](#32-estructura-del-proyecto)
   - 3.3 [Modelos de datos](#33-modelos-de-datos)
   - 3.4 [Endpoints de la API](#34-endpoints-de-la-api)
   - 3.5 [Autenticación y autorización](#35-autenticación-y-autorización)
   - 3.6 [Middlewares](#36-middlewares)
   - 3.7 [Seed y configuración](#37-seed-y-configuración)
4. [Frontend — SPA en React](#4-frontend--spa-en-react)
   - 4.1 [Stack tecnológico](#41-stack-tecnológico)
   - 4.2 [Estructura del proyecto](#42-estructura-del-proyecto)
   - 4.3 [Routing y navegación](#43-routing-y-navegación)
   - 4.4 [Páginas principales](#44-páginas-principales)
   - 4.5 [Componentes reutilizables](#45-componentes-reutilizables)
   - 4.6 [Estado global y autenticación](#46-estado-global-y-autenticación)
   - 4.7 [Servicios y cliente HTTP](#47-servicios-y-cliente-http)
   - 4.8 [Estilos y tema](#48-estilos-y-tema)
5. [Instalación y puesta en marcha](#5-instalación-y-puesta-en-marcha)
6. [Variables de entorno](#6-variables-de-entorno)
7. [Despliegue en producción](#7-despliegue-en-producción)
8. [Roles y permisos](#8-roles-y-permisos)
9. [Funcionalidades implementadas](#9-funcionalidades-implementadas)
10. [Glosario y decisiones de diseño](#10-glosario-y-decisiones-de-diseño)

---

## 1. Visión general

**KanBia** es una herramienta de gestión de proyectos ágiles que modela el trabajo en una jerarquía de cuatro niveles inspirada en metodologías Scrum:

```
Proyecto
   └─ Épica
        └─ Historia de Usuario
             └─ Tarea
```

Cada nivel tiene CRUD completo y se navega de forma anidada en el frontend. Las tareas se gestionan mediante un **tablero Kanban** con arrastre entre columnas (drag-and-drop). El sistema incluye un **calendario de eventos** personal y un **panel de analíticas** con gráficos.

El sistema implementa cuatro roles con permisos diferenciados (RBAC):

| Rol | Capacidades clave |
|-----|------------------|
| `admin` | Control total: gestión de usuarios, proyectos, épicas, historias y tareas. Puede crear/eliminar proyectos y gestionar miembros. |
| `scrum_master` | Crea y gestiona épicas, historias y tareas. Puede actualizar estado de tareas. |
| `developer` | Puede mover sus propias tareas en el Kanban. Ve solo las historias y tareas que le corresponden. |
| `guest` | Acceso de solo lectura. |

---

## 2. Arquitectura del sistema

El sistema sigue una arquitectura **cliente-servidor** desacoplada:

```
┌──────────────────────────┐         ┌──────────────────────────┐
│   Frontend SPA (React)   │  HTTP   │   Backend API REST       │
│   Vite + React Router    │ ◄─────► │   Express + Mongoose     │
│   axios + localStorage   │         │   JWT en Authorization   │
│   SCSS Modules           │         │   header (Bearer)        │
└──────────────────────────┘         └────────────┬─────────────┘
                                                  │
                                                  ▼
                                          ┌───────────────┐
                                          │   MongoDB     │
                                          │  (Mongoose)   │
                                          └───────────────┘
```

**Comunicación:**

- El frontend consume la API mediante **Axios** con un interceptor que inyecta el JWT en el header `Authorization: Bearer <token>` en cada request.
- El token se almacena en `localStorage` tras el login.
- Un interceptor de respuesta captura los `401` y redirige al login.
- CORS está configurado con `credentials: true` y origen definido por `CLIENT_URL` (por defecto `http://localhost:5173`).

---

## 3. Backend — API REST

### 3.1 Stack tecnológico

| Categoría | Tecnología | Versión |
|-----------|------------|---------|
| Runtime | Node.js (CommonJS) | 18+ |
| Framework HTTP | Express | ^4.18.3 |
| ODM | Mongoose | ^8.2.3 |
| Base de datos | MongoDB | 6+ recomendado |
| Autenticación | jsonwebtoken | ^9.0.2 |
| Hashing | bcryptjs | ^2.4.3 |
| CORS | cors | ^2.8.5 |
| Validación | express-validator | ^7.0.1 |
| Logging HTTP | morgan | ^1.10.0 |
| Email | nodemailer | ^6.9.13 |
| Variables env | dotenv | ^16.4.5 |
| Dev tooling | nodemon | ^3.1.0 |

### 3.2 Estructura del proyecto

```
server/
├── server.js                     # Entry point (arranca Express + conecta BD)
├── package.json
├── .env                          # Variables de entorno (no versionar)
└── src/
    ├── app.js                    # Configuración de Express (cors, routes, middleware)
    ├── database/
    │   ├── connection.js         # Conexión a MongoDB
    │   └── seed.js               # Script de datos iniciales
    ├── models/                   # Esquemas Mongoose
    │   ├── User.js
    │   ├── Project.js
    │   ├── Epic.js
    │   ├── Story.js
    │   ├── Task.js
    │   ├── Comment.js
    │   ├── Notification.js
    │   └── Event.js
    ├── controllers/              # Adaptan req/res → llaman servicios
    ├── routes/                   # Definición de endpoints
    │   ├── authRoutes.js
    │   ├── userRoutes.js
    │   ├── projectRoutes.js
    │   ├── epicRoutes.js
    │   ├── storyRoutes.js
    │   ├── taskRoutes.js
    │   ├── commentRoutes.js
    │   ├── notificationRoutes.js
    │   ├── dashboardRoutes.js
    │   └── eventRoutes.js
    ├── middlewares/
    │   ├── authMiddleware.js     # Verifica JWT Bearer
    │   ├── roleMiddleware.js     # Verifica rol del usuario
    │   ├── validationMiddleware.js
    │   ├── loggerMiddleware.js
    │   └── errorMiddleware.js   # Handler global de errores
    └── validators/               # Reglas express-validator por recurso
```

**Separación de capas (request → response):**

1. **Routes** declaran el endpoint y enlazan middlewares.
2. **Middlewares** autentican, autorizan y validan el body.
3. **Controllers** parsean `req`, llaman al servicio y serializan la respuesta.
4. **Models** representan el esquema Mongoose.
5. **errorMiddleware** centraliza la serialización de errores.

### 3.3 Modelos de datos

#### User (`models/User.js`)

```js
{
  name:                  String (required),
  email:                 String (required, unique, lowercase),
  password:              String (required, minlength: 6),  // bcrypt 12 rounds
  avatar:                String (default ''),
  role:                  'admin' | 'scrum_master' | 'developer' | 'guest' (default: 'developer'),
  isActive:              Boolean (default: true),
  resetPasswordToken:    String,
  resetPasswordExpires:  Date,
  timestamps:            createdAt, updatedAt
}
```

El hook `pre('save')` hashea la contraseña con bcrypt (12 rounds) antes de persistirla. El método `toJSON()` elimina `password`, `resetPasswordToken` y `resetPasswordExpires` de las respuestas.

#### Project (`models/Project.js`)

```js
{
  name:        String (required),
  description: String,
  startDate:   Date,
  targetDate:  Date,
  status:      'planning' | 'in_progress' | 'paused' | 'completed' (default: 'planning'),
  owner:       ObjectId (ref 'User', required),
  members:     [{ user: ObjectId (ref 'User'), role: 'admin'|'scrum_master'|'developer'|'guest' }],
  key:         String (auto-generado: primeras 4 letras del nombre en mayúsculas),
  timestamps:  createdAt, updatedAt
}
```

#### Epic (`models/Epic.js`)

```js
{
  title:       String (required),
  description: String,
  priority:    'low' | 'medium' | 'high' | 'critical' (default: 'medium'),
  status:      'backlog' | 'in_progress' | 'completed' | 'cancelled' (default: 'backlog'),
  project:     ObjectId (ref 'Project', required),
  assignee:    ObjectId (ref 'User'),
  startDate:   Date,
  endDate:     Date,
  timestamps:  createdAt, updatedAt
}
```

#### Story (`models/Story.js`)

```js
{
  title:               String (required),
  description:         String,
  acceptanceCriteria:  String,
  storyPoints:         Number (default: 0, min: 0),
  status:              'backlog' | 'in_progress' | 'review' | 'done' | 'cancelled' (default: 'backlog'),
  priority:            'low' | 'medium' | 'high' | 'critical' (default: 'medium'),
  project:             ObjectId (ref 'Project', required),
  epic:                ObjectId (ref 'Epic'),
  assignee:            ObjectId (ref 'User'),
  sprint:              Number (default: null),
  timestamps:          createdAt, updatedAt
}
```

#### Task (`models/Task.js`)

```js
{
  title:       String (required),
  description: String,
  status:      'todo' | 'in_progress' | 'review' | 'done' (default: 'todo'),
  priority:    'low' | 'medium' | 'high' | 'critical' (default: 'medium'),
  dueDate:     Date,
  project:     ObjectId (ref 'Project', required),
  story:       ObjectId (ref 'Story'),        // historia de usuario vinculada (opcional)
  epic:        ObjectId (ref 'Epic'),
  assignee:    ObjectId (ref 'User'),
  createdBy:   ObjectId (ref 'User', required),
  order:       Number (default: 0),           // orden en el kanban
  timestamps:  createdAt, updatedAt
}
```

#### Comment (`models/Comment.js`)

```js
{
  content:    String (required),
  task:       ObjectId (ref 'Task', required),
  author:     ObjectId (ref 'User', required),
  timestamps: createdAt, updatedAt
}
```

#### Notification (`models/Notification.js`)

```js
{
  message:    String (required),
  user:       ObjectId (ref 'User', required),
  read:       Boolean (default: false),
  type:       String,
  link:       String,
  timestamps: createdAt, updatedAt
}
```

#### Event (`models/Event.js`)

```js
{
  title:       String (required),
  description: String,
  date:        Date (required),
  endDate:     Date,
  color:       String (default: '#3b82f6'),
  allDay:      Boolean (default: true),
  createdBy:   ObjectId (ref 'User', required),  // privado por usuario
  timestamps:  createdAt, updatedAt
}
```

Los eventos son **privados**: el endpoint GET filtra por `createdBy: req.user._id` y las operaciones de update/delete verifican propiedad antes de operar.

### 3.4 Endpoints de la API

URL base: `/api`. Salvo indicación contraria, todos los endpoints requieren autenticación mediante `Authorization: Bearer <token>`.

#### Autenticación (`/api/auth`)

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| POST | `/api/auth/register` | No | Registro de usuario nuevo |
| POST | `/api/auth/login` | No | Login → devuelve JWT + datos de usuario |
| GET | `/api/auth/me` | Si | Devuelve el usuario autenticado |
| PUT | `/api/auth/profile` | Si | Actualiza nombre y avatar |
| PUT | `/api/auth/change-password` | Si | Cambia contraseña (requiere contraseña actual) |
| POST | `/api/auth/forgot-password` | No | Envía email con token de reset |
| POST | `/api/auth/reset-password/:token` | No | Restablece contraseña con token |

#### Usuarios (`/api/users`)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/users` | admin, scrum_master | Lista todos los usuarios |
| GET | `/api/users/:id` | admin, scrum_master | Obtiene un usuario por ID |
| PUT | `/api/users/:id` | admin | Actualiza datos de un usuario |
| DELETE | `/api/users/:id` | admin | Elimina un usuario |

#### Proyectos (`/api/projects`)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/projects` | autenticado | Lista proyectos donde el usuario es miembro u owner |
| GET | `/api/projects/:id` | autenticado | Detalle de un proyecto |
| POST | `/api/projects` | admin | Crea un nuevo proyecto |
| PUT | `/api/projects/:id` | admin | Actualiza un proyecto |
| DELETE | `/api/projects/:id` | admin | Elimina un proyecto |
| POST | `/api/projects/:id/members` | admin | Agrega un miembro al proyecto |
| DELETE | `/api/projects/:id/members/:userId` | admin | Remueve un miembro del proyecto |

#### Épicas (`/api/epics`)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/epics` | autenticado | Lista épicas (filtrables por `?projectId=`) |
| GET | `/api/epics/:id` | autenticado | Detalle de una épica |
| POST | `/api/epics` | admin, scrum_master | Crea una épica |
| PUT | `/api/epics/:id` | admin, scrum_master | Actualiza una épica |
| DELETE | `/api/epics/:id` | admin, scrum_master | Elimina una épica |

#### Historias de Usuario (`/api/stories`)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/stories` | autenticado | Lista historias (filtrables por `?projectId=`, `?epicId=`) |
| GET | `/api/stories/:id` | autenticado | Detalle de una historia |
| POST | `/api/stories` | admin, scrum_master | Crea una historia |
| PUT | `/api/stories/:id` | admin, scrum_master | Actualiza una historia |
| DELETE | `/api/stories/:id` | admin, scrum_master | Elimina una historia |

#### Tareas (`/api/tasks`)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/tasks` | autenticado | Lista tareas (filtrables por `?projectId=`, `?storyId=`, `?assignee=`) |
| GET | `/api/tasks/:id` | autenticado | Detalle de una tarea |
| POST | `/api/tasks` | admin, scrum_master | Crea una tarea |
| PUT | `/api/tasks/:id` | admin, scrum_master, developer | Actualiza una tarea |
| PATCH | `/api/tasks/:id/status` | admin, scrum_master, developer | Actualiza solo el estado (Kanban) |
| DELETE | `/api/tasks/:id` | admin, scrum_master | Elimina una tarea |

#### Comentarios (`/api/comments`)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/comments` | autenticado | Lista comentarios (filtrables por `?taskId=`) |
| POST | `/api/comments` | autenticado | Crea un comentario |
| PUT | `/api/comments/:id` | autenticado | Edita un comentario (solo el autor) |
| DELETE | `/api/comments/:id` | autenticado | Elimina un comentario |

#### Notificaciones (`/api/notifications`)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/notifications` | autenticado | Lista notificaciones del usuario autenticado |
| PUT | `/api/notifications/:id/read` | autenticado | Marca como leída |
| DELETE | `/api/notifications/:id` | autenticado | Elimina una notificación |

#### Dashboard (`/api/dashboard`)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/dashboard` | autenticado | Estadísticas generales: proyectos, tareas, historias, épicas |

#### Eventos de Calendario (`/api/events`)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/events` | autenticado | Lista eventos del usuario (filtrables por `?month=&year=`) |
| POST | `/api/events` | autenticado | Crea un evento |
| PUT | `/api/events/:id` | autenticado | Actualiza un evento (solo el dueño) |
| DELETE | `/api/events/:id` | autenticado | Elimina un evento (solo el dueño) |

#### Health check

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Devuelve `{ status: 'ok', env }` |

#### Convenciones de respuesta

- **Éxito**: `{ success: true, data: {...} }` o `{ success: true, data: [...] }`.
- **Error**: `{ success: false, message: '...' }` con status HTTP correspondiente.
- El middleware `errorMiddleware` centraliza la serialización de todos los errores no controlados.

### 3.5 Autenticación y autorización

#### Flujo de login

```
POST /api/auth/login { email, password }
        │
        ▼
  User.findOne({ email })
        │
        ▼
  user.comparePassword(password)     ← bcrypt.compare
        │
        ▼
  ¿user.isActive === true?
        │
        ▼
  jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
        │
        ▼
  Response: { token, user: { id, name, email, role, avatar } }
```

- El cliente almacena el token en `localStorage` y lo incluye en cada request vía el interceptor de Axios.
- `JWT_EXPIRES_IN` se configura por variable de entorno (default: `7d`).

#### `authMiddleware` (`middlewares/authMiddleware.js`)

Por cada request protegida:

1. Lee `Authorization: Bearer <token>` del header. Si no existe → **401**.
2. Verifica el JWT con `JWT_SECRET`. Si inválido o expirado → **401**.
3. Carga el usuario desde BD sin el campo `password`. Si no existe → **401**.
4. Si `user.isActive === false` → **401** (cuenta inactiva).
5. Inyecta `req.user` para los handlers.

#### `roleMiddleware` (`middlewares/roleMiddleware.js`)

Función de orden superior que genera middleware de autorización por rol:

```js
roleMiddleware('admin', 'scrum_master')
// → verifica que req.user.role esté en ['admin', 'scrum_master']
// → si no, responde 403
```

### 3.6 Middlewares

| Middleware | Descripción |
|-----------|-------------|
| `authMiddleware` | Verifica JWT Bearer en el header Authorization |
| `roleMiddleware` | Verifica que el rol del usuario esté en la lista permitida |
| `validationMiddleware` | Procesa los errores de `express-validator` y responde 400 si hay fallos |
| `loggerMiddleware` | Log de cada request en consola |
| `errorMiddleware` | Handler global al final de la cadena; serializa todos los errores |

### 3.7 Seed y configuración

#### Script de seed (`src/database/seed.js`)

Ejecutable con `npm run seed`. Limpia las colecciones y carga datos reproducibles:

```
Usuarios:
  admin@agileflow.dev    / admin123    (rol: admin)
  sm@agileflow.dev       / scrum123   (rol: scrum_master)
  dev@agileflow.dev      / dev12345   (rol: developer)

Proyecto: AgileFlow Platform
  - Epic: Authentication System
    - Story: User Registration
      - Task: Design registration form (done)
      - Task: Implement POST /auth/register (in_progress)
      - Task: Write unit tests (todo)
```

---

## 4. Frontend — SPA en React

### 4.1 Stack tecnológico

| Categoría | Tecnología | Versión |
|-----------|------------|---------|
| UI | React + React DOM | ^19.0.0 |
| Build | Vite | ^5.1.4 |
| Router | React Router DOM | ^6.22.3 |
| HTTP | Axios | ^1.6.7 |
| Drag & Drop | @hello-pangea/dnd | ^16.5.0 |
| Gráficos | Recharts | ^2.12.2 |
| Iconos | lucide-react | ^1.17.0 |
| Estilos | Sass (SCSS Modules) | ^1.71.1 |
| Build plugin | @vitejs/plugin-react | ^4.2.1 |

El proyecto usa `"type": "module"` en `package.json`. Estado global gestionado con **Context API** nativo (sin Redux ni Zustand).

### 4.2 Estructura del proyecto

```
client/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx                         # createRoot + providers
    ├── App.jsx                          # Router + AppRoutes
    ├── routes/
    │   ├── AppRoutes.jsx               # Definición de todas las rutas
    │   └── ProtectedRoute.jsx          # Guard de rutas autenticadas/por rol
    ├── context/
    │   ├── AuthContext.jsx             # user, token, login, logout
    │   └── ThemeContext.jsx            # theme, toggleTheme
    ├── hooks/
    │   ├── useAuth.js
    │   ├── useModal.js
    │   ├── useForm.js
    │   └── useTasks.js
    ├── services/                        # Funciones Axios por recurso
    │   ├── api.js                      # Instancia Axios + interceptores
    │   ├── authService.js
    │   ├── userService.js
    │   ├── projectService.js
    │   ├── epicService.js
    │   ├── storyService.js
    │   ├── taskService.js
    │   └── eventService.js
    ├── layouts/
    │   ├── AppLayout.jsx               # Sidebar + Navbar + <Outlet>
    │   ├── AppLayout.module.scss
    │   ├── AuthLayout.jsx              # Centrado con logo KanBia
    │   └── AuthLayout.module.scss
    ├── pages/                           # Una carpeta por página
    │   ├── Login/
    │   ├── Register/
    │   ├── Dashboard/
    │   ├── Projects/
    │   ├── ProjectDetail/
    │   ├── EpicDetail/
    │   ├── StoryDetail/
    │   ├── Profile/
    │   ├── Users/
    │   └── Calendar/
    ├── components/
    │   ├── atoms/                       # Button, Input, Modal, Badge, Avatar...
    │   ├── molecules/                   # TaskCard, StoryCard, ProjectCard...
    │   └── organisms/                  # KanbanBoard, Sidebar, Navbar, DashboardStats...
    └── styles/
        ├── global.scss
        ├── variables.scss
        └── mixins.scss
```

### 4.3 Routing y navegación

`AppRoutes.jsx` declara las rutas con `<Routes>` de React Router v6. Las rutas operativas se envuelven en `<ProtectedRoute>`:

| Ruta | Página | Acceso |
|------|--------|--------|
| `/login` | LoginPage | No autenticado |
| `/register` | RegisterPage | No autenticado |
| `/dashboard` | DashboardPage | Autenticado |
| `/projects` | ProjectsPage | Autenticado |
| `/projects/:id` | ProjectDetailPage | Autenticado |
| `/projects/:projectId/epics/:id` | EpicDetailPage | Autenticado |
| `/projects/:projectId/stories/:id` | StoryDetailPage | Autenticado |
| `/profile` | ProfilePage | Autenticado |
| `/calendar` | CalendarPage | Autenticado |
| `/users` | UsersPage | Solo `admin` |
| `/` | → redirige a `/dashboard` | — |
| `*` | → redirige a `/dashboard` | — |

`ProtectedRoute` verifica que haya un usuario autenticado en el contexto; si no, redirige a `/login`. La ruta `/users` adicionalmente restringe por rol `admin`.

### 4.4 Páginas principales

#### LoginPage / RegisterPage

Formularios de autenticación. Llaman a `authService.login()` / `authService.register()`, almacenan el token y el usuario en `AuthContext` → `localStorage`, y redirigen al dashboard.

#### DashboardPage

- Estadísticas en tarjetas: total de proyectos, épicas, historias y tareas (con iconos lucide).
- Gráficos con Recharts: distribución de tareas por estado (barras) y por prioridad (torta).
- Información obtenida del endpoint `GET /api/dashboard`.

#### ProjectsPage

- Listado de proyectos del usuario con tarjetas.
- Modal para crear proyecto (solo `admin`).
- Acciones de editar y eliminar (solo `admin`) con modal de confirmación.
- Navega a `/projects/:id` al hacer click en una tarjeta.

#### ProjectDetailPage

- Detalle del proyecto: nombre, descripción, estado, fechas, miembros.
- Lista de épicas del proyecto.
- **Tablero Kanban** de tareas filtrado por el proyecto, con columnas: `Todo`, `In Progress`, `Review`, `Done`.
- Modal para agregar y editar tareas (con campo para vincular a una historia de usuario).
- Desarrolladores pueden arrastrar solo sus propias tareas; admins y scrum masters pueden arrastrar cualquiera.
- Modal de confirmación antes de eliminar.

#### EpicDetailPage

- Detalle de la épica: título, descripción, prioridad, estado, assignee, fechas.
- Lista de historias de usuario de la épica.
- Modal para crear, editar y eliminar (con confirmación) historias.
- Navega a la historia al hacer click.

#### StoryDetailPage

- Detalle de la historia: título, descripción, criterios de aceptación, story points, estado, prioridad.
- Lista de tareas vinculadas a la historia.
  - `admin` / `scrum_master`: ven todas las tareas.
  - `developer`: ve solo las tareas asignadas a sí mismo.
- Botón para agregar tarea directamente desde la historia (admin/SM).
- Modal de confirmación para eliminar historia.
- Navega hacia atrás a la épica.

#### CalendarPage

- Calendario mensual en grilla 7×N (dom–sab).
- Navegación por meses (flechas anterior/siguiente + botón "Hoy").
- El día actual se resalta en azul.
- Los eventos se muestran como chips de color en sus días correspondientes.
- Click en un día: modal para crear nuevo evento (título, descripción, fecha, fecha de fin, color).
- Click en un evento: modal para editar o eliminar el evento (con confirmación).
- Paleta de 8 colores para personalizar los eventos.
- Eventos guardados en el backend y filtrados por mes/año.
- Los eventos son **privados** de cada usuario.

#### ProfilePage

- Muestra nombre, email, rol y avatar del usuario autenticado.
- Formulario para actualizar nombre y avatar.
- Formulario para cambiar contraseña.

#### UsersPage (solo `admin`)

- Tabla de todos los usuarios del sistema.
- Modal para crear nuevo usuario con todos sus campos.
- Acciones de editar y desactivar usuarios con confirmación modal.

### 4.5 Componentes reutilizables

#### Atoms

| Componente | Descripción |
|-----------|-------------|
| `Button` | Botón con variantes: `primary`, `secondary`, `danger`, `ghost`. |
| `Input` | Input controlado con label, error y soporte para `type`. |
| `Modal` | Overlay centrado, `size` sm/md/lg, `title`, `footer`, cierre con ESC/overlay. |
| `Badge` | Chip de estado/prioridad con variantes de color. |
| `Avatar` | Muestra foto o iniciales del nombre. |
| `Spinner` | Indicador de carga animado. |

#### Molecules

| Componente | Descripción |
|-----------|-------------|
| `TaskCard` | Tarjeta de tarea en el Kanban. Muestra título, prioridad, fecha, assignee, historia vinculada (chip azul). Botones editar/eliminar (admin/SM). Draggable según permisos. |
| `ProjectCard` | Tarjeta de proyecto en el listado. |
| `StoryCard` | Tarjeta de historia con estado y story points. |

#### Organisms

| Componente | Descripción |
|-----------|-------------|
| `Sidebar` | Menú lateral fijo (260px) con logo KanBia, links de navegación, sección de administración (solo admin) y footer con Configuración + Cerrar sesión. Modal de confirmación de logout. |
| `Navbar` | Barra superior con botón hamburguesa, toggle de tema (pill oscuro/claro con iconos Sun/Moon), notificaciones (Bell), y chip del usuario (avatar + nombre + email). |
| `KanbanBoard` | Tablero de 4 columnas con drag-and-drop (@hello-pangea/dnd). Llama al endpoint de actualización de status al soltar. |
| `DashboardStats` | Grupo de tarjetas de estadísticas con iconos lucide (BarChart3, Bookmark, FolderGit2, CheckSquare). |

### 4.6 Estado global y autenticación

#### `AuthContext` (`context/AuthContext.jsx`)

Expone:
- `user`: objeto del usuario autenticado o `null`.
- `token`: JWT string o `null`.
- `login(email, password)`: llama a la API, almacena en estado y localStorage.
- `logout()`: limpia estado y localStorage.
- `isAuthenticated`: booleano derivado.

**Persistencia**: el par `{ user, token }` se guarda en `localStorage` y se rehidrata al montar el provider (recarga de página mantiene la sesión).

#### `ThemeContext` (`context/ThemeContext.jsx`)

- `theme`: `'light'` | `'dark'`.
- `toggleTheme()`: alterna el valor y lo persiste en `localStorage`.
- El tema se aplica como clase CSS en `<html>` usando variables CSS customizadas.

#### Hooks personalizados

| Hook | Descripción |
|------|-------------|
| `useAuth()` | Acceso al `AuthContext`. |
| `useModal()` | Estado `{ isOpen, open, close }` para cualquier modal. |
| `useForm(initialValues)` | Estado del formulario + handler `onChange` genérico. |
| `useTasks(projectId)` | Fetch de tareas, `updateTaskStatus`, `createTask`, `updateTask`, `deleteTask`. |

### 4.7 Servicios y cliente HTTP

#### `src/services/api.js`

Instancia de Axios con:
- `baseURL`: `import.meta.env.VITE_API_URL` o `http://localhost:5000/api`.
- Interceptor de request: inyecta `Authorization: Bearer <token>` desde `localStorage`.
- Interceptor de respuesta: en `401`, limpia el storage y redirige a `/login`.

#### Servicios por recurso

Cada archivo exporta un objeto con métodos `getAll`, `getById`, `create`, `update`, `remove`, etc.:

```js
// ejemplo: taskService.js
export const taskService = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id)    => api.get(`/tasks/${id}`),
  create:  (data)  => api.post('/tasks', data),
  update:  (id, data) => api.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  remove:  (id)    => api.delete(`/tasks/${id}`),
};
```

**Servicios implementados**: `authService`, `userService`, `projectService`, `epicService`, `storyService`, `taskService`, `eventService`.

### 4.8 Estilos y tema

#### SCSS Modules + CSS custom properties

Cada componente o página tiene su `.module.scss` co-localizado. La paleta de colores y variables de diseño viven en `src/styles/variables.scss`:

```scss
// Tipografía (rem base: 18px → todo escala proporcionalmente)
$font-xs: 0.694rem;   $font-sm: 0.833rem;   $font-base: 1rem;
$font-lg: 1.2rem;     $font-xl: 1.44rem;    $font-2xl: 1.728rem;

// Colores de marca
$primary-400: #60a5fa;   $primary-500: #3b82f6;

// Espaciado, radios y transiciones
$space-1: 0.25rem; ... $space-10: 2.5rem;
$radius-sm: 0.375rem;   $radius-md: 0.5rem;   $radius-lg: 0.75rem;
```

#### Temas claro/oscuro

Las variables CSS de color se intercambian mediante la clase en `<html>`:

```scss
// global.scss
html {
  font-size: 18px;  // base escalada → toda la UI se agranda

  // Tema claro (default)
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --border-color: #e2e8f0;

  // Tema oscuro
  &.dark {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --border-color: #334155;
  }
}
```

#### Marca KanBia

El logo aparece en la `Sidebar` y en `AuthLayout` con tipografía monospace en dos pesos:

```jsx
<span className={styles.logoName}>Kan</span>
<span className={styles.logoName2}>Bia</span>
```

- `.logoName`: `font-weight: 300`, uppercase, `letter-spacing: 0.05em`.
- `.logoName2`: `font-weight: 700`, misma tipografía.

---

## 5. Instalación y puesta en marcha

### Requisitos previos

- **Node.js** ≥ 18
- **MongoDB** corriendo localmente (puerto 27017) o URI remota
- **npm** (viene con Node.js)

### Backend

```bash
cd server
npm install

# Crear archivo .env (ver sección 6)
cp .env.example .env

# Poblar la base de datos con datos de prueba
npm run seed

# Iniciar en modo desarrollo (nodemon)
npm run dev

# Iniciar en producción
npm start
```

El servidor escucha por defecto en **http://localhost:5000**.

### Frontend

```bash
cd client
npm install --legacy-peer-deps
# Nota: --legacy-peer-deps es necesario por un conflicto entre
# @hello-pangea/dnd y React 19 en resolución de peer deps.

# Crear archivo .env
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Iniciar Vite dev server
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

La app corre por defecto en **http://localhost:5173**.

---

## 6. Variables de entorno

### Backend (`server/.env`)

| Variable | Obligatoria | Default | Descripción |
|----------|:-----------:|---------|-------------|
| `PORT` | No | `5000` | Puerto del servidor Express |
| `MONGODB_URI` | **Sí** | — | Connection string de MongoDB |
| `JWT_SECRET` | **Sí** | — | Clave secreta para firmar los JWT |
| `JWT_EXPIRES_IN` | No | `7d` | Duración del token de acceso |
| `NODE_ENV` | No | `development` | Activa logs Morgan en dev |
| `CLIENT_URL` | No | `http://localhost:5173` | Origen permitido por CORS |

### Frontend (`client/.env`)

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL base de la API (ej. `http://localhost:5000/api`) |

---

## 7. Despliegue en producción

La app está desplegada en los siguientes servicios gratuitos:

| Componente | Servicio | URL |
|-----------|----------|-----|
| Frontend | Vercel | https://kanbia.vercel.app |
| Backend | Render | https://kanbia.onrender.com |
| Base de datos | MongoDB Atlas | Cloud (M0 Free) |
| Código fuente | GitHub | https://github.com/Valentin-G24/kanbia |

### Arquitectura en producción

```
Usuario
   │
   ▼
https://kanbia.vercel.app        (Vercel — SPA estática)
   │
   │  HTTPS + CORS
   ▼
https://kanbia.onrender.com/api  (Render — Node.js)
   │
   ▼
MongoDB Atlas                    (Base de datos en la nube)
```

### Paso a paso para deployar desde cero

#### 1. MongoDB Atlas

1. Crear cuenta en [cloud.mongodb.com](https://cloud.mongodb.com)
2. Crear cluster gratuito (M0)
3. En **Database Access**: crear usuario con contraseña (solo letras y números)
4. En **Network Access**: agregar `0.0.0.0/0`
5. Copiar la URI de conexión:
   ```
   mongodb+srv://USUARIO:CONTRASEÑA@cluster0.xxxxx.mongodb.net/kanbia
   ```

#### 2. Render (backend)

1. Crear cuenta en [render.com](https://render.com) y conectar GitHub
2. **New Web Service** → repositorio `kanbia`
3. Configuración:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Variables de entorno:

   | Variable | Valor |
   |----------|-------|
   | `MONGODB_URI` | URI de Atlas |
   | `JWT_SECRET` | string secreto largo |
   | `JWT_EXPIRES_IN` | `7d` |
   | `NODE_ENV` | `production` |
   | `CLIENT_URL` | `https://kanbia.vercel.app` ← con `https://` |

5. Deploy → copiar la URL asignada (ej: `https://kanbia.onrender.com`)

#### 3. Vercel (frontend)

1. Crear cuenta en [vercel.com](https://vercel.com) y conectar GitHub
2. **New Project** → repositorio `kanbia`
3. Configuración:
   - **Root Directory**: `client`
   - **Framework**: Vite (auto-detectado)
4. Deploy

> La URL del backend ya está configurada en `client/.env.production` — no es necesario configurar variables de entorno en la UI de Vercel.

#### 4. Poblar la base de datos

Tras el primer deploy, registrarse desde la app (rol `developer` por defecto) y luego cambiar el rol a `admin` directamente en MongoDB Atlas:

1. Atlas → **Browse Collections** → `users`
2. Editar el documento → campo `role` → `admin`

Alternativamente, usar las credenciales del seed si se corrió previamente:
```
admin@agileflow.dev / admin123
```

### Consideraciones del plan gratuito

- **Render**: el backend se "duerme" tras 15 minutos de inactividad. La primera request puede tardar 30-60 segundos mientras despierta.
- **MongoDB Atlas**: límite de 512 MB de almacenamiento en M0 Free.
- **Vercel**: sin límites prácticos para proyectos personales.

### Archivos clave para el deploy

| Archivo | Propósito |
|---------|-----------|
| `client/.npmrc` | `legacy-peer-deps=true` — resuelve conflicto de `@hello-pangea/dnd` con React 19 en el build de Vercel |
| `client/.env.production` | `VITE_API_URL` apuntando a Render — se commitea porque no es un secreto |
| `server/.env` | Variables sensibles del backend — **no se versiona** |
| `.gitignore` | Excluye `node_modules/`, `server/.env`, `client/dist/` |

---

## 8. Roles y permisos

El sistema implementa RBAC (Role-Based Access Control) con 4 roles globales:

| Rol | Descripción | Acceso a `/users` |
|-----|-------------|:-----------------:|
| `admin` | Control total de la plataforma | Sí |
| `scrum_master` | Gestión de proyectos y trabajo diario | No |
| `developer` | Trabajo sobre tareas asignadas | No |
| `guest` | Solo lectura | No |

### Matriz de permisos por recurso

| Acción | admin | scrum_master | developer | guest |
|--------|:-----:|:------------:|:---------:|:-----:|
| Crear proyecto | ✅ | ❌ | ❌ | ❌ |
| Editar/eliminar proyecto | ✅ | ❌ | ❌ | ❌ |
| Gestionar miembros | ✅ | ❌ | ❌ | ❌ |
| Crear/editar/eliminar épica | ✅ | ✅ | ❌ | ❌ |
| Crear/editar/eliminar historia | ✅ | ✅ | ❌ | ❌ |
| Crear tarea | ✅ | ✅ | ❌ | ❌ |
| Editar tarea / mover en Kanban | ✅ | ✅ | Solo propias | ❌ |
| Eliminar tarea | ✅ | ✅ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ | ❌ |
| Ver dashboard y analytics | ✅ | ✅ | ✅ | ✅ |
| Crear/editar eventos de calendario | ✅ | ✅ | ✅ | ✅ |

> Los eventos del calendario son **siempre privados** por usuario, sin importar el rol.

### Visibilidad de historias y tareas por rol

- `developer` en `StoryDetailPage`: solo ve las tareas donde `assignee === currentUser._id`.
- `admin` y `scrum_master`: ven todas las historias y tareas del proyecto.

---

## 9. Funcionalidades implementadas

### Gestión de proyectos
- CRUD completo de proyectos (solo admin).
- Asignación y remoción de miembros con rol dentro del proyecto.
- Vista de detalle con épicas y tablero Kanban.

### Gestión de épicas e historias
- CRUD completo con modales en el frontend.
- Confirmación modal antes de eliminar (sin `window.confirm`).
- Navegación jerárquica: Proyecto → Épica → Historia → Tarea.

### Tablero Kanban
- 4 columnas: `Todo`, `In Progress`, `Review`, `Done`.
- Drag-and-drop con `@hello-pangea/dnd`.
- Desarrolladores pueden mover únicamente sus propias tareas.
- Admins y Scrum Masters pueden mover cualquier tarea.
- Las tareas muestran: título, prioridad, fecha de vencimiento, avatar del asignado, historia vinculada (chip azul).

### Vinculación de tareas a historias
- Las tareas tienen un campo `story` que las vincula a una historia.
- Al crear/editar una tarea se puede seleccionar la historia desde un dropdown.
- La historia vinculada se muestra como chip en la tarjeta Kanban.
- Las tareas también se pueden crear directamente desde el detalle de una historia.

### Calendario de eventos
- Calendario mensual navegable.
- Creación, edición y eliminación de eventos con título, descripción, fechas y color.
- Eventos privados por usuario (aislados a nivel de backend).

### Analíticas y dashboard
- Tarjetas de resumen (proyectos, épicas, historias, tareas totales).
- Gráfico de barras (distribución de tareas por estado).
- Gráfico de torta (distribución por prioridad).
- Datos en tiempo real del endpoint `/api/dashboard`.

### Autenticación y perfil
- Registro y login con email + contraseña.
- JWT almacenado en localStorage con duración configurable.
- Cambio de contraseña desde el perfil.
- Reset de contraseña por email (con token).

### UI/UX
- Tema oscuro / claro con switch pill animado en la Navbar.
- Sidebar con logo KanBia, iconos lucide, sección admin condicional y logout con confirmación modal.
- Navbar muestra nombre y email del usuario autenticado.
- Todos los iconos del sistema usan `lucide-react`.
- Base tipográfica de 18px (todo el UI escala proporcionalmente con rem).
- Diseño responsive: sidebar se oculta en mobile con hamburguesa.
- Modales para todas las acciones destructivas.

---

## 10. Glosario y decisiones de diseño

### Glosario

- **Story Point**: estimación de complejidad de una historia de usuario. En este sistema es un número libre (no necesariamente Fibonacci).
- **Kanban**: metodología de gestión de flujo de trabajo con columnas que representan estados.
- **RBAC**: Role-Based Access Control — sistema de permisos por rol.
- **Bearer Token**: esquema de autenticación HTTP donde el cliente envía el JWT en el header `Authorization: Bearer <token>`.
- **SCSS Modules**: CSS Modules con sintaxis Sass — los nombres de clase son locales al componente, evitando colisiones.
- **rem**: unidad CSS relativa al `font-size` del elemento raíz (`html`). Cambiar la base de 16px a 18px escala toda la UI.

### Decisiones de diseño relevantes

1. **JWT en localStorage en lugar de cookies HTTP-only**. Decisión pedagógica que simplifica la implementación en el cliente. En producción se recomienda migrar a cookies HTTP-only para mitigar XSS.

2. **CommonJS en el backend, ESM en el frontend**. El backend usa `require/module.exports` para compatibilidad con el ecosistema Node (aunque podría migrar a ESM). El cliente usa `import/export` nativo via Vite.

3. **Sin librería de estado global**. Se usa Context API nativo de React. Suficiente para la escala actual; si el proyecto crece, se podría migrar a Zustand o Redux Toolkit.

4. **Atomic Design para los componentes**. Átomos → Moléculas → Organismos permite reutilización sin sobre-ingeniería.

5. **Modales para todas las confirmaciones**. Eliminados todos los `window.confirm()` y `window.alert()` nativos del browser. Mejora la consistencia visual y permite personalizar el mensaje.

6. **Eventos del calendario aislados por usuario**. El backend filtra por `createdBy` en GET y verifica propiedad en PUT/DELETE. Esto garantiza privacidad sin lógica adicional en el frontend.

7. **`--legacy-peer-deps` en la instalación del cliente**. El paquete `@hello-pangea/dnd` declara como peer dep React ^16 | ^17 | ^18, pero el proyecto usa React 19. La funcionalidad es compatible; solo el resolver de npm se queja por el rango de versiones.

8. **Base font-size 18px**. Aumentar la base de 16px a 18px en `html` escala toda la UI de forma proporcional sin tocar cada regla CSS individualmente.
