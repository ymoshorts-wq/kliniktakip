import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Loader2, Search } from 'lucide-react'
import { fetchPatients } from '../../services/patients'
import type { Patient } from '../../types/database'

interface PatientSearchSelectProps {
  value: string | null
  onChange: (patientId: string, patient: Patient) => void
  disabled?: boolean
}

export function PatientSearchSelect({
  value,
  onChange,
  disabled,
}: PatientSearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!value) {
      setSelectedLabel('')
      return
    }

    void fetchPatients()
      .then((list) => {
        const found = list.find((p) => p.id === value)
        if (found) {
          const idPart = found.identity_no ? ` — TC: ${found.identity_no}` : ''
          setSelectedLabel(`${found.full_name} — ${found.phone}${idPart}`)
        }
      })
      .catch(() => undefined)
  }, [value])

  useEffect(() => {
    if (!open) return

    const timer = setTimeout(() => {
      setLoading(true)
      void fetchPatients(search)
        .then(setPatients)
        .catch(() => setPatients([]))
        .finally(() => setLoading(false))
    }, 250)

    return () => clearTimeout(timer)
  }, [search, open])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-left text-sm outline-none ring-sky-500 transition-shadow focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={selectedLabel ? 'text-slate-900' : 'text-slate-400'}>
          {selectedLabel || 'Hasta ara ve seç...'}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ad, telefon veya TC ile ara..."
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none ring-sky-500 focus:ring-2"
                autoFocus
              />
            </div>
          </div>

          <ul className="max-h-52 overflow-y-auto py-1">
            {loading && (
              <li className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Aranıyor...
              </li>
            )}

            {!loading && patients.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-slate-500">
                Hasta bulunamadı
              </li>
            )}

            {!loading &&
              patients.map((patient) => (
                <li key={patient.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(patient.id, patient)
                      const idPart = patient.identity_no ? ` — TC: ${patient.identity_no}` : ''
                      setSelectedLabel(`${patient.full_name} — ${patient.phone}${idPart}`)
                      setOpen(false)
                      setSearch('')
                    }}
                    className={`flex w-full flex-col px-3 py-2.5 text-left text-sm transition-colors hover:bg-sky-50 ${
                      value === patient.id ? 'bg-sky-50 text-sky-700' : 'text-slate-700'
                    }`}
                  >
                     <span className="font-medium">{patient.full_name}</span>
                     <span className="text-xs text-slate-500">
                       {patient.phone}
                       {patient.identity_no && ` • TC: ${patient.identity_no}`}
                     </span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}
