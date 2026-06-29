import { Calendar, FileText } from 'lucide-react'
import { formatDateTime } from '../../lib/format'
import type { Appointment } from '../../types/database'

interface PatientTimelineProps {
  appointments: Appointment[]
  loading?: boolean
}

export function PatientTimeline({ appointments, loading }: PatientTimelineProps) {
  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">Randevular yükleniyor...</p>
    )
  }

  if (appointments.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
        Bu hastanın henüz randevu kaydı yok.
      </p>
    )
  }

  return (
    <ol className="relative space-y-0">
      {appointments.map((appointment, index) => {
        const isLast = index === appointments.length - 1

        return (
          <li key={appointment.id} className="relative flex gap-4 pb-6">
            {!isLast && (
              <span
                className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-0.5 bg-slate-200"
                aria-hidden
              />
            )}

            <span className="relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 ring-4 ring-white">
              <Calendar className="h-3 w-3 text-sky-600" />
            </span>

            <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  {formatDateTime(appointment.appointment_date)}
                </p>
                <span className="text-xs text-slate-400">Randevu</span>
              </div>

              {appointment.notes ? (
                <div className="mt-3 flex gap-2 rounded-lg bg-slate-50 p-3">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                    {appointment.notes}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs italic text-slate-400">
                  Tedavi notu eklenmemiş.
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
