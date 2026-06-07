import { FolderKanban, Zap, Bookmark, SquareCheck, Flag, Clock } from 'lucide-react';
import styles from './DashboardStats.module.scss';

const STATS_CONFIG = [
  { key: 'projects', label: 'Proyectos', Icon: FolderKanban, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { key: 'epics', label: 'Épicas', Icon: Zap, color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  { key: 'stories', label: 'Historias', Icon: Bookmark, color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  { key: 'total', label: 'Total Tareas', Icon: SquareCheck, color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  { key: 'done', label: 'Completadas', Icon: Flag, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  { key: 'pending', label: 'Pendientes', Icon: Clock, color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
];

export default function DashboardStats({ stats }) {
  if (!stats) return null;

  const values = {
    projects: stats.projects?.total ?? 0,
    epics: stats.epics ?? 0,
    stories: stats.stories ?? 0,
    total: stats.tasks?.total ?? 0,
    done: stats.tasks?.done ?? 0,
    pending: stats.tasks?.pending ?? 0,
  };

  return (
    <div className={styles.grid}>
      {STATS_CONFIG.map((s) => {
        const Icon = s.Icon;
        return (
          <div key={s.key} className={styles.card}>
            <div className={styles.iconWrap} style={{ background: s.bg, color: s.color }}>
              <Icon size={22} />
            </div>
            <div className={styles.info}>
              <div className={styles.value} style={{ color: s.color }}>
                {values[s.key]}
              </div>
              <div className={styles.label}>{s.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
