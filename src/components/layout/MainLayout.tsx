import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { connectionStatus, connectionError, retryConnection } = useApp()

  const showBlockingWarning =
    connectionStatus === 'missing' ||
    connectionStatus === 'error' ||
    connectionStatus === 'checking'

  const showSchemaWarning =
    connectionStatus === 'connected' && Boolean(connectionError)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <TopBar />

        {showBlockingWarning && (
          <div
            className={`mx-4 mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 sm:mx-6 ${
              connectionStatus === 'checking'
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-medium">
                {connectionStatus === 'checking'
                  ? 'Supabase bağlantısı kontrol ediliyor...'
                  : 'Sunucu ayarları gerekli'}
              </p>
              {connectionError && (
                <p className="mt-1 text-xs opacity-90">{connectionError}</p>
              )}
            </div>
            {connectionStatus !== 'checking' && (
              <button
                type="button"
                onClick={() => void retryConnection()}
                className="inline-flex items-center gap-1 rounded-lg border border-current/20 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-white/40"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Yeniden dene
              </button>
            )}
          </div>
        )}

        {showSchemaWarning && (
          <div className="mx-4 mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 sm:mx-6">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-sm">{connectionError}</p>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>

      <MobileNav />
    </div>
  )
}
