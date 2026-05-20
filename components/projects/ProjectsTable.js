'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'
import { money, pct, statusClass } from '@/lib/calculations'
import QuickStatusUpdate from './QuickStatusUpdate'

function QuickManagerCell({ projectId, initial, suggestions = [] }) {
  const supabase = createBrowserSupabase()
  const [value, setValue] = useState(initial || '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef()
  const listId = `pm-list-${projectId}`

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  async function save() {
    if (value === (initial || '')) { setEditing(false); return }
    setSaving(true)
    await supabase.from('projects').update({ project_manager: value || null }).eq('id', projectId)
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <>
        <input
          ref={inputRef}
          list={listId}
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={e => {
            if (e.key === 'Escape') { setValue(initial || ''); setEditing(false) }
            if (e.key === 'Enter') save()
          }}
          onClick={e => e.stopPropagation()}
          placeholder="Manager"
          style={{ width: '120px', fontSize: '13px', padding: '3px 6px', border: '1px solid #6b7280', borderRadius: '4px' }}
        />
        <datalist id={listId}>
          {suggestions.filter(Boolean).map(s => <option key={s} value={s} />)}
        </datalist>
      </>
    )
  }

  return (
    <div
      onClick={e => { e.stopPropagation(); setEditing(true) }}
      style={{
        cursor: 'text',
        minWidth: '80px',
        fontSize: '13px',
        color: value ? 'inherit' : '#d1d5db',
        padding: '2px 4px',
        borderRadius: '4px',
        opacity: saving ? 0.5 : 1,
        fontStyle: value ? 'normal' : 'italic',
      }}
      title={value ? 'Click to change' : 'Click to assign'}
    >
      {value || '—'}
    </div>
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
                <td style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className={`status-pill ${statusClass(project.status)}`}>{project.status}</span>
                  <QuickStatusUpdate projectId={project.id} currentStatus={project.status} />
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <QuickManagerCell projectId={project.id} initial={project.project_manager} suggestions={unique('project_manager')} />
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
