# THM Technical Services — Field App

## Getting the app running (step by step)

### Step 1 — Install Node.js
Download from https://nodejs.org (green LTS button) → run installer → defaults → Finish.
Restart your terminal after install.

### Step 2 — Set up environment variables
Copy the example file:
```
copy .env.local.example .env.local
```
Fill in your Supabase URL and keys (Settings → API in Supabase dashboard).

### Step 3 — Install dependencies
Open a terminal in this folder and run:
```
npm install
```

### Step 4 — Set up the database
1. Go to https://supabase.com/dashboard
2. Open your project → SQL Editor → New Query
3. Paste the entire contents of `supabase/schema.sql`
4. Click Run

### Step 5 — Add your logo
Copy your THM logo PNG file to:
```
public/logo.png
```

### Step 6 — Run the app locally
```
npm run dev
```
Open http://localhost:3000 in your browser.

### Step 7 — Create your admin account
1. Go to Supabase dashboard → Authentication → Users → Add user
2. Enter your email and a password
3. Go to Table Editor → profiles → find your row → set role to 'admin'

### Step 8 — Import TC rates
Once the app is running, run:
```
node scripts/import-rates.js
```
(Script will be added once your Excel file structure is confirmed.)

### Step 9 — Deploy to Vercel
1. Install Vercel CLI: `npm install -g vercel`
2. Run: `vercel`
3. Follow prompts — connect to your Vercel account
4. Add environment variables in Vercel dashboard (same as .env.local)
5. Add custom domain: app.thmtsgroup.com

### Step 10 — GoDaddy DNS (after Vercel deploy)
1. Log into GoDaddy → My Products → DNS → Manage DNS for thmtsgroup.com
2. Add record:
   - Type: CNAME
   - Name: app
   - Value: cname.vercel-dns.com
   - TTL: 600 seconds
3. Done — SSL certificate auto-provisions within ~10 minutes

---

## Project structure

```
app/
  (auth)/login/       Login page
  (app)/
    dashboard/        Portfolio overview
    projects/         Project list + detail + estimate
    field-tickets/    Ticket list + detail + new
    invoices/         Invoice list + detail + builder
    schedule/         Manpower schedule
    rates/            TC rate table
    users/            Team management
    settings/         App settings
  api/
    pdf/              PDF generation endpoint
    send-email/       Email delivery endpoint

lib/
  supabase.js         Database client
  calculations.js     All business logic (ported from HTML dashboard)

supabase/
  schema.sql          Full database schema — run this first
```

## What's built

- [x] Login / auth
- [x] Sidebar navigation with role awareness
- [x] Portfolio dashboard with KPIs
- [x] Projects list
- [x] Project detail with variance table
- [x] Field tickets list + detail
- [x] Invoices list + detail
- [x] Schedule / manpower page
- [x] TC Rates page
- [x] Users page
- [x] Settings page
- [x] Database schema with full Row Level Security
- [x] All calculation logic ported

## What's next (in order)

- [ ] New project form
- [ ] Project estimate builder (full tab from HTML)
- [ ] New field ticket form (foreman assembles from time entries)
- [ ] Worker time entry form (mobile-optimised)
- [ ] Approval workflow (approve/reject buttons with email notification)
- [ ] Field ticket PDF generation
- [ ] New invoice builder (select tickets → generate)
- [ ] Invoice PDF generation + email send
- [ ] TC rate import script from Excel
- [ ] PWA manifest for mobile install
