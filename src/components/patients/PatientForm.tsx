import { Loader2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { createPatient, updatePatient } from '../../services/patients'
import type { Patient } from '../../types/database'
import { inputClassName, labelClassName, Modal } from '../ui/Modal'

interface PatientFormProps {
  open: boolean
  patient?: Patient | null
  onClose: () => void
  onSaved: (patient: Patient) => void
}

export function PatientForm({
  open,
  patient,
  onClose,
  onSaved,
}: PatientFormProps) {
  const isEditing = Boolean(patient)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [identityNo, setIdentityNo] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setFullName(patient?.full_name ?? '')
      setPhone(patient?.phone ?? '')
      setIdentityNo(patient?.identity_no ?? '')
      setNotes(patient?.notes ?? '')
      setError(null)
    }
  }, [open, patient])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!fullName.trim() || !phone.trim()) {
      setError('Ad soyad ve telefon zorunludur.')
      return
    }

    setSaving(true)
    try {
      const input = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        identity_no: identityNo.trim(),
        notes,
      }
      const saved = patient
        ? await updatePatient(patient.id, input)
        : await createPatient(input)
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Hasta kaydedilirken bir hata oluştu.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={isEditing ? 'Hastayı Düzenle' : 'Yeni Hasta Ekle'}
      description={
        isEditing
          ? 'Hasta bilgilerini, notları ve ödeme durumunu güncelleyin.'
          : 'Kliniğe yeni hasta kaydı oluşturun.'
      }
      onClose={onClose}
      wide
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClassName}>Ad Soyad</span>
            <input
              type="text"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Örn. Ayşe Yılmaz"
              className={inputClassName}
            />
          </label>

          <label className="block">
            <span className={labelClassName}>Telefon</span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="05xx xxx xx xx"
              className={inputClassName}
            />
          </label>
        </div>

        <label className="block">
          <span className={labelClassName}>TC Kimlik No (isteğe bağlı)</span>
          <input
            type="text"
            value={identityNo}
            onChange={(event) => setIdentityNo(event.target.value)}
            placeholder="11 haneli T.C. kimlik no"
            className={inputClassName}
          />
        </label>

        <label className="block">
          <span className={labelClassName}>Hasta Notu (isteğe bağlı)</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Alerji, özel durum, genel notlar..."
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
            {isEditing ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
