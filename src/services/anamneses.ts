import { requireSupabaseClient } from '../lib/client'
import type { PatientAnamnesis } from '../types/database'

const ANAMNESIS_SELECT = '*'

export async function fetchAnamnesisByPatient(
  patientId: string,
): Promise<PatientAnamnesis | null> {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase
    .from('patient_anamneses')
    .select(ANAMNESIS_SELECT)
    .eq('patient_id', patientId)
    .maybeSingle()

  if (error) throw error
  return (data as PatientAnamnesis) ?? null
}

export async function upsertAnamnesis(
  patientId: string,
  anamnesis: string,
): Promise<PatientAnamnesis> {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase
    .from('patient_anamneses')
    .upsert(
      {
        patient_id: patientId,
        anamnesis,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'patient_id' },
    )
    .select(ANAMNESIS_SELECT)
    .single()

  if (error) throw error
  return data as PatientAnamnesis
}
