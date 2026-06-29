export type PaymentStatus = 'Ödendi' | 'Kısmi Ödeme' | 'Ödenmedi'

export interface Patient {
  id: string
  full_name: string
  phone: string
  identity_no: string | null
  notes: string | null
  total_amount: number
  paid_amount: number
  remaining_amount: number
  payment_status: PaymentStatus
  created_at: string
}

export interface Appointment {
  id: string
  patient_id: string
  doctor_id: string | null
  appointment_date: string
  notes: string | null
  created_at: string
}

export interface PatientSummary {
  full_name: string
  phone: string
  identity_no?: string | null
  payment_status: PaymentStatus
  remaining_amount: number
  total_amount: number
  paid_amount: number
}

export interface AppointmentWithPatient extends Appointment {
  patients: PatientSummary | null
  doctors?: DoctorSummary | null
}

export interface Doctor {
  id: string
  full_name: string
  created_at: string
}

export type DoctorSummary = Pick<Doctor, 'id' | 'full_name'>

export type TransactionType = 'debt' | 'payment'

export interface PatientTransaction {
  id: string
  patient_id: string
  transaction_type: TransactionType
  amount: number
  description: string | null
  created_at: string
}

export interface PatientAttachment {
  id: string
  patient_id: string
  provider: string
  external_id: string
  link: string
  description: string | null
  created_at: string
}

export interface PatientAnamnesis {
  patient_id: string
  anamnesis: string | null
  updated_at: string
}

export interface PatientInput {
  full_name: string
  phone: string
  identity_no: string
  notes: string
}

export interface AppointmentInput {
  patient_id: string
  doctor_id?: string | null
  appointment_date: string
  notes: string
}

export type PatientSortOption = 'name-asc' | 'name-desc' | 'created-asc' | 'created-desc'
export type AppointmentDateFilter = 'all' | 'today' | 'tomorrow' | 'week' | 'upcoming'
export type AppointmentSortOption = 'nearest' | 'farthest'
export type PaymentFilterOption = 'all' | PaymentStatus
export type DoctorFilterOption = 'all' | string
