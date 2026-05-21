'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'
import { money, pct, statusClass } from '@/lib/calculations'

const STATUSES = ['Estimating', 'Submitted', 'Awarded', 'Active', 'Complete', 'On Hold', 'Cancelled']

const STATUS_STYLE = {
  Estimating: { bg: '#e0e7ff', color: '#3730a3' },
  Submitted:  { bg: '#fef3c7', color: '#92400e' },
  Awarded:    { bg: '#d1fae5', color: '#065f46' },
  Active:     { bg: '#dcfce7', color: '#15803d' },
  Complete:   { bg: '#e0f2fe', color: '#0369a1' },
  'On Hold':  { bg: '#fef3c7', color: '#b45309' },
  Cancelled:  { bg: '#fee2e2', color: '#b91c1c' },
}

function StatusDropdown({ projectId, initial }) {
  const supabase = createBrowserSupabase()
  const [value, setValue] = useState(initial)
  const [saving, setSaving] = useState(false)
  const style = STATUS_STYLE[value] || { bg: '#f3f4f6', color: '#374151' }

  async function handleChange(e) {
    e.stopPropagation()
    const next = e.target.value
    setValue(next)
    setSaving(true)
    await supabase.from('projects').update({ status: next }).eq('id', projectId)
    setSaving(false)
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      onClick={e => e.stopPropagation()}
      disabled={saving}
      style={{
        background: style.bg,
        color: style.color,
        border: 'none',
        borderRadius: '99px',
        padding: '3px 22px 3px 10px',
        fontSize: '11px',
        fontWeight: 700,
        cursor: 'pointer',
        appearance: 'none',
        WebkitAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='${encodeURIComponent(style.color)}' d='M0 0l5 6 5-6z'/></svg>")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 7px center',
        opacity: saving ? 0.5 : 1,
      }}
    >
      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  )
}

function ManagerDropdown({ projectId, initial, suggestions = [] }) {
  const supabase = createBrowserSupabase()
  const [value, setValue] = useState(initial || '')
  const [saving, setSaving] = useState(false)
  const options = useMemo(() => {
    const set = new Set(suggestions.filter(Boolean))
    if (value) set.add(value)
    return [...set].sort()
  }, [suggestions, value])

  async function handleChange(e) {
    e.stopPropagation()
    let next = e.target.value
    if (next === '__add') {
      const name = prompt('Add a new manager name:')?.trim()
      if (!name) return
      next = name
    }
    if (next === value) return
    setValue(next)
    setSaving(true)
    await supabase.from('projects').update({ project_manager: next || null }).eq('id', projectId)
    setSaving(false)
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      onClick={e => e.stopPropagation()}
      disabled={saving}
      style={{
        fontSize: '13px',
        padding: '3px 22px 3px 8px',
        border: '1px solid transparent',
        borderRadius: '6px',
        background: '#fff',
        cursor: 'pointer',
        minWidth: '120px',
        color: value ? '#111' : '#9ca3af',
        appearance: 'none',
        WebkitAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='%239ca3af' d='M0 0l5 6 5-6z'/></svg>")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 6px center',
        opacity: saving ? 0.5 : 1,
      }}
      onMouseEnter={e => e.target.style.borderColor = '#d1d5db'}
      onMouseLeave={e => e.target.style.borderColor = 'transparent'}
    >
      <option value="">— Unassigned —</option>
      {options.map(s => <option key={s} value={s}>{s}</option>)}
      <option value="__add">+ Add new…</option>
    </select>
  )
}

function QuickNoteCell({ projectId, initial }) {
  const supabase = createBrowserSupabase()
  const [value, setValue] = useState(initial || '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef()

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [editing])

  async function save() {
    if (value === (initial || '')) { setEditing(false); return }
    setSaving(true)
    await supabase.from('projects').update({ quick_note: value || null }).eq('id', projectId)
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={e => {
          if (e.key === 'Escape') { setValue(initial || ''); setEditing(false) }
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save()
        }}
        onClick={e => e.stopPropagation()}
        placeholder="Add reminder…"
        rows={2}
        style={{
          width: '100%',
          minWidth: '180px',
          fontSize: '12px',
          padding: '4px 6px',
          resize: 'vertical',
          border: '1px solid #6b7280',
          borderRadius: '4px',
        }}
      />
    )
  }

  return (
    <div
      onClick={e => { e.stopPropagation(); setEditing(true) }}
      style={{
        cursor: 'text',
        minWidth: '160px',
        maxWidth: '240px',
        fontSize: '12px',
        color: value ? '#fef3c7' : '#9ca3af',
        background: value ? '#78350f' : 'transparent',
        padding: value ? '3px 7px' : '3px 4px',
        borderRadius: '4px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        opacity: saving ? 0.5 : 1,
        fontStyle: value ? 'normal' : 'italic',
        fontWeight: value ? 600 : 400,
      }}
      title={value ? 'Click to edit' : 'Click to add a note'}
    >
      {value || '+ note'}
    </div>
  )
}

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
          background: active ? '#9ca3af' : 'transparent',
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
              <th style={thStyle}>Notes</th>
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
                <td onClick={e => e.stopPropagation()}>
                  <QuickNoteCell projectId={project.id} initial={project.quick_note} />
                </td>
                <td>{project.client_name || '—'}</td>
                <td onClick={e => e.stopPropagation()}>
                  <StatusDropdown projectId={project.id} initial={project.status} />
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <ManagerDropdown projectId={project.id} initial={project.project_manager} suggestions={unique('project_manager')} />
                </td>
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
              <tr><td colSpan="11" className="empty">No projects match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
