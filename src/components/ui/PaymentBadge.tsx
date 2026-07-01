import type { PaymentStatus, Patient } from '../../types/database'
import { getDisplayPaymentStatus } from '../../lib/payment'

const styles: Record<PaymentStatus, string> = {
  Ödendi: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'Kısmi Ödeme': 'bg-amber-50 text-amber-700 ring-amber-200',
  Ödenmedi: 'bg-rose-50 text-rose-700 ring-rose-200',
}

interface PaymentBadgeProps {
  status: PaymentStatus
  patient?: Pick<Patient, 'total_amount' | 'paid_amount' | 'payment_status'>
  className?: string
}

export function PaymentBadge({ status, patient, className = '' }: PaymentBadgeProps) {
  const effectiveStatus = patient
    ? getDisplayPaymentStatus(patient)
    : status

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[effectiveStatus]} ${className}`}
    >
      {effectiveStatus}
    </span>
  )
}
