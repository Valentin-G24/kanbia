export const ROLES = {
  ADMIN: 'admin',
  SCRUM_MASTER: 'scrum_master',
  DEVELOPER: 'developer',
  GUEST: 'guest',
};

export const ROLE_LABELS = {
  admin: 'Administrador',
  scrum_master: 'Scrum Master',
  developer: 'Desarrollador',
  guest: 'Invitado',
};

export const PROJECT_STATUSES = ['planning', 'in_progress', 'paused', 'completed'];

export const PROJECT_STATUS_LABELS = {
  planning: 'Planificación',
  in_progress: 'En progreso',
  paused: 'Pausado',
  completed: 'Completado',
};

export const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];

export const TASK_STATUS_LABELS = {
  todo: 'Pendiente',
  in_progress: 'En progreso',
  review: 'En revisión',
  done: 'Completado',
};

export const EPIC_STATUS_LABELS = {
  backlog: 'Backlog',
  in_progress: 'En progreso',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export const PRIORITY_LABELS = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};

export const PRIORITY_COLORS = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

export const STATUS_COLORS = {
  todo: '#64748b',
  in_progress: '#3b82f6',
  review: '#a855f7',
  done: '#22c55e',
  planning: '#64748b',
  paused: '#eab308',
  completed: '#22c55e',
  backlog: '#64748b',
  cancelled: '#ef4444',
};
