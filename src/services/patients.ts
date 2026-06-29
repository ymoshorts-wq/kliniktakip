import { requireSupabaseClient } from '../lib/client'
import type { Patient, PatientInput, PatientTransaction } from '../types/database'

const PATIENT_SELECT = '*'

function toPatientPayload(input: PatientInput) {
  return {
    full_name: input.full_name.trim(),
    phone: input.phone.trim(),
    identity_no: input.identity_no.trim() || null,
    notes: input.notes.trim() || null,
  }
}

export async function fetchPatients(search?: string): Promise<Patient[]> {
  const supabase = requireSupabaseClient()
  let query = supabase
    .from('patients')
    .select(PATIENT_SELECT)
    .order('full_name', { ascending: true })

  if (search?.trim()) {
    const term = search.trim().replace(/,/g, '')
    query = query.or(
      `full_name.ilike.%${term}%,phone.ilike.%${term}%,identity_no.ilike.%${term}%`,
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function fetchPatientById(id: string): Promise<Patient | null> {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase
    .from('patients')
    .select(PATIENT_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createPatient(input: PatientInput): Promise<Patient> {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase
    .from('patients')
    .insert(toPatientPayload(input))
    .select(PATIENT_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function updatePatient(
  id: string,
  input: PatientInput,
): Promise<Patient> {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase
    .from('patients')
    .update(toPatientPayload(input))
    .eq('id', id)
    .select(PATIENT_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function deletePatient(id: string): Promise<void> {
  const supabase = requireSupabaseClient()
  const { error } = await supabase.from('patients').delete().eq('id', id)
  if (error) throw error
}

export async function fetchPatientTransactions(
  patientId: string,
): Promise<PatientTransaction[]> {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase
    .from('patient_transactions')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function addPatientTransaction(
  patientId: string,
  payload: Pick<PatientTransaction, 'transaction_type' | 'amount' | 'description'>,
): Promise<PatientTransaction> {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase
    .rpc('add_patient_transaction', {
      p_patient_id: patientId,
      p_transaction_type: payload.transaction_type,
      p_amount: payload.amount,
      p_description: payload.description,
    })
    .single()

  if (error) throw error
  return data as PatientTransaction
}

export async function countPatients(): Promise<number> {
  const supabase = requireSupabaseClient()
  const { count, error } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })

  if (error) throw error
  return count ?? 0
}

export async function countDebtorPatients(): Promise<number> {
  const supabase = requireSupabaseClient()
  const { count, error } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .gt('remaining_amount', 0)

  if (error) throw error
  return count ?? 0
}
