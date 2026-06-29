import { getSupabaseClient } from './supabase'

export function requireSupabaseClient() {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Supabase bağlantısı kurulmamış. Sunucu ayarlarını kontrol edin.')
  }
  return client
}
