import { useApp } from '../../context/AppContext'
import {
  getViewDescription,
  getViewTitle,
  useNavigation,
} from '../../context/NavigationContext'

export function TopBar() {
  const { connectionStatus } = useApp()
  const { currentView } = useNavigation()

  const statusLabel =
    connectionStatus === 'connected'
      ? 'Bağlı'
      : connectionStatus === 'checking'
        ? 'Bağlanıyor...'
        : 'Bağlantı gerekli'

  const statusClass =
    connectionStatus === 'connected'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : connectionStatus === 'checking'
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : 'bg-rose-50 text-rose-700 ring-rose-200'

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          {getViewTitle(currentView)}
        </h1>
        <p className="text-sm text-slate-500">{getViewDescription(currentView)}</p>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>
    </header>
  )
}
