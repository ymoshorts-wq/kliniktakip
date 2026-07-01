import {
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PatientDetail } from '../components/patients/PatientDetail'
import { PatientForm } from '../components/patients/PatientForm'
import { PaymentBadge } from '../components/ui/PaymentBadge'
import { useApp } from '../context/AppContext'
import { formatDate, formatMoney } from '../lib/format'
import { deletePatient, fetchPatients } from '../services/patients'
import type { Patient, PatientSortOption } from '../types/database'

function sortPatients(list: Patient[], sort: PatientSortOption): Patient[] {
  const sorted = [...list]
  switch (sort) {
    case 'name-asc':
      return sorted.sort((a, b) => a.full_name.localeCompare(b.full_name, 'tr'))
    case 'name-desc':
      return sorted.sort((a, b) => b.full_name.localeCompare(a.full_name, 'tr'))
    case 'created-asc':
      return sorted.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
    case 'created-desc':
      return sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    default:
      return sorted
  }
}

export function PatientsPage() {
  const { connectionStatus } = useApp()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<PatientSortOption>('name-asc')
  const [debtorsOnly, setDebtorsOnly] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)

  const loadPatients = useCallback(async () => {
    if (connectionStatus !== 'connected') return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPatients(search.trim() || undefined)
      setPatients(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Hastalar yüklenirken hata oluştu.',
      )
    } finally {
      setLoading(false)
    }
  }, [connectionStatus, search])

  useEffect(() => {
    const timer = setTimeout(() => void loadPatients(), search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [loadPatients, search])

  const displayedPatients = useMemo(() => {
    let list = patients
    if (debtorsOnly) {
      list = list.filter((p) => Number(p.remaining_amount) > 0)
    }
    return sortPatients(list, sort)
  }, [patients, debtorsOnly, sort])

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedId) ?? null,
    [patients, selectedId],
  )

  const handleSelect = (patient: Patient) => {
    setSelectedId(patient.id)
    setMobileShowDetail(true)
  }

  const handleDelete = async (patient: Patient) => {
    if (
      !window.confirm(
        `${patient.full_name} kaydını silmek istediğinize emin misiniz? Tüm randevular da silinir.`,
      )
    ) {
      return
    }

    try {
      await deletePatient(patient.id)
      if (selectedId === patient.id) {
        setSelectedId(null)
        setMobileShowDetail(false)
      }
      await loadPatients()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Hasta silinirken hata oluştu.',
      )
    }
  }

  const handleSaved = (saved: Patient) => {
    setSelectedId(saved.id)
    void loadPatients()
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[500px] flex-col gap-4 md:h-[calc(100vh-7rem)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Hasta Listesi</h2>
          <p className="text-sm text-slate-500">
            Arayın, filtreleyin ve geçmiş randevu kronolojisini görüntüleyin.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadPatients()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Yenile</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingPatient(null)
              setFormOpen(true)
            }}
            disabled={connectionStatus !== 'connected'}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Yeni Hasta
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section
          className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${
            mobileShowDetail ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="space-y-3 border-b border-slate-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
               <input
                 type="search"
                 value={search}
                 onChange={(event) => setSearch(event.target.value)}
                 placeholder="İsim, telefon veya TC ile hızlı ara..."
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none ring-sky-500 focus:ring-2"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Sırala:
              </div>
              <select
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value as PatientSortOption)
                }
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none ring-sky-500 focus:ring-2"
              >
                <option value="name-asc">İsim (A-Z)</option>
                <option value="name-desc">İsim (Z-A)</option>
                <option value="created-desc">Kayıt (Yeni-Eski)</option>
                <option value="created-asc">Kayıt (Eski-Yeni)</option>
              </select>

              <button
                type="button"
                onClick={() => setDebtorsOnly((current) => !current)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  debtorsOnly
                    ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Borcu Olan Hastalar
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && (
              <p className="p-6 text-center text-sm text-slate-500">
                Yükleniyor...
              </p>
            )}

            {!loading && displayedPatients.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
                <Users className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">Hasta bulunamadı.</p>
              </div>
            )}

            <ul className="divide-y divide-slate-100">
              {displayedPatients.map((patient) => (
                <li key={patient.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(patient)}
                    className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-sky-50/60 ${
                      selectedId === patient.id ? 'bg-sky-50' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {patient.full_name}
                      </p>
                       <p className="text-xs text-slate-500">
                         {patient.phone}
                         {patient.identity_no && ` • TC: ${patient.identity_no}`}
                       </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Kayıt: {formatDate(patient.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <PaymentBadge
                        status={patient.payment_status}
                        patient={patient}
                      />
                      {Number(patient.remaining_amount) > 0 && (
                        <span className="text-xs font-medium text-rose-600">
                          {formatMoney(Number(patient.remaining_amount))} ₺
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className={`min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${
            mobileShowDetail ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
          }`}
        >
          {selectedPatient ? (
            <PatientDetail
              patient={selectedPatient}
              onEdit={(patient) => {
                setEditingPatient(patient)
                setFormOpen(true)
              }}
              onDelete={(patient) => void handleDelete(patient)}
              onBack={() => setMobileShowDetail(false)}
              onPatientUpdated={(updated) => {
                setPatients((current) =>
                  current.map((p) => (p.id === updated.id ? updated : p)),
                )
              }}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
              <Users className="h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">
                Detay için bir hasta seçin
              </p>
              <p className="max-w-xs text-xs text-slate-500">
                Geçmiş randevu kronolojisi, tedavi notları ve ödeme özeti burada
                görünecek.
              </p>
            </div>
          )}
        </section>
      </div>

      <PatientForm
        open={formOpen}
        patient={editingPatient}
        onClose={() => {
          setFormOpen(false)
          setEditingPatient(null)
        }}
        onSaved={handleSaved}
      />
    </div>
  )
}
