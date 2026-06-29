import type { AppointmentDateFilter } from '../types/database'

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function startOfWeek(date: Date) {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function endOfWeek(date: Date) {
  const start = startOfWeek(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return endOfDay(end)
}

export function matchesAppointmentDateFilter(
  iso: string,
  filter: AppointmentDateFilter,
): boolean {
  if (filter === 'all') return true

  const appointment = new Date(iso)
  const now = new Date()

  if (filter === 'upcoming') {
    // Şu andan sonraki tüm randevular (geçmişi gizlemek için varsayılan filtre)
    return appointment >= now
  }

  if (filter === 'today') {
    return appointment >= startOfDay(now) && appointment <= endOfDay(now)
  }

  if (filter === 'tomorrow') {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return (
      appointment >= startOfDay(tomorrow) && appointment <= endOfDay(tomorrow)
    )
  }

  if (filter === 'week') {
    return (
      appointment >= startOfWeek(now) && appointment <= endOfWeek(now)
    )
  }

  return true
}

export function getTodayRange() {
  const now = new Date()
  return { start: startOfDay(now).toISOString(), end: endOfDay(now).toISOString() }
}
