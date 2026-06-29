-- Mevcut veritabanını v2 şemasına yükseltir (ödeme randevudan hastaya taşınır).
-- Supabase SQL Editor'de bir kez çalıştırın.

-- 1) Hasta tablosuna yeni alanlar
ALTER TABLE patients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'Ödenmedi';

-- 2) Eski randevu ödemelerini hastaya aktar (varsa)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'total_amount'
  ) THEN
    UPDATE patients p
    SET
      total_amount = COALESCE(s.total, 0),
      paid_amount = COALESCE(s.paid, 0),
      remaining_amount = GREATEST(COALESCE(s.total, 0) - COALESCE(s.paid, 0), 0),
      payment_status = CASE
        WHEN COALESCE(s.total, 0) <= 0 OR COALESCE(s.paid, 0) >= COALESCE(s.total, 0) THEN 'Ödendi'
        WHEN COALESCE(s.paid, 0) > 0 THEN 'Kısmi Ödeme'
        ELSE 'Ödenmedi'
      END
    FROM (
      SELECT
        patient_id,
        SUM(total_amount) AS total,
        SUM(paid_amount) AS paid
      FROM appointments
      GROUP BY patient_id
    ) s
    WHERE p.id = s.patient_id;
  END IF;
END $$;

-- 3) Randevu tablosundan ödeme sütunlarını kaldır
ALTER TABLE appointments DROP COLUMN IF EXISTS total_amount;
ALTER TABLE appointments DROP COLUMN IF EXISTS paid_amount;
ALTER TABLE appointments DROP COLUMN IF EXISTS remaining_amount;
ALTER TABLE appointments DROP COLUMN IF EXISTS payment_status;

-- 4) İndeksler
CREATE INDEX IF NOT EXISTS idx_patients_debt   ON patients (remaining_amount);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients (payment_status);
DROP INDEX IF EXISTS idx_appointments_status;

-- 5) Hasta ödeme kısıtları
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_paid_lte_total;
ALTER TABLE patients ADD CONSTRAINT patients_paid_lte_total CHECK (paid_amount <= total_amount);

ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_payment_status_check;
ALTER TABLE patients ADD CONSTRAINT patients_payment_status_check
  CHECK (payment_status IN ('Ödendi', 'Kısmi Ödeme', 'Ödenmedi'));
