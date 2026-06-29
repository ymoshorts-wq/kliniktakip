import { requireSupabaseClient } from '../lib/client'
import { getTodayRange } from '../lib/dateFilters'
import type {
  Appointment,
  AppointmentInput,
  AppointmentWithPatient,
} from '../types/database'

const APPOINTMENT_WITH_RELATIONS =
  '*, patients(full_name, phone, identity_no, payment_status, remaining_amount, total_amount, paid_amount), doctors (id, full_name)'

function toAppointmentPayload(input: AppointmentInput) {
  return {
    patient_id: input.patient_id,
    doctor_id: input.doctor_id ?? null,
    appointment_date: input.appointment_date,
    notes: input.notes.trim() || null,
  }
}

export async function fetchAppointments(): Promise<AppointmentWithPatient[]> {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase
    .from('appointments')
    .select(APPOINTMENT_WITH_RELATIONS)
    .order('appointment_date', { ascending: false })

  if (error) throw error
  return (data ?? []) as AppointmentWithPatient[]
}

export async function fetchAppointmentsByPatient(
  patientId: string,
): Promise<Appointment[]> {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('patient_id', patientId)
    .order('appointment_date', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createAppointment(
  input: AppointmentInput,
): Promise<Appointment> {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase
    .from('appointments')
    .insert(toAppointmentPayload(input))
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateAppointment(
  id: string,
  input: AppointmentInput,
): Promise<Appointment> {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase
    .from('appointments')
    .update(toAppointmentPayload(input))
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deleteAppointment(id: string): Promise<void> {
  const supabase = requireSupabaseClient()
  const { error } = await supabase.from('appointments').delete().eq('id', id)
  if (error) throw error
}

export async function countTodayAppointments(): Promise<number> {
  const supabase = requireSupabaseClient()
  const { start, end } = getTodayRange()

  const { count, error } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .gte('appointment_date', start)
    .lte('appointment_date', end)

  if (error) throw error
  return count ?? 0
}
