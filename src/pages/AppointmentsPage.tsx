import { Calendar, Pencil, Plus, RefreshCw, Search, SlidersHorizontal, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AppointmentForm } from '../components/appointments/AppointmentForm'
import { useApp } from '../context/AppContext'
import { matchesAppointmentDateFilter } from '../lib/dateFilters'
import { formatDateTime, formatShortDate } from '../lib/format'
import { deleteAppointment, fetchAppointments } from '../services/appointments'
import type {
  AppointmentDateFilter,
  AppointmentSortOption,
  AppointmentWithPatient,
  DoctorFilterOption,
} from '../types/database'

export function AppointmentsPage() {
  const { connectionStatus } = useApp()
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<AppointmentDateFilter>('upcoming')
  const [sort, setSort] = useState<AppointmentSortOption>('nearest')
  const [doctorFilter, setDoctorFilter] = useState<DoctorFilterOption>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<AppointmentWithPatient | null>(null)

  const loadAppointments = useCallback(async () => {
    if (connectionStatus !== 'connected') return
    setLoading(true)
    setError(null)
    try {
      setAppointments(await fetchAppointments())
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Randevular yüklenirken hata oluştu.',
      )
    } finally {
      setLoading(false)
    }
  }, [connectionStatus])

  useEffect(() => {
    void loadAppointments()
  }, [loadAppointments])

  const displayedAppointments = useMemo(() => {
    const term = search.trim().toLowerCase()

    let list = appointments.filter((appointment) => {
      if (!matchesAppointmentDateFilter(appointment.appointment_date, dateFilter)) {
        return false
      }

      if (
        doctorFilter !== 'all' &&
        appointment.doctor_id !== doctorFilter
      ) {
        return false
      }

      if (term) {
        const name = appointment.patients?.full_name?.toLowerCase() ?? ''
        const phone = appointment.patients?.phone?.toLowerCase() ?? ''
        const tc = appointment.patients?.identity_no?.toLowerCase() ?? ''
        const notes = appointment.notes?.toLowerCase() ?? ''
        if (
          !name.includes(term) &&
          !phone.includes(term) &&
          !tc.includes(term) &&
          !notes.includes(term)
        ) {
          return false
        }
      }

      return true
    })

    list = [...list].sort((a, b) => {
      const diff =
        new Date(a.appointment_date).getTime() -
        new Date(b.appointment_date).getTime()
      return sort === 'nearest' ? diff : -diff
    })

    return list
  }, [appointments, dateFilter, doctorFilter, search, sort])

  const doctorOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const appointment of appointments) {
      if (appointment.doctors?.id) {
        map.set(appointment.doctors.id, appointment.doctors.full_name)
      } else if (appointment.doctor_id && !map.has(appointment.doctor_id)) {
        map.set(appointment.doctor_id, 'Doktor')
      }
    }
    return Array.from(map.entries()).map(([id, full_name]) => ({ id, full_name }))
  }, [appointments])

  const handleDelete = async (appointment: AppointmentWithPatient) => {
    if (
      !window.confirm(
        `${appointment.patients?.full_name ?? 'Bu'} randevusunu silmek istediğinize emin misiniz?`,
      )
    ) {
      return
    }

    try {
      await deleteAppointment(appointment.id)
      await loadAppointments()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Randevu silinirken hata oluştu.',
      )
    }
  }

  const handleEdit = (appointment: AppointmentWithPatient) => {
    setEditingAppointment(appointment)
    setFormOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Randevu Listesi</h2>
          <p className="text-sm text-slate-500">
            Güncel ve geçmiş randevuları filtreleyin, sıralayın.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadAppointments()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Yenile</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingAppointment(null)
              setFormOpen(true)
            }}
            disabled={connectionStatus !== 'connected'}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Yeni Randevu
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Hasta adı, telefon veya not ile ara..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none ring-sky-500 focus:ring-2"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Tarih:
            </div>
            {(
              [
                ['upcoming', 'Yaklaşanlar'],
                ['today', 'Bugün'],
                ['tomorrow', 'Yarın'],
                ['week', 'Bu Hafta'],
                ['all', 'Tüm Tarihler'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setDateFilter(value)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  dateFilter === value
                    ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Sıralama &amp; Doktor:</span>
            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as AppointmentSortOption)
              }
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none ring-sky-500 focus:ring-2"
            >
              <option value="nearest">En yakın randevu</option>
              <option value="farthest">En uzak randevu</option>
            </select>

            {doctorOptions.length > 0 && (
              <select
                value={doctorFilter}
                onChange={(event) =>
                  setDoctorFilter(
                    (event.target.value || 'all') as DoctorFilterOption,
                  )
                }
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none ring-sky-500 focus:ring-2"
              >
                <option value="all">Tüm doktorlar</option>
                {doctorOptions.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.full_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Yükleniyor...</p>
      ) : displayedAppointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <Calendar className="h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">Randevu bulunamadı.</p>
        </div>
      ) : (
        <>
				<div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
					<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">
                      Hasta
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">
                      Tarih / Saat
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">
                      Tedavi Notu
                    </th>
									<th className="px-4 py-3 text-left font-medium text-slate-600">
										Doktor
									</th>
									<th className="px-4 py-3 text-right font-medium text-slate-600">
                      İşlem
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const rows: ReactNode[] = []
                    let lastDay = ''

                    for (const appointment of displayedAppointments) {
                      const dayKey = new Date(
                        appointment.appointment_date,
                      ).toDateString()

                      if (dayKey !== lastDay) {
                        lastDay = dayKey
                        rows.push(
                          <tr key={`day-${dayKey}`} className="bg-slate-50/80">
										<td
											colSpan={5}
											className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
										>
                              {formatShortDate(appointment.appointment_date)}
                            </td>
                          </tr>,
                        )
                      }

                      rows.push(
                        <tr
                          key={appointment.id}
                          className="hover:bg-slate-50/60"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">
                              {appointment.patients?.full_name ?? '—'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {appointment.patients?.phone ?? ''}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatDateTime(appointment.appointment_date)}
                          </td>
										<td className="max-w-xs px-4 py-3 text-slate-500">
                            <p className="line-clamp-2">
                              {appointment.notes || '—'}
                            </p>
                          </td>
										<td className="px-4 py-3 text-slate-600">
											{appointment.doctors?.full_name ?? '—'}
										</td>
										<td className="px-4 py-3 text-right">
											<div className="inline-flex items-center gap-1">
												<button
														type="button"
														onClick={() => handleEdit(appointment)}
														className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-600"
														aria-label="Düzenle"
													>
														<Pencil className="h-4 w-4" />
													</button>
												<button
														type="button"
														onClick={() => void handleDelete(appointment)}
														className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
														aria-label="Sil"
													>
														<Trash2 className="h-4 w-4" />
													</button>
											</div>
										</td>
                        </tr>,
                      )
                    }

                    return rows
                  })()}
                </tbody>
              </table>
            </div>
          </div>

						<div className="space-y-3 md:hidden">
            {(() => {
              const items: ReactNode[] = []
              let lastDay = ''

              for (const appointment of displayedAppointments) {
                const dayKey = new Date(
                  appointment.appointment_date,
                ).toDateString()

                if (dayKey !== lastDay) {
                  lastDay = dayKey
                  items.push(
                    <h3
                      key={`m-day-${dayKey}`}
                      className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {formatShortDate(appointment.appointment_date)}
                    </h3>,
                  )
                }

                items.push(
                  <article
                    key={appointment.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
								<div className="flex items-start justify-between gap-2">
									<div>
										<p className="font-medium text-slate-900">
											{appointment.patients?.full_name ?? '—'}
										</p>
										<p className="text-xs text-slate-500">
											{formatDateTime(appointment.appointment_date)}
										</p>
										{appointment.doctors?.full_name && (
											<p className="mt-0.5 text-[11px] text-slate-500">
												Doktor: {appointment.doctors.full_name}
											</p>
										)}
									</div>
									<div className="flex shrink-0 flex-col items-end gap-1">
										<button
											type="button"
											onClick={() => handleEdit(appointment)}
											className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-600"
											aria-label="Düzenle"
										>
											<Pencil className="h-4 w-4" />
										</button>
									</div>
								</div>
                    {appointment.notes && (
                      <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                        {appointment.notes}
                      </p>
                    )}
							<div className="mt-3 flex justify-end gap-1">
								<button
									type="button"
									onClick={() => handleEdit(appointment)}
									className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-600"
									aria-label="Düzenle"
								>
									<Pencil className="h-4 w-4" />
								</button>
								<button
									type="button"
									onClick={() => void handleDelete(appointment)}
									className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
									aria-label="Sil"
								>
									<Trash2 className="h-4 w-4" />
								</button>
							</div>
                  </article>,
                )
              }

              return items
            })()}
          </div>
        </>
      )}

      <AppointmentForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingAppointment(null)
        }}
        onSaved={() => {
          setFormOpen(false)
          setEditingAppointment(null)
          void loadAppointments()
        }}
        appointment={editingAppointment ?? undefined}
      />
    </div>
  )
}
