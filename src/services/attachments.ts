import { requireSupabaseClient } from '../lib/client'
import type { PatientAttachment } from '../types/database'

const ATTACHMENT_SELECT = '*'

export async function fetchAttachmentsByPatient(
  patientId: string,
): Promise<PatientAttachment[]> {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase
    .from('patient_attachments')
    .select(ATTACHMENT_SELECT)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as PatientAttachment[]
}

export async function createAttachment(
  payload: Omit<PatientAttachment, 'id' | 'created_at'>,
): Promise<PatientAttachment> {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase
    .from('patient_attachments')
    .insert(payload)
    .select(ATTACHMENT_SELECT)
    .single()

  if (error) throw error
  return data as PatientAttachment
}

export async function deleteAttachment(id: string): Promise<void> {
  const supabase = requireSupabaseClient()
  const { error } = await supabase
    .from('patient_attachments')
    .delete()
    .eq('id', id)

  if (error) throw error
}
