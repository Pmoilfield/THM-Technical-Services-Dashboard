-- ── Worker Certifications ────────────────────────────────────────────────────
-- Tracks CWB and B-Pressure weld certifications per worker.
-- cert_type is open text to allow future cert types beyond CWB/B-Pressure.

CREATE TABLE IF NOT EXISTS worker_certifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id   uuid NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  cert_type   text NOT NULL,          -- 'CWB' | 'B-Pressure'
  cert_number text,                   -- e.g. "W47.2-2019-12345"
  expiry_date date,
  notes       text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS worker_certs_worker_idx ON worker_certifications(worker_id);

ALTER TABLE worker_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated full access" ON worker_certifications
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
