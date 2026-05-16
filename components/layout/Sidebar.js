'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'

const NAV = [
  { href: '/dashboard',      label: 'Dashboard'    },
  { href: '/proposals',      label: 'BD Tracker'   },
  { href: '/projects',       label: 'Projects' },
  { href: '/field-tickets',    label: 'Field Tickets'},
  { href: '/purchase-orders', label: 'Purchase Orders' },
  { href: '/invoices',        label: 'Invoices'     },
  { href: '/financials',     label: 'Financials'   },
  { href: '/schedule',       label: 'Schedule'     },
  { href: '/rates',          label: 'Rate Schedules' },
  { href: '/time-entry',     label: 'Time Entry'   },
  { href: '/employees',      label: 'Employees'    },
  { href: '/vendors',        label: 'Vendors'      },
  { href: '/payroll',        label: 'Payroll'      },
]

const NAV_ADMIN = [
  { href: '/users',    label: 'Users'    },
  { href: '/settings', label: 'Settings' },
]

export default function Sidebar({ user, profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createBrowserSupabase()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isAdmin = profile?.role === 'admin'
  const isBilling = profile?.role === 'billing'

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '16px 12px 10px' }}>
        <img src="/logo.png" alt="THM" style={{ width: '100%', maxHeight: '48px', objectFit: 'contain', objectPosition: 'left' }} />
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, padding: '8px 10px' }}>
        {NAV.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '4px',
              marginBottom: '2px',
              color: active ? '#ffffff' : '#374151',
              background: active ? '#9ca3af' : 'transparent',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 700,
              transition: 'all 0.15s',
            }}>
              {item.label}
            </Link>
          )
        })}

        {(isAdmin || isBilling) && (
          <>
            <div style={{ height: '1px', background: 'var(--line)', margin: '10px 0' }} />
            {NAV_ADMIN.map(item => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '4px',
                  marginBottom: '2px',
                  color: active ? '#0f766e' : '#4b5563',
                  background: active ? '#e0f2f1' : 'transparent',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                }}>
                  {item.label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* User info + sign out */}
      <div style={{ padding: '12px 16px 20px', borderTop: '1px solid var(--line)' }}>
        <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '4px', textTransform: 'capitalize' }}>
          {profile?.full_name || user?.email}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <span className="pill" style={{ background: '#f3f4f6', color: '#374151', fontSize: '11px', textTransform: 'capitalize' }}>
            {profile?.role || 'worker'}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          style={{ background: '#f0f0f0', color: '#374151', width: '100%', textAlign: 'left', fontSize: '13px' }}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
