-- THM Technical Services - Field App Database Schema
-- Run this in: Supabase Dashboard -> SQL Editor -> New Query

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null default 'worker', -- worker | foreman | pm | billing | admin
  trade_classification text,           -- links to rates.personnel (auto-fills their rate)
  province text default 'Alberta',
  phone text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- CLIENTS
-- ============================================================
create table clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  city text,
  province text,
  postal_code text,
  created_at timestamptz default now()
);

-- ============================================================
-- TC RATES
-- ============================================================
create table rates (
  id text primary key,
  province text not null,
  category text not null,
  personnel text not null,
  straight_rate numeric(10,2),
  overtime_rate numeric(10,2),
  created_at timestamptz default now()
);

-- ============================================================
-- PROJECTS
-- ============================================================
create table projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  client_id uuid references clients(id),
  client_name text,    -- denormalized for quick display
  location text,
  status text default 'Estimating', -- Estimating|Awarded|Active|Complete|On Hold|Cancelled
  estimate_no text,
  revision text,
  internal_job_no text,
  customer_project text,
  project_manager text,
  prepared_by text,
  start_date date,
  end_date date,
  scope text[],        -- array of bullet points
  schedule_only boolean default false,
  gst_rate numeric(6,4) default 0.05,
  default_markup numeric(6,4) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PROJECT TEAM (who can see/work on which project)
-- ============================================================
create table project_members (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(project_id, user_id)
);

-- ============================================================
-- ESTIMATE SECTIONS
-- ============================================================
create table estimate_sections (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  number integer not null,
  title text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- ESTIMATE LINE ITEMS
-- ============================================================
create table estimate_items (
  id uuid primary key default uuid_generate_v4(),
  section_id uuid references estimate_sections(id) on delete cascade,
  type text not null,      -- Labour | Equipment | Allowance | Third Party
  description text,
  supplier text,
  qty numeric(10,2),
  days numeric(10,2),
  reg_hours numeric(10,2),
  reg_rate numeric(10,2),
  ot_hours numeric(10,2),
  ot_rate numeric(10,2),
  cost numeric(12,2),
  markup numeric(6,4),
  rate_id text references rates(id),
  category text,
  original_total numeric(12,2),
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- TIME ENTRIES (worker daily submissions)
-- ============================================================
create table time_entries (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid references profiles(id),
  project_id uuid references projects(id),
  section_number integer,
  date date not null,
  role text,
  rate_id text references rates(id),
  straight_hours numeric(5,2) default 0,
  straight_rate numeric(10,2),
  overtime_hours numeric(5,2) default 0,
  overtime_rate numeric(10,2),
  -- Equipment on same entry
  equipment_description text,
  equipment_hours numeric(5,2),
  equipment_rate numeric(10,2),
  -- Materials on same entry
  materials_description text,
  materials_cost numeric(10,2),
  notes text,
  status text default 'submitted',  -- submitted | added_to_ticket | rejected
  field_ticket_id uuid,             -- set when foreman adds to a ticket
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- FIELD TICKETS
-- ============================================================
create table field_tickets (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id),
  ticket_number text not null,       -- FT-2026-0001
  date date not null,
  section_number integer,
  description text,
  status text default 'draft',       -- draft | submitted | approved | rejected | invoiced
  created_by uuid references profiles(id),
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  -- Cached totals (recalculated from items)
  labour_total numeric(12,2) default 0,
  equipment_total numeric(12,2) default 0,
  material_total numeric(12,2) default 0,
  subcontractor_total numeric(12,2) default 0,
  subtotal numeric(12,2) default 0,
  -- PDF storage
  pdf_path text,
  client_signed_path text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- FK for time_entries -> field_tickets
alter table time_entries
  add constraint time_entries_ticket_fk
  foreign key (field_ticket_id) references field_tickets(id);

-- ============================================================
-- FIELD TICKET LINE ITEMS
-- ============================================================
create table field_ticket_items (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid references field_tickets(id) on delete cascade,
  time_entry_id uuid references time_entries(id),  -- null = manually added by foreman
  type text not null,                              -- Labour | Equipment | Material | Subcontractor
  description text,
  worker_name text,
  role text,
  rate_id text references rates(id),
  straight_hours numeric(5,2),
  straight_rate numeric(10,2),
  overtime_hours numeric(5,2),
  overtime_rate numeric(10,2),
  quantity numeric(10,2),
  unit_cost numeric(10,2),
  markup numeric(6,4),
  total numeric(12,2),
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- PURCHASE ORDERS
-- ============================================================
create table purchase_orders (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id),
  date date,
  po_number text,
  vendor text,
  section_number integer,
  description text,
  value numeric(12,2),
  markup numeric(6,4),
  status text default 'Open',   -- Open | Closed
  created_at timestamptz default now()
);

-- ============================================================
-- INVOICES
-- ============================================================
create table invoices (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id),
  invoice_number text not null,     -- INV-2026-0001
  date date not null,
  due_date date,
  status text default 'draft',      -- draft | sent | paid | void
  subtotal numeric(12,2) default 0,
  gst_rate numeric(6,4) default 0.05,
  gst_amount numeric(12,2) default 0,
  total numeric(12,2) default 0,
  notes text,
  pdf_path text,
  sent_at timestamptz,
  paid_at timestamptz,
  sent_to_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Which field tickets are on this invoice
create table invoice_tickets (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references invoices(id) on delete cascade,
  ticket_id uuid references field_tickets(id),
  unique(invoice_id, ticket_id)
);

-- ============================================================
-- SCHEDULE BLOCKS
-- ============================================================
create table schedule_blocks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id),
  name text not null,
  job_no text,
  status text default 'Planned',   -- Planned | Active | On Hold | Complete
  start_date date,
  end_date date,
  total_loaded_man_days numeric(10,2),
  source_row integer,
  flags text[],
  match_status text,
  created_at timestamptz default now()
);

create table schedule_disciplines (
  id uuid primary key default uuid_generate_v4(),
  block_id uuid references schedule_blocks(id) on delete cascade,
  discipline text not null,         -- Mechanical | Electrical | Instrumentation
  qty numeric(10,2),
  start_date date,
  end_date date,
  man_days numeric(10,2),
  unique(block_id, discipline)
);

-- ============================================================
-- SETTINGS
-- ============================================================
create table settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

insert into settings (key, value) values
  ('gst_rate', '0.05'),
  ('default_markup', '0'),
  ('default_province', 'Alberta'),
  ('currency', 'CAD'),
  ('company_name', 'THM Technical Services'),
  ('invoice_terms', 'Net 30'),
  ('next_ticket_number', '1'),
  ('next_invoice_number', '1');

-- ============================================================
-- AUDIT LOG
-- ============================================================
create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  action text not null,       -- approved_ticket | created_invoice | sent_invoice | etc
  table_name text,
  record_id text,
  details jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table clients enable row level security;
alter table rates enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table estimate_sections enable row level security;
alter table estimate_items enable row level security;
alter table time_entries enable row level security;
alter table field_tickets enable row level security;
alter table field_ticket_items enable row level security;
alter table purchase_orders enable row level security;
alter table invoices enable row level security;
alter table invoice_tickets enable row level security;
alter table schedule_blocks enable row level security;
alter table schedule_disciplines enable row level security;
alter table settings enable row level security;
alter table audit_log enable row level security;

-- Helper: get current user's role
create or replace function get_user_role()
returns text as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

-- Helper: is user a manager-level role
create or replace function is_manager()
returns boolean as $$
  select role in ('admin', 'billing', 'pm') from profiles where id = auth.uid();
$$ language sql security definer stable;

-- Helper: is user on a project's team
create or replace function is_on_project(p_project_id uuid)
returns boolean as $$
  select exists (
    select 1 from project_members
    where project_id = p_project_id and user_id = auth.uid()
  ) or is_manager();
$$ language sql security definer stable;

-- PROFILES policies
create policy "profiles_own" on profiles for all using (id = auth.uid());
create policy "profiles_managers_read" on profiles for select using (is_manager());
create policy "profiles_admin_write" on profiles for update using (get_user_role() = 'admin');

-- CLIENTS: managers full access
create policy "clients_managers" on clients for all using (is_manager());

-- RATES: everyone reads, admin/billing writes
create policy "rates_read" on rates for select using (auth.uid() is not null);
create policy "rates_write" on rates for all using (get_user_role() in ('admin', 'billing'));

-- PROJECTS: managers see all; workers/foremen see assigned
create policy "projects_managers" on projects for all using (is_manager());
create policy "projects_assigned_read" on projects for select using (
  get_user_role() in ('worker', 'foreman') and
  id in (select project_id from project_members where user_id = auth.uid())
);

-- PROJECT MEMBERS: managers manage, everyone reads their own
create policy "project_members_managers" on project_members for all using (is_manager());
create policy "project_members_own_read" on project_members for select using (user_id = auth.uid());

-- ESTIMATE SECTIONS/ITEMS: managers full, assigned read-only
create policy "estimate_sections_managers" on estimate_sections for all using (is_manager());
create policy "estimate_sections_read" on estimate_sections for select using (
  project_id in (select project_id from project_members where user_id = auth.uid())
);
create policy "estimate_items_managers" on estimate_items for all using (is_manager());
create policy "estimate_items_read" on estimate_items for select using (
  section_id in (select id from estimate_sections where
    project_id in (select project_id from project_members where user_id = auth.uid()))
);

-- TIME ENTRIES: workers own theirs; foremen see their projects; managers see all
create policy "time_entries_own" on time_entries for all using (worker_id = auth.uid());
create policy "time_entries_foreman" on time_entries for select using (
  get_user_role() = 'foreman' and
  project_id in (select project_id from project_members where user_id = auth.uid())
);
create policy "time_entries_foreman_insert" on time_entries for insert with check (
  get_user_role() in ('foreman', 'pm', 'admin')
);
create policy "time_entries_managers" on time_entries for all using (is_manager());

-- FIELD TICKETS: foremen manage for their projects; workers read; managers all
create policy "field_tickets_managers" on field_tickets for all using (is_manager());
create policy "field_tickets_foreman" on field_tickets for all using (
  get_user_role() = 'foreman' and
  project_id in (select project_id from project_members where user_id = auth.uid())
);
create policy "field_tickets_worker_read" on field_tickets for select using (
  get_user_role() = 'worker' and
  project_id in (select project_id from project_members where user_id = auth.uid())
);

-- FIELD TICKET ITEMS: same as tickets
create policy "ticket_items_managers" on field_ticket_items for all using (is_manager());
create policy "ticket_items_foreman" on field_ticket_items for all using (
  get_user_role() = 'foreman' and
  ticket_id in (select id from field_tickets where
    project_id in (select project_id from project_members where user_id = auth.uid()))
);

-- PURCHASE ORDERS: managers full, foremen read
create policy "pos_managers" on purchase_orders for all using (is_manager());
create policy "pos_foreman_read" on purchase_orders for select using (
  get_user_role() = 'foreman' and
  project_id in (select project_id from project_members where user_id = auth.uid())
);

-- INVOICES: billing and admin full access, pm read-only
create policy "invoices_billing" on invoices for all using (get_user_role() in ('admin', 'billing'));
create policy "invoices_pm_read" on invoices for select using (get_user_role() = 'pm');

-- INVOICE TICKETS: follow invoice policy
create policy "invoice_tickets_billing" on invoice_tickets for all using (get_user_role() in ('admin', 'billing'));
create policy "invoice_tickets_pm_read" on invoice_tickets for select using (get_user_role() = 'pm');

-- SCHEDULE: managers full, assigned read
create policy "schedule_blocks_managers" on schedule_blocks for all using (is_manager());
create policy "schedule_blocks_read" on schedule_blocks for select using (
  project_id in (select project_id from project_members where user_id = auth.uid())
);
create policy "schedule_disciplines_managers" on schedule_disciplines for all using (is_manager());

-- SETTINGS: everyone reads, admin writes
create policy "settings_read" on settings for select using (auth.uid() is not null);
create policy "settings_write" on settings for all using (get_user_role() = 'admin');

-- AUDIT LOG: insert by anyone logged in, read by admin only
create policy "audit_insert" on audit_log for insert with check (auth.uid() is not null);
create policy "audit_read" on audit_log for select using (get_user_role() = 'admin');
