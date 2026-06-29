import { Loader2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { createAppointment, updateAppointment } from '../../services/appointments'
import { fetchDoctorSummaries } from '../../services/doctors'
import type { Appointment, DoctorSummary } from '../../types/database'
import { PatientSearchSelect } from '../patients/PatientSearchSelect'
import { inputClassName, labelClassName, Modal } from '../ui/Modal'

interface AppointmentFormProps {
  open: boolean
  onClose: () => void
  onSaved: (appointment: Appointment) => void
  defaultPatientId?: string | null
  appointment?: Appointment | null
}

function toLocalDatetimeValue(iso?: string): string {
  if (!iso) {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  }
  const date = new Date(iso)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

export function AppointmentForm({
  open,
  onClose,
  onSaved,
  defaultPatientId,
  appointment,
}: AppointmentFormProps) {
  const [patientId, setPatientId] = useState<string | null>(null)
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [doctors, setDoctors] = useState<DoctorSummary[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [appointmentDate, setAppointmentDate] = useState(toLocalDatetimeValue())
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isEditing = Boolean(appointment)

  useEffect(() => {
    if (open) {
      if (appointment) {
        setPatientId(appointment.patient_id)
        setDoctorId(appointment.doctor_id)
        setAppointmentDate(toLocalDatetimeValue(appointment.appointment_date))
        setNotes(appointment.notes ?? '')
      } else {
        setPatientId(defaultPatientId ?? null)
        setDoctorId(null)
        setAppointmentDate(toLocalDatetimeValue())
        setNotes('')
      }
      setError(null)

      setLoadingDoctors(true)
      void fetchDoctorSummaries()
        .then((list) => setDoctors(list))
        .catch(() => setDoctors([]))
        .finally(() => setLoadingDoctors(false))
    }
  }, [open, defaultPatientId, appointment])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!patientId) {
      setError('Lütfen bir hasta seçin.')
      return
    }

    if (!appointmentDate) {
      setError('Randevu tarihi zorunludur.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_date: new Date(appointmentDate).toISOString(),
        notes,
      }

      const saved = appointment
        ? await updateAppointment(appointment.id, payload)
        : await createAppointment(payload)

      onSaved(saved)
      onClose()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Randevu kaydedilirken bir hata oluştu.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Yeni Randevu Ekle"
      description="Hasta seçin, randevu tarihini ve tedavi notunu girin."
      onClose={onClose}
      wide
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <label className="block">
          <span className={labelClassName}>Hasta</span>
          <PatientSearchSelect
            value={patientId}
            onChange={(id) => setPatientId(id)}
          />
        </label>

        <label className="block">
          <span className={labelClassName}>Doktor (isteğe bağlı)</span>
          <select
            value={doctorId ?? ''}
            onChange={(event) =>
              setDoctorId(event.target.value ? event.target.value : null)
            }
            className={inputClassName}
          >
            <option value="">
              {loadingDoctors ? 'Doktorlar yükleniyor...' : 'Doktor seçin (isteğe bağlı)'}
            </option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.full_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelClassName}>Tarih / Saat</span>
          <input
            type="datetime-local"
            required
            value={appointmentDate}
            onChange={(event) => setAppointmentDate(event.target.value)}
            className={inputClassName}
          />
        </label>

        <label className="block">
          <span className={labelClassName}>Tedavi Notu</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder="Yapılan veya planlanan tedavi detayları..."
            className={`${inputClassName} resize-y`}
          />
        </label>

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? 'Randevuyu Güncelle' : 'Randevuyu Kaydet'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
