import { useState, useEffect } from 'react';
import { PersonStanding} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import styles from './DashboardPage.module.scss';
import DashboardStats from '../../components/organisms/DashboardStats/DashboardStats';
import Spinner from '../../components/atoms/Spinner/Spinner';
import { dashboardService } from '../../services/dashboardService';
import { useAuth } from '../../context/AuthContext';
import { TASK_STATUS_LABELS, STATUS_COLORS, PROJECT_STATUS_LABELS } from '../../utils/constants';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService
      .getStats()
      .then((res) => setStats(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const taskChartData = stats
    ? Object.entries(stats.tasks?.byStatus || {}).map(([k, v]) => ({
        name: TASK_STATUS_LABELS[k] || k,
        value: v,
        fill: STATUS_COLORS[k] || '#64748b',
      }))
    : [];

  const projectChartData = stats
    ? Object.entries(stats.projects?.byStatus || {})
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({
          name: PROJECT_STATUS_LABELS[k] || k,
          value: v,
          fill: STATUS_COLORS[k] || '#64748b',
        }))
    : [];

  const firstName = user?.name?.split(' ')[0];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>
          Hola, <span>{firstName}</span><PersonStanding size={40}/>
        </h1>
        <p className={styles.sub}>Esto es lo que está pasando con tus proyectos hoy.</p>
      </div>

      {loading ? (
        <Spinner center />
      ) : (
        <>
          <DashboardStats stats={stats} />

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Analíticas</h2>
            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <p className={styles.chartTitle}>Tareas por estado</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={taskChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {taskChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className={styles.chartCard}>
                <p className={styles.chartTitle}>Proyectos por estado</p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={projectChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {projectChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(v) => <span style={{ fontSize: 12, color: '#94a3b8' }}>{v}</span>}
                    />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
