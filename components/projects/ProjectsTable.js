'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { money, pct, statusClass } from '@/lib/calculations'
import QuickStatusUpdate from './QuickStatusUpdate'

function useClickOutside(ref, onClose) {
  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [ref, onClose])
}

function ColumnFilter({ label, values, selected, onChange, numeric }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef()
  useClickOutside(ref, () => setOpen(false))

  const filtered = values.filter(v => v.toLowerCase().includes(search.toLowerCase()))
  const allSelected = selected.length === 0
  const active = selected.length > 0

  function toggle(v) {
    if (selected.includes(v)) onChange(selected.filter(x => x !== v))
    else onChange([...selected, v])
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '4px', userSelect: 'none' }}>
      <span>{label}</span>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: active ? '#111' : 'transparent',
          border: active ? 'none' : '1px solid #d1d5db',
          borderRadius: '3px',
          padding: '1px 4px',
          fontSize: '9px',
          cursor: 'pointer',
          color: active ? '#fff' : '#9ca3af',
          lineHeight: 1,
        }}
        title="Filter"
      >▼</button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 100,
          background: '#fff', border: '1px solid var(--line)', borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: '180px', padding: '8px',
        }}>
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            style={{ width: '100%', marginBottom: '6px', fontSize: '12px', padding: '4px 6px' }}
            onClick={e => e.stopPropagation()}
          />
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 4px', fontSize: '12px', cursor: 'pointer', fontWeight: allSelected ? 700 : 400 }}>
              <input type="checkbox" checked={allSelected} onChange={() => onChange([])} />
              (All)
            </label>
            {filtered.map(v => (
              <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 4px', fontSize: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.includes(v)} onChange={() => toggle(v)} />
                {v || '(blank)'}
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <button className="small" style={{ marginTop: '6px', width: '100%' }} onClick={() => { onChange([]); setOpen(false) }}>
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function ProjectsTable({ rows }) {
  const router = useRouter()
  const [filters, setFilters] = useState({ client: [], status: [], manager: [] })
  const [search, setSearch] = useState('')

  function setFilter(col, val) { setFilters(f => ({ ...f, [col]: val })) }

  const unique = (field) => [...new Set(rows.map(r => r.project[field] || ''))].sort()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rows.filter(({ project }) => {
      if (filters.status.length && !filters.status.includes(project.status || '')) return false
      if (filters.client.length && !filters.client.includes(project.client_name || '')) return false
      if (filters.manager.length && !filters.manager.includes(project.project_manager || '')) return false
      if (q) {
        const hay = [project.name, project.client_name, project.estimate_no, project.internal_job_no, project.location].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [rows, filters, search])

  const anyFilter = Object.values(filters).some(f => f.length) || search

  const thStyle = { padding: '6px 8px', background: '#f8fafc', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475467', borderBottom: '2px solid var(--line)', whiteSpace: 'nowrap' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search project, job #…"
          style={{ maxWidth: '280px' }}
        />
        {anyFilter && (
          <button className="small" onClick={() => { setFilters({ client: [], status: [], manager: [] }); setSearch('') }}>
            Clear all filters
          </button>
        )}
        <span className="muted" style={{ fontSize: '12px', marginLeft: 'auto' }}>
          {filtered.length} of {rows.length} projects
        </span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ ...thStyle, whiteSpace: 'nowrap' }}>Job #</th>
              <th style={thStyle}>Project</th>
              <th style={thStyle}>
                <ColumnFilter label="Client" values={unique('client_name')} selected={filters.client} onChange={v => setFilter('client', v)} />
              </th>
              <th style={thStyle}>
                <ColumnFilter label="Status" values={unique('status')} selected={filters.status} onChange={v => setFilter('status', v)} />
              </th>
              <th style={thStyle}>
                <ColumnFilter label="Manager" values={unique('project_manager')} selected={filters.manager} onChange={v => setFilter('manager', v)} />
              </th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Sub-Total before tax</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>GST</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Accruals</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Remaining</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Spent</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? filtered.map(({ project, estimate, gst, accrualsToDate, remaining, spentPct }) => (
              <tr key={project.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/projects/${project.id}`)}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: project.internal_job_no ? '#6b7280' : '#d1d5db' }}>
                    {project.internal_job_no || '—'}
                  </span>
                </td>
                <td>
                  <div>
                    <strong>{project.name}</strong>
                    <div className="fine-print">{project.estimate_no || '—'}</div>
                  </div>
                </td>
                <td>{project.client_name || '—'}</td>
                <td style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className={`status-pill ${statusClass(project.status)}`}>{project.status}</span>
                  <QuickStatusUpdate projectId={project.id} currentStatus={project.status} />
                </td>
                <td>{project.project_manager || '—'}</td>
                <td className="numeric">{money(estimate)}</td>
                <td className="numeric">{money(gst)}</td>
                <td className="numeric">{money(accrualsToDate)}</td>
                <td className={`numeric ${remaining < 0 ? 'bad' : ''}`}>{money(remaining)}</td>
                <td className="numeric" style={{ minWidth: '100px' }}>
                  <div className="progress"><span className="progress-bar" style={{ width: `${Math.min(100, spentPct * 100)}%` }} /></div>
                  <span className="fine-print">{pct(spentPct)}</span>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="10" className="empty">No projects match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
