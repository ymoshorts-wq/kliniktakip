import { ArrowLeft, Image as ImageIcon, Pencil, Phone, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent, type ChangeEvent } from 'react'
import { formatDate, formatDateTime, formatMoney } from '../../lib/format'
import { fetchAppointmentsByPatient } from '../../services/appointments'
import {
  addPatientTransaction,
  deletePatientTransaction,
  fetchPatientTransactions,
  fetchPatientById,
  recalculatePatientPayments,
  updatePatient,
} from '../../services/patients'
import { fetchAnamnesisByPatient, upsertAnamnesis } from '../../services/anamneses'
import { uploadImageToImgur } from '../../lib/imgur'
import type {
  Appointment,
  Patient,
  PatientAttachment,
  PatientTransaction,
} from '../../types/database'
import {
  createAttachment,
  deleteAttachment,
  fetchAttachmentsByPatient,
} from '../../services/attachments'
import { PaymentBadge } from '../ui/PaymentBadge'
import { PatientTimeline } from './PatientTimeline'

interface PatientDetailProps {
  patient: Patient
  onEdit: (patient: Patient) => void
  onDelete: (patient: Patient) => void
  onBack?: () => void
  onPatientUpdated?: (patient: Patient) => void
}

export function PatientDetail({
  patient,
  onEdit,
  onDelete,
  onBack,
  onPatientUpdated,
}: PatientDetailProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [transactions, setTransactions] = useState<PatientTransaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [txType, setTxType] = useState<'debt' | 'payment'>('debt')
  const [txAmount, setTxAmount] = useState('')
  const [txDescription, setTxDescription] = useState('')
  const [txSaving, setTxSaving] = useState(false)
  const [txError, setTxError] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState(patient.notes ?? '')
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesError, setNotesError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<PatientAttachment[]>([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [attachmentUploading, setAttachmentUploading] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState<PatientAttachment | null>(null)
  const [anamnesis, setAnamnesis] = useState('')
  const [editingAnamnesis, setEditingAnamnesis] = useState(false)
  const [anamnesisSaving, setAnamnesisSaving] = useState(false)
  const [anamnesisError, setAnamnesisError] = useState<string | null>(null)

  const loadTimeline = useCallback(async () => {
    setLoadingTimeline(true)
    try {
      setAppointments(await fetchAppointmentsByPatient(patient.id))
    } catch {
      setAppointments([])
    } finally {
      setLoadingTimeline(false)
    }
  }, [patient.id])

  const loadTransactions = useCallback(async () => {
    setLoadingTransactions(true)
    try {
      setTransactions(await fetchPatientTransactions(patient.id))
    } catch {
      setTransactions([])
    } finally {
      setLoadingTransactions(false)
    }
  }, [patient.id])

  const loadAttachments = useCallback(async () => {
    setLoadingAttachments(true)
    setAttachmentError(null)
    try {
      setAttachments(await fetchAttachmentsByPatient(patient.id))
    } catch (err) {
      setAttachments([])
      setAttachmentError(
        err instanceof Error
          ? err.message
          : 'Fotoğraflar yüklenirken bir hata oluştu.',
      )
    } finally {
      setLoadingAttachments(false)
    }
  }, [patient.id])

  const loadAnamnesis = useCallback(async () => {
    try {
      const data = await fetchAnamnesisByPatient(patient.id)
      setAnamnesis(data?.anamnesis ?? '')
      setEditingAnamnesis(false)
      setAnamnesisError(null)
    } catch {
      // anamnez yoksa veya hata varsa sessiz geç
    }
  }, [patient.id])

  const handleAddTransaction = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      setTxError(null)

      const parsedAmount = parseFloat(txAmount.replace(',', '.'))
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        setTxError('Tutar sıfırdan büyük bir sayı olmalıdır.')
        return
      }

      setTxSaving(true)
      try {
        await addPatientTransaction(patient.id, {
          transaction_type: txType,
          amount: parsedAmount,
          description: txDescription.trim() || null,
        })

        // Hareket listesini ve hasta özetini yenile
        await loadTransactions()

        try {
          const updated = await fetchPatientById(patient.id)
          if (updated && onPatientUpdated) {
            onPatientUpdated(updated)
          }
        } catch {
          // Hasta yenileme hatasını sessizce yut
        }

        setTxAmount('')
        setTxDescription('')
        setTxType('debt')
      } catch (err) {
        setTxError(
          err instanceof Error
            ? err.message
            : 'İşlem kaydedilirken bir hata oluştu.',
        )
      } finally {
        setTxSaving(false)
      }
    },
    [txAmount, txDescription, txType, patient.id, onPatientUpdated, loadTransactions],
  )

  const handleDeleteTransaction = useCallback(
    async (trx: PatientTransaction) => {
      if (
        !window.confirm(
          'Bu işlem kaydını silmek istediğinize emin misiniz? İşlem geri alınamaz.',
        )
      ) {
        return
      }

      setTxError(null)
      try {
        await deletePatientTransaction(trx.id)

        // İşlemi listeden çıkar
        setTransactions((current) => current.filter((t) => t.id !== trx.id))

        // Hastanın ödeme özetini tekrar hesapla
        try {
          const updated = await recalculatePatientPayments(patient.id)
          if (updated && onPatientUpdated) {
            onPatientUpdated(updated)
          }
        } catch {
          // Özet yenileme hatasını sessizce yut
        }
      } catch (err) {
        setTxError(
          err instanceof Error
            ? err.message
            : 'İşlem silinirken bir hata oluştu.',
        )
      }
    },
    [onPatientUpdated, patient.id],
  )

  useEffect(() => {
    void loadTimeline()
    void loadTransactions()
    void loadAttachments()
    void loadAnamnesis()
  }, [loadTimeline, loadTransactions, loadAttachments, loadAnamnesis])

  useEffect(() => {
    // Hasta değiştiğinde not taslağını güncel tut
    setNotesDraft(patient.notes ?? '')
    setEditingNotes(false)
    setNotesError(null)
    // Anamnez hasta değişince yeniden yüklenecek, burada sadece local state'i sıfırlıyoruz
    setEditingAnamnesis(false)
    setAnamnesisError(null)
  }, [patient])

  const handleSaveNotes = useCallback(async () => {
    setNotesError(null)

    setNotesSaving(true)
    try {
      const updated = await updatePatient(patient.id, {
        full_name: patient.full_name,
        phone: patient.phone,
        identity_no: patient.identity_no ?? '',
        notes: notesDraft,
      })

      if (onPatientUpdated) {
        onPatientUpdated(updated)
      }

      setEditingNotes(false)
    } catch (err) {
      setNotesError(
        err instanceof Error
          ? err.message
          : 'Hasta notu güncellenirken bir hata oluştu.',
      )
    } finally {
      setNotesSaving(false)
    }
  }, [notesDraft, onPatientUpdated, patient.id, patient.full_name, patient.phone, patient.identity_no])

  const handleSaveAnamnesis = useCallback(async () => {
    setAnamnesisError(null)
    setAnamnesisSaving(true)

    try {
      const updated = await upsertAnamnesis(patient.id, anamnesis)
      setAnamnesis(updated.anamnesis ?? '')
      setEditingAnamnesis(false)
    } catch (err) {
      setAnamnesisError(
        err instanceof Error
          ? err.message
          : 'Anamnez kaydedilirken bir hata oluştu.',
      )
    } finally {
      setAnamnesisSaving(false)
    }
  }, [anamnesis, patient.id])

  const handleAddAttachment = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      setAttachmentError(null)
      setAttachmentUploading(true)

      try {
        const { id, link } = await uploadImageToImgur(file)

        const created = await createAttachment({
          patient_id: patient.id,
          provider: 'imgur',
          external_id: id,
          link,
          description: null,
        })

        setAttachments((current) => [created, ...current])
      } catch (err) {
        setAttachmentError(
          err instanceof Error
            ? err.message
            : 'Fotoğraf yüklenirken bir hata oluştu.',
        )
      } finally {
        setAttachmentUploading(false)
        // aynı dosyayı tekrar seçebilmek için
        event.target.value = ''
      }
    },
    [patient.id],
  )

  const handleDeleteAttachment = useCallback(
    async (attachment: PatientAttachment) => {
      if (
        !window.confirm(
          'Bu fotoğrafı silmek istediğinize emin misiniz? İşlem geri alınamaz.',
        )
      ) {
        return
      }

      setAttachmentError(null)
      try {
        await deleteAttachment(attachment.id)
        setAttachments((current) => current.filter((a) => a.id !== attachment.id))
        if (previewAttachment?.id === attachment.id) {
          setPreviewAttachment(null)
        }
      } catch (err) {
        setAttachmentError(
          err instanceof Error
            ? err.message
            : 'Fotoğraf silinirken bir hata oluştu.',
        )
      }
    },
    [previewAttachment?.id],
  )

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mb-2 inline-flex items-center gap-1 text-sm text-sky-600 md:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
                Listeye dön
              </button>
            )}
            <h2 className="truncate text-lg font-semibold text-slate-900">
              {patient.full_name}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <Phone className="h-3.5 w-3.5" />
              {patient.phone}
            </p>
            {patient.identity_no && (
              <p className="mt-0.5 text-xs text-slate-500">
                TC: {patient.identity_no}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Kayıt: {formatDate(patient.created_at)}
            </p>
          </div>

          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => onEdit(patient)}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-600"
              aria-label="Düzenle"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(patient)}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
              aria-label="Sil"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
        <section className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Ödeme Özeti</h3>
            <PaymentBadge status={patient.payment_status} />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-slate-500">Toplam</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatMoney(Number(patient.total_amount))} ₺
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Alınan</p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">
                {formatMoney(Number(patient.paid_amount))} ₺
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Kalan</p>
              <p className="mt-1 text-sm font-semibold text-rose-700">
                {formatMoney(Number(patient.remaining_amount))} ₺
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Hasta Notu</h3>
            <button
              type="button"
              onClick={() => {
                setEditingNotes((current) => !current)
                setNotesDraft(patient.notes ?? '')
                setNotesError(null)
              }}
              className="text-xs font-medium text-sky-600 hover:text-sky-700"
            >
              {editingNotes ? 'İptal' : patient.notes ? 'Notu Düzenle' : 'Not Ekle'}
            </button>
          </div>

          {editingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notesDraft}
                onChange={(event) => setNotesDraft(event.target.value)}
                rows={4}
                placeholder="Alerji, özel durum, genel notlar..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
              />
              {notesError && (
                <p className="text-xs text-rose-600">{notesError}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingNotes(false)
                    setNotesDraft(patient.notes ?? '')
                    setNotesError(null)
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  disabled={notesSaving}
                  onClick={() => void handleSaveNotes()}
                  className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {notesSaving ? 'Kaydediliyor...' : 'Notu Kaydet'}
                </button>
              </div>
            </div>
          ) : patient.notes ? (
            <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
              {patient.notes}
            </p>
          ) : (
            <p className="text-sm text-slate-400">
              Bu hastaya ait henüz bir not girilmemiş.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Anamnez</h3>
            <button
              type="button"
              onClick={() => {
                setEditingAnamnesis((current) => !current)
                setAnamnesisError(null)
              }}
              className="text-xs font-medium text-sky-600 hover:text-sky-700"
            >
              {editingAnamnesis ? 'İptal' : anamnesis ? 'Anamnezi Düzenle' : 'Anamnez Ekle'}
            </button>
          </div>

          {editingAnamnesis ? (
            <div className="space-y-2">
              <textarea
                value={anamnesis}
                onChange={(event) => setAnamnesis(event.target.value)}
                rows={5}
                placeholder="Hastanın anamnez bilgilerini buraya yazın..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
              />
              {anamnesisError && (
                <p className="text-xs text-rose-600">{anamnesisError}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAnamnesis(false)
                    setAnamnesisError(null)
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  disabled={anamnesisSaving}
                  onClick={() => void handleSaveAnamnesis()}
                  className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {anamnesisSaving ? 'Kaydediliyor...' : 'Anamnezi Kaydet'}
                </button>
              </div>
            </div>
          ) : anamnesis ? (
            <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
              {anamnesis}
            </p>
          ) : (
            <p className="text-sm text-slate-400">
              Bu hastaya ait henüz bir anamnez girilmemiş.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">
                Muayene Fotoğrafları
              </h3>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              <ImageIcon className="h-3 w-3" />
              <span>{attachmentUploading ? 'Yükleniyor...' : 'Fotoğraf Ekle'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void handleAddAttachment(event)}
                disabled={attachmentUploading}
              />
            </label>
          </div>

          {attachmentError && (
            <p className="mb-2 text-xs text-rose-600">{attachmentError}</p>
          )}

          {loadingAttachments ? (
            <p className="text-xs text-slate-500">Fotoğraflar yükleniyor...</p>
          ) : attachments.length === 0 ? (
            <p className="text-xs text-slate-500">
              Bu hastaya ait henüz muayene fotoğrafı eklenmemiş.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {attachments.map((attachment) => (
                <button
                  key={attachment.id}
                  type="button"
                  onClick={() => setPreviewAttachment(attachment)}
                  className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                >
                  <img
                    src={attachment.link}
                    alt={attachment.description ?? 'Muayene fotoğrafı'}
                    className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-start justify-end bg-gradient-to-b from-slate-900/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        void handleDeleteAttachment(attachment)
                      }}
                      className="m-1 rounded-full bg-slate-900/70 p-1 text-[10px] text-slate-100 hover:bg-rose-600"
                    >
                      Sil
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">
              Bakiye / Ödeme İşlemleri
            </h3>
          </div>

          <form onSubmit={handleAddTransaction} className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-full bg-slate-100 p-0.5 text-xs font-medium text-slate-700">
                <button
                  type="button"
                  onClick={() => setTxType('debt')}
                  className={`rounded-full px-3 py-1 transition-colors ${txType === 'debt' ? 'bg-rose-600 text-white' : ''}`}
                >
                  Bakiye Ekle
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('payment')}
                  className={`rounded-full px-3 py-1 transition-colors ${txType === 'payment' ? 'bg-emerald-600 text-white' : ''}`}
                >
                  Ödeme Ekle
                </button>
              </div>

              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={txAmount}
                onChange={(event) => setTxAmount(event.target.value)}
                placeholder="Tutar (₺)"
                className="w-32 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none ring-sky-500 focus:ring-2"
              />

              <input
                type="text"
                value={txDescription}
                onChange={(event) => setTxDescription(event.target.value)}
                placeholder="Açıklama (isteğe bağlı)"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none ring-sky-500 focus:ring-2"
              />

              <button
                type="submit"
                disabled={txSaving}
                className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {txSaving ? 'Kaydediliyor...' : 'İşlem Kaydet'}
              </button>
            </div>

            {txError && (
              <p className="text-xs text-rose-600">{txError}</p>
            )}
          </form>

          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
            {loadingTransactions ? (
              <p className="text-xs text-slate-500">İşlemler yükleniyor...</p>
            ) : transactions.length === 0 ? (
              <p className="text-xs text-slate-500">
                Henüz borç veya ödeme işlemi eklenmemiş.
              </p>
            ) : (
              transactions.map((trx) => (
                <div
                  key={trx.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <p
                      className={`font-semibold ${
                        trx.transaction_type === 'debt'
                          ? 'text-rose-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {trx.transaction_type === 'debt' ? 'Bakiye' : 'Ödeme'}{' '}
                      • {formatMoney(Number(trx.amount))} ₺
                    </p>
                    {trx.description && (
                      <p className="mt-0.5 truncate text-slate-600">
                        {trx.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      {formatDateTime(trx.created_at)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleDeleteTransaction(trx)}
                      className="rounded-full p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      aria-label="İşlemi sil"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Geçmiş Randevu Kronolojisi
          </h3>
          <PatientTimeline appointments={appointments} loading={loadingTimeline} />
        </section>
      </div>

      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="relative w-full max-w-3xl rounded-2xl bg-black/90 p-3 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewAttachment(null)}
              className="absolute right-3 top-3 rounded-full bg-slate-900/80 p-1.5 text-slate-200 hover:bg-slate-800"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={previewAttachment.link}
              alt={previewAttachment.description ?? 'Muayene fotoğrafı'}
              className="mx-auto max-h-[70vh] w-auto rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}
