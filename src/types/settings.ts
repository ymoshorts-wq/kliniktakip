export interface ServerSettings {
  supabaseUrl: string
  supabaseAnonKey: string
  sharedPassword: string
}

export type ConnectionStatus = 'idle' | 'checking' | 'connected' | 'error' | 'missing'
