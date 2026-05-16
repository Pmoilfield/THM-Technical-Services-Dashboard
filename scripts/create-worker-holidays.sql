-- Worker scheduled time off / holidays
CREATE TABLE IF NOT EXISTS worker_holidays (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id   uuid NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  start_date  date NOT NULL,
  end_date    date NOT NULL,
  description text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS worker_holidays_worker_id_idx ON worker_holidays(worker_id);
CREATE INDEX IF NOT EXISTS worker_holidays_dates_idx     ON worker_holidays(start_date, end_date);

-- Allow authenticated users to read/write their own records
ALTER TABLE worker_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated full access" ON worker_holidays
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
