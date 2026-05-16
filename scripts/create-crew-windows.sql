-- ── Crew Windows ─────────────────────────────────────────────────────────────
-- One or more deployment windows per project (e.g. Phase 1, Commissioning)
CREATE TABLE IF NOT EXISTS project_crew_windows (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description text,                  -- e.g. "Phase 1 – Electrical", "Commissioning"
  start_date  date NOT NULL,
  end_date    date NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crew_windows_project_idx ON project_crew_windows(project_id);
CREATE INDEX IF NOT EXISTS crew_windows_dates_idx   ON project_crew_windows(start_date, end_date);

ALTER TABLE project_crew_windows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated full access" ON project_crew_windows
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ── Crew Window Requirements ──────────────────────────────────────────────────
-- How many of each trade are needed for a given window
CREATE TABLE IF NOT EXISTS crew_window_requirements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  window_id   uuid NOT NULL REFERENCES project_crew_windows(id) ON DELETE CASCADE,
  trade       text NOT NULL,         -- Electrical, Instrumentation, Pipefitter, etc.
  headcount   int  NOT NULL DEFAULT 1,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(window_id, trade)
);

CREATE INDEX IF NOT EXISTS crew_req_window_idx ON crew_window_requirements(window_id);

ALTER TABLE crew_window_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated full access" ON crew_window_requirements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ── Crew Window Assignments ───────────────────────────────────────────────────
-- Which worker is assigned to which window
CREATE TABLE IF NOT EXISTS crew_window_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  window_id   uuid NOT NULL REFERENCES project_crew_windows(id) ON DELETE CASCADE,
  worker_id   uuid NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  trade       text,                  -- snapshot of trade at time of assignment
  notes       text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(window_id, worker_id)
);

CREATE INDEX IF NOT EXISTS crew_asgn_window_idx ON crew_window_assignments(window_id);
CREATE INDEX IF NOT EXISTS crew_asgn_worker_idx ON crew_window_assignments(worker_id);

ALTER TABLE crew_window_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated full access" ON crew_window_assignments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
