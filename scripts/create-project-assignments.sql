-- Worker dispatch assignments per project
CREATE TABLE IF NOT EXISTS project_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  worker_id   uuid NOT NULL REFERENCES workers(id)  ON DELETE CASCADE,
  trade       text,           -- snapshot of trade at time of assignment
  notes       text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(project_id, worker_id)
);

CREATE INDEX IF NOT EXISTS project_assignments_project_idx ON project_assignments(project_id);
CREATE INDEX IF NOT EXISTS project_assignments_worker_idx  ON project_assignments(worker_id);

ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated full access" ON project_assignments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
