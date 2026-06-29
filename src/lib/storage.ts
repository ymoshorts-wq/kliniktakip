import type { ServerSettings } from '../types/settings'

const STORAGE_KEY = 'dental-clinic.server-settings'

export function loadServerSettings(): ServerSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<ServerSettings>
    if (
      !parsed.supabaseUrl?.trim() ||
      !parsed.supabaseAnonKey?.trim() ||
      !parsed.sharedPassword?.trim()
    ) {
      return null
    }

    return {
      supabaseUrl: parsed.supabaseUrl.trim(),
      supabaseAnonKey: parsed.supabaseAnonKey.trim(),
      sharedPassword: parsed.sharedPassword.trim(),
    }
  } catch {
    return null
  }
}

export function saveServerSettings(settings: ServerSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function clearServerSettings(): void {
  localStorage.removeItem(STORAGE_KEY)
}
