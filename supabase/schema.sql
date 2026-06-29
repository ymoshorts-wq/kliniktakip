-- Diş Kliniği Takip Uygulaması — Veritabanı Şeması (v2)
-- Ödeme bilgileri hasta kaydında; randevular sadece tarih ve tedavi notu tutar.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS patients (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name        TEXT           NOT NULL,
  phone            TEXT           NOT NULL,
  identity_no      TEXT           UNIQUE,
  notes            TEXT,
  total_amount     NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  paid_amount      NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  remaining_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (remaining_amount >= 0),
  payment_status   TEXT           NOT NULL DEFAULT 'Ödenmedi'
                   CHECK (payment_status IN ('Ödendi', 'Kısmi Ödeme', 'Ödenmedi')),
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  CHECK (paid_amount <= total_amount)
);

CREATE INDEX IF NOT EXISTS idx_patients_full_name ON patients (full_name);
CREATE INDEX IF NOT EXISTS idx_patients_phone     ON patients (phone);
CREATE INDEX IF NOT EXISTS idx_patients_debt      ON patients (remaining_amount);
CREATE INDEX IF NOT EXISTS idx_patients_status    ON patients (payment_status);

CREATE TABLE IF NOT EXISTS doctors (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
	id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	patient_id       UUID        NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
	doctor_id        UUID            REFERENCES doctors (id) ON DELETE SET NULL,
	appointment_date TIMESTAMPTZ NOT NULL,
	notes            TEXT,
	created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       UUID        NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  transaction_type TEXT        NOT NULL CHECK (transaction_type IN ('debt', 'payment')),
  amount           NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  description      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Eski şemadan gelen veritabanlarında appointments tablosunda doctor_id kolonu olmayabilir.
-- Aşağıdaki ALTER TABLE, kolonu yoksa ekler; varsa (yeni kurulumlarda) sessizce geçer.
ALTER TABLE appointments
	ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES doctors (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_doctors_name           ON doctors (full_name);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id  ON appointments (doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date       ON appointments (appointment_date);
CREATE INDEX IF NOT EXISTS idx_transactions_patient_id ON patient_transactions (patient_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON patient_transactions (created_at DESC);

-- Hasta bazlı ek dosyalar (ör: muayene fotoğrafları) için tablo
CREATE TABLE IF NOT EXISTS patient_attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  provider    TEXT NOT NULL DEFAULT 'imgbb',
  external_id TEXT NOT NULL,
  link        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hasta anamnez bilgileri (genel notlardan ayrı tutulur)
CREATE TABLE IF NOT EXISTS patient_anamneses (
  patient_id UUID PRIMARY KEY REFERENCES patients (id) ON DELETE CASCADE,
  anamnesis  TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE patients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors               ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_transactions  ENABLE ROW LEVEL SECURITY;

ALTER TABLE patient_attachments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_anamneses     ENABLE ROW LEVEL SECURITY;

-- Eski şemadan gelen veritabanlarında patients tablosunda identity_no kolonu olmayabilir.
-- Aşağıdaki ALTER TABLE, kolonu yoksa ekler; varsa sessizce geçer.
ALTER TABLE patients
	ADD COLUMN IF NOT EXISTS identity_no TEXT UNIQUE;

-- Politikaları tekrar tekrar oluşturabilmek için önce varsa siliyoruz (idempotent kullanım için)
DROP POLICY IF EXISTS "patients_select" ON patients;
DROP POLICY IF EXISTS "patients_insert" ON patients;
DROP POLICY IF EXISTS "patients_update" ON patients;
DROP POLICY IF EXISTS "patients_delete" ON patients;

CREATE POLICY "patients_select" ON patients
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "patients_insert" ON patients
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "patients_update" ON patients
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "patients_delete" ON patients
  FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "appointments_select" ON appointments;
DROP POLICY IF EXISTS "appointments_insert" ON appointments;
DROP POLICY IF EXISTS "appointments_update" ON appointments;
DROP POLICY IF EXISTS "appointments_delete" ON appointments;

CREATE POLICY "appointments_select" ON appointments
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "appointments_insert" ON appointments
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "appointments_update" ON appointments
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "appointments_delete" ON appointments
  FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "doctors_select" ON doctors;
DROP POLICY IF EXISTS "doctors_insert" ON doctors;
DROP POLICY IF EXISTS "doctors_update" ON doctors;
DROP POLICY IF EXISTS "doctors_delete" ON doctors;

CREATE POLICY "doctors_select" ON doctors
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "doctors_insert" ON doctors
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "doctors_update" ON doctors
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "doctors_delete" ON doctors
  FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "transactions_select" ON patient_transactions;
DROP POLICY IF EXISTS "transactions_insert" ON patient_transactions;
DROP POLICY IF EXISTS "transactions_delete" ON patient_transactions;

CREATE POLICY "transactions_select" ON patient_transactions
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "transactions_insert" ON patient_transactions
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "transactions_delete" ON patient_transactions
  FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "attachments_select" ON patient_attachments;
DROP POLICY IF EXISTS "attachments_insert" ON patient_attachments;
DROP POLICY IF EXISTS "attachments_delete" ON patient_attachments;

CREATE POLICY "attachments_select" ON patient_attachments
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "attachments_insert" ON patient_attachments
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "attachments_delete" ON patient_attachments
  FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anamneses_select" ON patient_anamneses;
DROP POLICY IF EXISTS "anamneses_insert" ON patient_anamneses;
DROP POLICY IF EXISTS "anamneses_update" ON patient_anamneses;

CREATE POLICY "anamneses_select" ON patient_anamneses
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anamneses_insert" ON patient_anamneses
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anamneses_update" ON patient_anamneses
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION add_patient_transaction(
  p_patient_id UUID,
  p_transaction_type TEXT,
  p_amount NUMERIC,
  p_description TEXT DEFAULT NULL
)
RETURNS patient_transactions
LANGUAGE plpgsql
AS $$
DECLARE
  v_inserted patient_transactions;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be a positive number';
  END IF;

  IF lower(p_transaction_type) NOT IN ('debt', 'payment') THEN
    RAISE EXCEPTION 'Transaction type must be debt or payment';
  END IF;

  INSERT INTO patient_transactions (patient_id, transaction_type, amount, description)
  VALUES (
    p_patient_id,
    lower(p_transaction_type),
    p_amount,
    NULLIF(BTRIM(p_description), '')
  )
  RETURNING * INTO v_inserted;

  IF v_inserted.transaction_type = 'debt' THEN
    UPDATE patients
      SET total_amount = total_amount + v_inserted.amount
      WHERE id = p_patient_id;
  ELSE
    UPDATE patients
      SET paid_amount = paid_amount + v_inserted.amount
      WHERE id = p_patient_id;
  END IF;

  UPDATE patients
    SET remaining_amount = GREATEST(total_amount - paid_amount, 0),
        payment_status = CASE
          WHEN total_amount <= 0 OR paid_amount >= total_amount THEN 'Ödendi'
          WHEN paid_amount > 0 THEN 'Kısmi Ödeme'
          ELSE 'Ödenmedi'
        END
    WHERE id = p_patient_id;

  RETURN v_inserted;
END;
$$;
