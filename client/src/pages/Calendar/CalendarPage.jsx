import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, X } from 'lucide-react';
import styles from './CalendarPage.module.scss';
import Modal from '../../components/atoms/Modal/Modal';
import Button from '../../components/atoms/Button/Button';
import Input from '../../components/atoms/Input/Input';
import { eventService } from '../../services/eventService';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const COLOR_OPTIONS = [
  '#3b82f6', '#22c55e', '#f97316', '#a855f7',
  '#ef4444', '#eab308', '#06b6d4', '#ec4899',
];

const toInputDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', date: '', endDate: '', color: '#3b82f6', allDay: true });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await eventService.getAll({ month: current.month + 1, year: current.year });
      setEvents(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [current.year, current.month]);

  const prevMonth = () => {
    setCurrent((c) => {
      if (c.month === 0) return { year: c.year - 1, month: 11 };
      return { ...c, month: c.month - 1 };
    });
  };

  const nextMonth = () => {
    setCurrent((c) => {
      if (c.month === 11) return { year: c.year + 1, month: 0 };
      return { ...c, month: c.month + 1 };
    });
  };

  const goToday = () => setCurrent({ year: today.getFullYear(), month: today.getMonth() });

  const openAdd = (day) => {
    const dateStr = `${current.year}-${String(current.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setEditingEvent(null);
    setSelectedDay(day);
    setForm({ title: '', description: '', date: dateStr, endDate: '', color: '#3b82f6', allDay: true });
    setModalOpen(true);
  };

  const openEdit = (e, event) => {
    e.stopPropagation();
    setEditingEvent(event);
    setSelectedDay(null);
    setForm({
      title: event.title,
      description: event.description || '',
      date: toInputDate(event.date),
      endDate: toInputDate(event.endDate),
      color: event.color || '#3b82f6',
      allDay: event.allDay,
    });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form };
      if (!data.endDate) delete data.endDate;
      if (!data.description) delete data.description;

      if (editingEvent) {
        const res = await eventService.update(editingEvent._id, data);
        setEvents((prev) => prev.map((ev) => (ev._id === editingEvent._id ? res.data.data : ev)));
      } else {
        const res = await eventService.create(data);
        setEvents((prev) => [...prev, res.data.data]);
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await eventService.remove(confirmDelete._id);
    setEvents((prev) => prev.filter((ev) => ev._id !== confirmDelete._id));
    setConfirmDelete(null);
    setModalOpen(false);
  };

  const daysInMonth = getDaysInMonth(current.year, current.month);
  const firstDay = getFirstDayOfMonth(current.year, current.month);

  const getEventsForDay = (day) => {
    return events.filter((ev) => {
      const d = new Date(ev.date);
      return d.getFullYear() === current.year && d.getMonth() === current.month && d.getDate() === day;
    });
  };

  const isToday = (day) =>
    today.getFullYear() === current.year &&
    today.getMonth() === current.month &&
    today.getDate() === day;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Calendario</h1>
          <button className={styles.todayBtn} onClick={goToday}>Hoy</button>
        </div>
        <div className={styles.nav}>
          <button className={styles.navBtn} onClick={prevMonth}><ChevronLeft size={20} /></button>
          <span className={styles.monthLabel}>{MONTHS[current.month]} {current.year}</span>
          <button className={styles.navBtn} onClick={nextMonth}><ChevronRight size={20} /></button>
        </div>
        <Button size="sm" onClick={() => openAdd(today.getDate())}>
          <Plus size={14} style={{ marginRight: 4 }} /> Nuevo evento
        </Button>
      </div>

      {/* Day labels */}
      <div className={styles.dayLabels}>
        {DAYS.map((d) => <div key={d} className={styles.dayLabel}>{d}</div>)}
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {cells.map((day, idx) => (
          <div
            key={idx}
            className={[
              styles.cell,
              day && styles.cellActive,
              day && isToday(day) && styles.cellToday,
            ].filter(Boolean).join(' ')}
            onClick={() => day && openAdd(day)}
          >
            {day && (
              <>
                <span className={styles.dayNum}>{day}</span>
                <div className={styles.eventList}>
                  {getEventsForDay(day).map((ev) => (
                    <div
                      key={ev._id}
                      className={styles.eventChip}
                      style={{ background: ev.color + '33', borderLeft: `3px solid ${ev.color}`, color: ev.color }}
                      onClick={(e) => openEdit(e, ev)}
                      title={ev.title}
                    >
                      <span className={styles.eventChipText}>{ev.title}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Modal: Agregar / Editar evento */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEvent ? 'Editar evento' : 'Nuevo evento'}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div>
              {editingEvent && (
                <Button variant="danger" size="sm" onClick={() => setConfirmDelete(editingEvent)}>
                  <Trash2 size={13} style={{ marginRight: 4 }} /> Eliminar
                </Button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} loading={saving}>
                {editingEvent ? 'Guardar cambios' : 'Crear evento'}
              </Button>
            </div>
          </div>
        }
      >
        <form style={{ display: 'grid', gap: '1rem' }} onSubmit={handleSave}>
          <Input label="Título" name="title" value={form.title} onChange={handleChange} required />
          <Input label="Descripción" name="description" value={form.description} onChange={handleChange} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Fecha inicio" name="date" type="date" value={form.date} onChange={handleChange} required />
            <Input label="Fecha fin (opcional)" name="endDate" type="date" value={form.endDate} onChange={handleChange} />
          </div>

          {/* Color picker */}
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>Color</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, color: c }))}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: c,
                    border: form.color === c ? '3px solid var(--text-primary)' : '3px solid transparent',
                    outline: form.color === c ? `2px solid ${c}` : 'none',
                    cursor: 'pointer',
                    transition: 'transform 0.15s',
                    transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirmar eliminación */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Eliminar evento"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          ¿Eliminar el evento <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete?.title}</strong>? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
