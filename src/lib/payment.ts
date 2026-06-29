import type { Patient } from '../types/database'

export function summarizeTransactions(transactions: {
  transaction_type: 'debt' | 'payment'
  amount: number
}[]): Pick<Patient, 'total_amount' | 'paid_amount' | 'remaining_amount' | 'payment_status'> {
  const totals = transactions.reduce(
    (acc, trx) => {
      if (trx.transaction_type === 'debt') {
        acc.total += trx.amount
      } else {
        acc.paid += trx.amount
      }
      return acc
    },
    { total: 0, paid: 0 },
  )

  const remaining = Math.max(totals.total - totals.paid, 0)
  const payment_status =
    totals.total <= 0 || totals.paid >= totals.total
      ? 'Ödendi'
      : totals.paid > 0
        ? 'Kısmi Ödeme'
        : 'Ödenmedi'

  return {
    total_amount: totals.total,
    paid_amount: totals.paid,
    remaining_amount: remaining,
    payment_status,
  }
}
