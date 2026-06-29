import { requireSupabaseClient } from '../lib/client'
import type { Doctor, DoctorSummary } from '../types/database'

const DOCTOR_SELECT = '*'

export async function fetchDoctors(): Promise<Doctor[]> {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase
    .from('doctors')
    .select(DOCTOR_SELECT)
    .order('full_name', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createDoctor(fullName: string): Promise<Doctor> {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase
    .from('doctors')
    .insert({ full_name: fullName.trim() })
    .select(DOCTOR_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function deleteDoctor(id: string): Promise<void> {
  const supabase = requireSupabaseClient()
  const { error } = await supabase.from('doctors').delete().eq('id', id)
  if (error) throw error
}

export async function fetchDoctorSummaries(): Promise<DoctorSummary[]> {
  const doctors = await fetchDoctors()
  return doctors.map(({ id, full_name }) => ({ id, full_name }))
}