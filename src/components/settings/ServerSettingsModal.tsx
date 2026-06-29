import { Loader2, Trash2, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useApp } from '../../context/AppContext'
import { createDoctor, deleteDoctor, fetchDoctors } from '../../services/doctors'
import type { ServerSettings } from '../../types/settings'
import type { Doctor } from '../../types/database'

export function ServerSettingsModal() {
  const {
    isSettingsOpen,
    closeSettings,
    saveSettings,
    settings,
    connectionError,
    connectionStatus,
  } = useApp()

  const [form, setForm] = useState<ServerSettings>({
    supabaseUrl: '',
    supabaseAnonKey: '',
    sharedPassword: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [doctorName, setDoctorName] = useState('')
  const [doctorError, setDoctorError] = useState<string | null>(null)

  useEffect(() => {
    if (isSettingsOpen) {
      setForm({
        supabaseUrl: settings?.supabaseUrl ?? '',
        supabaseAnonKey: settings?.supabaseAnonKey ?? '',
        sharedPassword: settings?.sharedPassword ?? '',
      })
      setFormError(null)
    }
  }, [isSettingsOpen, settings])

  useEffect(() => {
    if (!isSettingsOpen || connectionStatus !== 'connected') return

    const loadDoctors = async () => {
      setLoadingDoctors(true)
      try {
        setDoctors(await fetchDoctors())
      } catch {
        setDoctors([])
      } finally {
        setLoadingDoctors(false)
      }
    }

    void loadDoctors()
  }, [isSettingsOpen, connectionStatus])

  if (!isSettingsOpen) return null
 
   const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    if (
      !form.supabaseUrl.trim() ||
      !form.supabaseAnonKey.trim() ||
      !form.sharedPassword.trim()
    ) {
      setFormError('Tüm alanları doldurmanız gerekiyor.')
      return
    }

    setIsSaving(true)
    const success = await saveSettings({
      supabaseUrl: form.supabaseUrl.trim(),
      supabaseAnonKey: form.supabaseAnonKey.trim(),
      sharedPassword: form.sharedPassword.trim(),
    })
    setIsSaving(false)

    if (!success) {
      setFormError(
        connectionError ??
          'Bağlantı kurulamadı. Bilgileri kontrol edip tekrar deneyin.',
      )
    }
   }

   const handleAddDoctor = async () => {
     setDoctorError(null)

     if (!doctorName.trim()) {
       setDoctorError('Doktor adı boş olamaz.')
       return
     }

     if (connectionStatus !== 'connected') {
       setDoctorError('Doktor eklemek için önce Supabase bağlantısını tamamlayın.')
       return
     }

     try {
       const created = await createDoctor(doctorName)
       setDoctors((current) => [...current, created])
       setDoctorName('')
     } catch (err) {
       setDoctorError(
         err instanceof Error
           ? err.message
           : 'Doktor eklenirken bir hata oluştu.',
       )
     }
   }

  const handleDeleteDoctor = async (doctor: Doctor) => {
    if (!window.confirm(`${doctor.full_name} kaydını silmek istediğinize emin misiniz?`)) {
      return
    }

    try {
      await deleteDoctor(doctor.id)
      setDoctors((current) => current.filter((d) => d.id !== doctor.id))
    } catch (err) {
      setDoctorError(
        err instanceof Error
          ? err.message
          : 'Doktor silinirken bir hata oluştu.',
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="server-settings-title"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2
              id="server-settings-title"
              className="text-lg font-semibold text-slate-900"
            >
              Sunucu Ayarları
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Supabase bağlantı bilgileri ve ortak giriş şifresi
            </p>
          </div>
          <button
            type="button"
            onClick={closeSettings}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="px-6 py-5">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Supabase URL
              </span>
              <input
                type="url"
                required
                value={form.supabaseUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    supabaseUrl: event.target.value,
                  }))
                }
                placeholder="https://xxxxx.supabase.co"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-sky-500 transition-shadow focus:ring-2"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Supabase API Anahtarı
              </span>
              <input
                type="password"
                required
                value={form.supabaseAnonKey}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    supabaseAnonKey: event.target.value,
                  }))
                }
                placeholder="sb_publishable_... veya eyJ..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-sky-500 transition-shadow focus:ring-2"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Dashboard → Project Settings → API → Publishable key veya legacy anon key.
              </p>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Ortak Giriş Şifresi
              </span>
              <input
                type="password"
                required
                value={form.sharedPassword}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sharedPassword: event.target.value,
                  }))
                }
                placeholder="Klinik personeli için ortak şifre"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-sky-500 transition-shadow focus:ring-2"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Bu şifre ileride uygulama içi erişim kontrolü için kullanılacak.
              </p>
            </label>
          </div>

          {(formError || connectionError) && (
            <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError ?? connectionError}
            </p>
          )}

          <div className="mt-6 border-t border-slate-200 pt-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Doktorlar</h3>
              <span className="text-xs text-slate-500">
                Doktor ekleme/silme işlemleri sadece buradan yapılır.
              </span>
            </div>

            {connectionStatus !== 'connected' ? (
              <p className="text-xs text-slate-500">
                Doktor yönetimi için önce Supabase bağlantısını tamamlayın.
              </p>
            ) : (
              <>
                 <div className="mb-3 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(event) => setDoctorName(event.target.value)}
                    placeholder="Yeni doktor adı"
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none ring-sky-500 focus:ring-2"
                  />
                   <button
                     type="button"
                     onClick={() => void handleAddDoctor()}
                     className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-700"
                   >
                    Doktor Ekle
                  </button>
                 </div>

                {doctorError && (
                  <p className="mb-2 text-xs text-rose-600">{doctorError}</p>
                )}

                <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
                  {loadingDoctors ? (
                    <p className="text-xs text-slate-500">Doktorlar yükleniyor...</p>
                  ) : doctors.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Henüz doktor eklenmemiş.
                    </p>
                  ) : (
                    doctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        className="flex items-center justify-between rounded-md bg-white px-2 py-1 text-xs text-slate-700"
                      >
                        <span className="truncate">{doctor.full_name}</span>
                        <button
                          type="button"
                          onClick={() => void handleDeleteDoctor(doctor)}
                          className="rounded p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Doktoru sil"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeSettings}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Kaydet ve Bağlan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
