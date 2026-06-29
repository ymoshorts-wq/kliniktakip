import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { ServerSettings } from '../types/settings'

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  return client
}

export function initSupabaseClient(settings: ServerSettings): SupabaseClient {
  client = createClient(settings.supabaseUrl, settings.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
  return client
}

export function resetSupabaseClient(): void {
  client = null
}

export interface ConnectionValidationResult {
  ok: boolean
  error?: string
}

export async function validateSupabaseConnection(
  settings: ServerSettings,
): Promise<ConnectionValidationResult> {
  const baseUrl = settings.supabaseUrl.replace(/\/$/, '')

  if (!baseUrl.startsWith('https://') || !baseUrl.includes('.supabase.co')) {
    return {
      ok: false,
      error: 'Geçerli bir Supabase URL girin (https://xxx.supabase.co).',
    }
  }

  const apiKey = settings.supabaseAnonKey.trim()
  if (
    !apiKey.startsWith('eyJ') &&
    !apiKey.startsWith('sb_publishable_')
  ) {
    return {
      ok: false,
      error:
        'API anahtarı geçersiz görünüyor. Dashboard → Project Settings → API bölümünden anon veya publishable anahtarı kopyalayın.',
    }
  }

  try {
    // /rest/v1/ yeni sb_publishable_ anahtarlarında 401 döndürür; auth health doğru kontrol sağlar.
    const response = await fetch(`${baseUrl}/auth/v1/health`, {
      headers: { apikey: apiKey },
    })

    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        error: 'API anahtarı reddedildi. Supabase Dashboard\'dan doğru anahtarı kopyaladığınızdan emin olun.',
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        error: `Supabase yanıt verdi ancak beklenmeyen durum kodu: ${response.status}`,
      }
    }

    return { ok: true }
  } catch {
    return {
      ok: false,
      error: 'Supabase sunucusuna ulaşılamadı. URL ve internet bağlantınızı kontrol edin.',
    }
  }
}

export async function checkDatabaseSchema(): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  const { error } = await supabase.from('patients').select('id').limit(1)

  if (!error) return true
  if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
    return false
  }

  return true
}
