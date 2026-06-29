import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  checkDatabaseSchema,
  initSupabaseClient,
  resetSupabaseClient,
  validateSupabaseConnection,
} from '../lib/supabase'
import { loadServerSettings, saveServerSettings } from '../lib/storage'
import type { ConnectionStatus, ServerSettings } from '../types/settings'

interface AppContextValue {
  settings: ServerSettings | null
  connectionStatus: ConnectionStatus
  connectionError: string | null
  isSettingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
  saveSettings: (settings: ServerSettings) => Promise<boolean>
  retryConnection: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ServerSettings | null>(() =>
    loadServerSettings(),
  )
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('idle')
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const connect = useCallback(async (nextSettings: ServerSettings) => {
    setConnectionStatus('checking')
    setConnectionError(null)

    const result = await validateSupabaseConnection(nextSettings)

    if (!result.ok) {
      resetSupabaseClient()
      setConnectionStatus('error')
      setConnectionError(
        result.error ??
          'Supabase bağlantısı kurulamadı. URL veya API anahtarı hatalı olabilir.',
      )
      setIsSettingsOpen(true)
      return false
    }

    initSupabaseClient(nextSettings)

    const schemaReady = await checkDatabaseSchema()
    if (!schemaReady) {
      setConnectionError(
        'Bağlantı başarılı, ancak veritabanı tabloları henüz oluşturulmamış. Supabase SQL Editor\'de supabase/schema.sql dosyasını çalıştırın.',
      )
    } else {
      setConnectionError(null)
    }
    setSettings(nextSettings)
    setConnectionStatus('connected')
    return true
  }, [])

  const retryConnection = useCallback(async () => {
    const stored = loadServerSettings()
    if (!stored) {
      setSettings(null)
      resetSupabaseClient()
      setConnectionStatus('missing')
      setConnectionError(
        'Sunucu ayarları bulunamadı. Lütfen Supabase bilgilerinizi girin.',
      )
      setIsSettingsOpen(true)
      return
    }

    await connect(stored)
  }, [connect])

  useEffect(() => {
    void retryConnection()
  }, [retryConnection])

  const saveSettings = useCallback(
    async (nextSettings: ServerSettings) => {
      saveServerSettings(nextSettings)
      const success = await connect(nextSettings)
      if (success) {
        setIsSettingsOpen(false)
      }
      return success
    },
    [connect],
  )

  const value = useMemo<AppContextValue>(
    () => ({
      settings,
      connectionStatus,
      connectionError,
      isSettingsOpen,
      openSettings: () => setIsSettingsOpen(true),
      closeSettings: () => setIsSettingsOpen(false),
      saveSettings,
      retryConnection,
    }),
    [
      settings,
      connectionStatus,
      connectionError,
      isSettingsOpen,
      saveSettings,
      retryConnection,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
