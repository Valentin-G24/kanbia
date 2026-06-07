# KanBia — Plataforma de Gestión Ágil de Proyectos

## Stack

| Capa      | Tecnología                                               |
|-----------|----------------------------------------------------------|
| Frontend  | React 19, Vite, SCSS Modules, React Router DOM, Recharts |
| Backend   | Node.js, Express.js, MongoDB, Mongoose, JWT              |
| Auth      | JWT + bcryptjs, RBAC (4 roles)                           |
| UI/UX     | Atomic Design, Dark/Light mode, Drag & Drop (dnd)        |

---

## Instalación

### 1. Requisitos previos

- **Node.js 20+**: https://nodejs.org/
- **MongoDB**: https://www.mongodb.com/try/download/community  
  _(o usar MongoDB Atlas — actualizar MONGODB_URI en server/.env)_

### 2. Backend

```bash
cd server
npm install
npm run dev
```

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

### 4. Seed (datos de prueba)

```bash
cd server
npm run seed
```

Usuarios creados:
| Email                  | Password   | Rol           |
|------------------------|------------|---------------|
| admin@agileflow.dev    | admin123   | Admin         |
| sm@agileflow.dev       | scrum123   | Scrum Master  |
| dev@agileflow.dev      | dev12345   | Developer     |

---

## Estructura del Proyecto

```
FinalWeb/
├── server/              # API REST
│   ├── src/
│   │   ├── controllers/ # Lógica de negocio
│   │   ├── models/      # Esquemas Mongoose
│   │   ├── routes/      # Endpoints
│   │   ├── middlewares/ # Auth, RBAC, errores
│   │   ├── services/    # Notificaciones
│   │   ├── utils/       # AppError, JWT
│   │   └── database/    # Conexión + Seed
│   └── server.js
│
└── client/              # SPA React
    └── src/
        ├── components/
        │   ├── atoms/       # Button, Input, Select, Badge, Avatar, Modal, Spinner
        │   ├── molecules/   # TaskCard, SearchBar, NotificationItem
        │   └── organisms/   # Sidebar, Navbar, KanbanBoard, DashboardStats
        ├── pages/           # Login, Register, Dashboard, Projects, etc.
        ├── context/         # AuthContext, ThemeContext, NotificationContext
        ├── hooks/           # useProjects, useTasks, useModal, useForm
        ├── services/        # Axios por entidad
        ├── utils/           # Constants, formatters
        └── styles/          # Variables, mixins, global SCSS
```

---

## Funcionalidades

- ✅ Autenticación JWT (registro, login, logout, cambio contraseña)
- ✅ RBAC: Admin / Scrum Master / Developer / Guest
- ✅ Proyectos con miembros y roles
- ✅ Épicas → Historias de Usuario → Tareas
- ✅ **Kanban Board** con drag & drop (actualiza BD en tiempo real)
- ✅ Dashboard con gráficos (BarChart + PieChart)
- ✅ Sistema de notificaciones
- ✅ Comentarios en Historias
- ✅ Dark / Light mode
- ✅ Responsive Mobile First
- ✅ Atomic Design completo
