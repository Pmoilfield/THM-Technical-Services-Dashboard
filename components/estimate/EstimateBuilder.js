'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'
import { saveEstimate } from '@/app/actions/saveEstimate'
import Link from 'next/link'

function QuoteDropModal({ onFile, onClose }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  function handle(file) {
    if (!file) return
    onFile(file)
    onClose()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '420px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '16px' }}>Attach quote</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}>×</button>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]) }}
          onClick={() => inputRef.current.click()}
          style={{
            border: `2px dashed ${dragging ? '#111' : '#d1d5db'}`,
            borderRadius: '12px',
            padding: '40px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? '#fff5f5' : '#fafafa',
            transition: 'all 0.15s',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📎</div>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
            {dragging ? 'Drop to attach' : 'Drop file here or click to browse'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>PDF, Word, Excel, or image</div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
            style={{ display: 'none' }}
            onChange={e => handle(e.target.files[0])}
          />
        </div>
      </div>
    </div>
  )
}

const ITEM_TYPES = ['Labour', 'Equipment', 'Third Party']
const equipmentCategories = ['Equipment', 'TC Equipment', 'Operator']

function money(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function calcItemTotal(item) {
  if (item.type === 'Labour') {
    const reg = (parseFloat(item.reg_hours) || 0) * (parseFloat(item.reg_rate) || 0) * (parseFloat(item.days) || 1)
    const ot = (parseFloat(item.ot_hours) || 0) * (parseFloat(item.ot_rate) || 0) * (parseFloat(item.days) || 1)
    const base = reg + ot
    return base * (1 + (parseFloat(item.markup) || 0) / 100)
  }
  if (item.type === 'Equipment') {
    const base = (parseFloat(item.qty) || 0) * (parseFloat(item.reg_rate) || 0) * (parseFloat(item.days) || 1)
    return base * (1 + (parseFloat(item.markup) || 0) / 100)
  }
  return (parseFloat(item.cost) || 0) * (1 + (parseFloat(item.markup) || 0) / 100)
}

function equipRateForPeriod(rate, period) {
  const map = { hourly: rate.hourly_rate, daily: rate.daily_rate, weekly: rate.weekly_rate, monthly: rate.monthly_rate }
  return map[period]?.toString() || ''
}

function emptyItem(type) {
  return { _key: Math.random(), type, description: '', supplier: '', qty: '1', days: '1', equip_period: 'daily', reg_hours: '', reg_rate: '', ot_hours: '', ot_rate: '', cost: '', markup: '', rate_id: '', category: '', quote_url: '', quote_filename: '' }
}

function toFormItem(item) {
  return {
    _key: Math.random(), _id: item.id,
    type: item.type, description: item.description || '', supplier: item.supplier || '',
    qty: item.qty?.toString() || '1', days: item.days?.toString() || '1',
    reg_hours: item.reg_hours?.toString() || '', reg_rate: item.reg_rate?.toString() || '',
    ot_hours: item.ot_hours?.toString() || '', ot_rate: item.ot_rate?.toString() || '',
    cost: item.cost?.toString() || '', markup: item.markup != null ? (item.markup * 100).toString() : '',
    rate_id: item.rate_id || '', category: item.category || '',
    equip_period: item.equip_period || 'daily',
    quote_url: item.quote_url || '', quote_filename: item.quote_filename || '',
  }
}

export default function EstimateBuilder({ project, initialSections, initialItems, rates }) {
  const router = useRouter()
  const supabase = createBrowserSupabase()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [quoteModal, setQuoteModal] = useState(null)
  const [uploading, setUploading] = useState(null)
  const [dragIdx, setDragIdx] = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)
  const dragSrcRef = useRef(null)
  const [itemDragOver, setItemDragOver] = useState(null)
  const itemDragSrcRef = useRef(null)

  // ── Autosave state ────────────────────────────────────────────────────
  // status: 'idle' | 'dirty' | 'saving' | 'saved' | 'error'
  const [autosaveStatus, setAutosaveStatus] = useState('idle')
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [savedTick, setSavedTick] = useState(0) // refresh "5s ago" label
  const dbSaveTimerRef = useRef(null)
  const lsSaveTimerRef = useRef(null)
  const firstRunRef = useRef(true)
  const saveInFlightRef = useRef(false)
  const draftKey = `estimate-draft-${project.id}`

  function handleDragStart(e, idx) {
    dragSrcRef.current = idx
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
  }
  function handleDragOver(e, idx) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIdx(idx)
  }
  function handleDrop(e, idx) {
    e.preventDefault()
    const from = dragSrcRef.current
    dragSrcRef.current = null
    if (from === null || from === idx) { setDragIdx(null); setDragOverIdx(null); return }
    setSections(prev => {
      const updated = [...prev]
      const [moved] = updated.splice(from, 1)
      updated.splice(idx, 0, moved)
      return updated
    })
    setDragIdx(null)
    setDragOverIdx(null)
  }
  function handleDragEnd() { dragSrcRef.current = null; setDragIdx(null); setDragOverIdx(null) }

  function handleItemDragStart(e, sectionKey, type, idx) {
    itemDragSrcRef.current = { sectionKey, type, idx }
    e.dataTransfer.effectAllowed = 'move'
    e.stopPropagation()
  }
  function handleItemDragOver(e, sectionKey, type, idx) {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setItemDragOver({ sectionKey, type, idx })
  }
  function handleItemDrop(e, sectionKey, type, dropIdx) {
    e.preventDefault()
    e.stopPropagation()
    const src = itemDragSrcRef.current
    itemDragSrcRef.current = null
    setItemDragOver(null)
    if (!src || src.sectionKey !== sectionKey || src.type !== type || src.idx === dropIdx) return
    setSections(prev => prev.map(s => {
      if (s._key !== sectionKey) return s
      const typeItems = s.items.filter(i => i.type === type)
      const reordered = [...typeItems]
      const [moved] = reordered.splice(src.idx, 1)
      reordered.splice(dropIdx, 0, moved)
      let typeIdx = 0
      const newItems = s.items.map(item => item.type !== type ? item : reordered[typeIdx++])
      return { ...s, items: newItems }
    }))
  }
  function handleItemDragEnd(e) { e.stopPropagation(); itemDragSrcRef.current = null; setItemDragOver(null) }

  const labourRates = (() => {
    const filtered = rates.filter(r => !equipmentCategories.includes(r.category))
    const catMaxRate = filtered.reduce((acc, r) => {
      const v = parseFloat(r.straight_rate) || 0
      acc[r.category] = Math.max(acc[r.category] || 0, v)
      return acc
    }, {})
    return filtered.sort((a, b) => {
      const aWelder = a.category === 'Welder' ? 1 : 0
      const bWelder = b.category === 'Welder' ? 1 : 0
      if (aWelder !== bWelder) return aWelder - bWelder
      const catDiff = (catMaxRate[b.category] || 0) - (catMaxRate[a.category] || 0)
      if (catDiff !== 0) return catDiff
      return (parseFloat(b.straight_rate) || 0) - (parseFloat(a.straight_rate) || 0)
    })
  })()
  const equipRates = rates.filter(r => equipmentCategories.includes(r.category))

  const [sections, setSections] = useState(
    initialSections.map(s => ({
      ...s,
      _key: s.id,
      items: initialItems.filter(i => i.section_id === s.id).map(toFormItem),
    }))
  )

  function addSection() {
    setSections(prev => [...prev, { _key: Math.random(), number: prev.length + 1, title: '', items: [emptyItem('Labour')] }])
  }

  function removeSection(key) {
    setSections(prev => prev.filter(s => s._key !== key))
  }

  function duplicateSection(key) {
    setSections(prev => {
      const idx = prev.findIndex(s => s._key === key)
      if (idx === -1) return prev
      const src = prev[idx]
      const copy = {
        ...src,
        _key: Math.random(),
        id: undefined,
        number: prev.length + 1,
        title: src.title ? `${src.title} (copy)` : '',
        items: src.items.map(item => ({ ...item, _key: Math.random(), id: undefined })),
      }
      const next = [...prev]
      next.splice(idx + 1, 0, copy)
      return next.map((s, i) => ({ ...s, number: i + 1 }))
    })
  }

  function updateSection(key, field, value) {
    setSections(prev => prev.map(s => s._key === key ? { ...s, [field]: value } : s))
  }

  function addItem(sectionKey, type) {
    setSections(prev => prev.map(s => s._key === sectionKey ? { ...s, items: [...s.items, emptyItem(type)] } : s))
  }

  function removeItem(sectionKey, itemKey) {
    setSections(prev => prev.map(s => s._key === sectionKey ? { ...s, items: s.items.filter(i => i._key !== itemKey) } : s))
  }

  function updateItem(sectionKey, itemKey, field, value) {
    setSections(prev => prev.map(s => {
      if (s._key !== sectionKey) return s
      return {
        ...s, items: s.items.map(item => {
          if (item._key !== itemKey) return item
          const updated = { ...item, [field]: value }
          if (field === 'rate_id' && item.type === 'Labour') {
            const rate = labourRates.find(r => r.id === value)
            if (rate) {
              updated.description = rate.personnel
              updated.category = rate.category
              updated.reg_rate = rate.straight_rate?.toString() || ''
              updated.ot_rate = rate.overtime_rate?.toString() || ''
              if (rate.category === 'Allowance') { updated.reg_hours = '1'; updated.ot_hours = '0' }
            }
          }
          if (field === 'rate_id' && item.type === 'Equipment') {
            const rate = equipRates.find(r => r.id === value)
            if (rate) {
              updated.description = rate.personnel
              updated.reg_rate = equipRateForPeriod(rate, item.equip_period || 'daily')
            }
          }
          if (field === 'equip_period' && item.type === 'Equipment' && item.rate_id) {
            const rate = equipRates.find(r => r.id === item.rate_id)
            if (rate) updated.reg_rate = equipRateForPeriod(rate, value)
          }
          return updated
        })
      }
    }))
  }

  async function uploadQuote(sectionKey, itemKey, file) {
    if (!file) return
    setUploading(itemKey)
    setError('')
    try {
      const path = `${project.id}/${Date.now()}-${file.name}`
      const { error: upErr } = await supabase.storage.from('quotes').upload(path, file, { upsert: true })
      if (upErr) {
        setError(`Upload failed: ${upErr.message}`)
        setUploading(null)
        return
      }
      const { data: urlData } = supabase.storage.from('quotes').getPublicUrl(path)
      const publicUrl = urlData?.publicUrl
      if (!publicUrl) {
        setError('Upload succeeded but could not get public URL. Make sure the quotes bucket is set to public.')
        setUploading(null)
        return
      }
      setSections(prev => prev.map(s => {
        if (s._key !== sectionKey) return s
        return {
          ...s, items: s.items.map(item =>
            item._key !== itemKey ? item : { ...item, quote_url: publicUrl, quote_filename: file.name }
          )
        }
      }))
    } catch (e) {
      setError(`Upload error: ${e.message}`)
    }
    setUploading(null)
  }

  const grandTotal = sections.reduce((s, sec) => s + sec.items.reduce((t, i) => t + calcItemTotal(i), 0), 0)
  const gstAmount = grandTotal * (parseFloat(project.gst_rate) || 0.05)

  async function save(navigate = true) {
    if (saveInFlightRef.current) return { skipped: true }
    saveInFlightRef.current = true
    setSaving(true)
    setError('')

    // Snapshot the sections we're saving so we can map IDs back by index
    const snapshot = sections
    const result = await saveEstimate(project.id, snapshot, grandTotal, gstAmount)

    if (result?.error) {
      setError(result.error)
      setSaving(false)
      setAutosaveStatus('error')
      saveInFlightRef.current = false
      return { error: result.error }
    }

    // Apply DB IDs back to any sections that didn't have one yet.
    // Match by reference (_key) to avoid clobbering edits made while save was in flight.
    if (result.sectionIds && Array.isArray(result.sectionIds)) {
      setSections(prev => prev.map(s => {
        if (s.id) return s
        const snapIdx = snapshot.findIndex(snap => snap._key === s._key)
        if (snapIdx === -1) return s
        const newId = result.sectionIds[snapIdx]
        return newId ? { ...s, id: newId } : s
      }))
    }

    setSaving(false)
    setLastSavedAt(Date.now())
    setAutosaveStatus('saved')
    try { localStorage.removeItem(draftKey) } catch (e) {}
    saveInFlightRef.current = false
    if (navigate) window.location.href = `/projects/${project.id}`
    return { ok: true }
  }

  // ── Autosave: localStorage draft (every 2s after change) ──────────────
  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false
      // On mount, see if there's an unsaved draft newer than the server state
      try {
        const raw = localStorage.getItem(draftKey)
        if (raw) {
          const draft = JSON.parse(raw)
          const sameAsServer = JSON.stringify(draft.sections) === JSON.stringify(initialSections)
          if (!sameAsServer && draft.sections) {
            const ago = Math.round((Date.now() - draft.t) / 1000)
            if (confirm(`Unsaved changes from ${ago}s ago were found. Restore them?`)) {
              setSections(draft.sections)
              setAutosaveStatus('dirty')
              return
            } else {
              localStorage.removeItem(draftKey)
            }
          }
        }
      } catch (e) {}
      return
    }

    // Mark dirty immediately
    setAutosaveStatus(s => (s === 'saving' ? s : 'dirty'))

    // Debounced localStorage save (1s)
    if (lsSaveTimerRef.current) clearTimeout(lsSaveTimerRef.current)
    lsSaveTimerRef.current = setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify({ t: Date.now(), sections })) } catch (e) {}
    }, 1000)

    // DB autosave disabled — use the explicit Save & close button.
    // (Hybrid autosave was causing duplicate sections.)

    return () => {
      if (lsSaveTimerRef.current) clearTimeout(lsSaveTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections])

  // Refresh the "saved Ns ago" indicator every 5s
  useEffect(() => {
    if (!lastSavedAt) return
    const id = setInterval(() => setSavedTick(t => t + 1), 5000)
    return () => clearInterval(id)
  }, [lastSavedAt])

  function autosaveLabel() {
    if (autosaveStatus === 'saving') return 'Saving…'
    if (autosaveStatus === 'error')  return 'Save failed'
    if (autosaveStatus === 'dirty')  return 'Unsaved changes'
    if (lastSavedAt) {
      const secs = Math.round((Date.now() - lastSavedAt) / 1000)
      if (secs < 5)   return 'Saved just now'
      if (secs < 60)  return `Saved ${secs}s ago`
      if (secs < 3600) return `Saved ${Math.floor(secs/60)}m ago`
      return `Saved ${Math.floor(secs/3600)}h ago`
    }
    return ''
  }
  const autosaveColor = () => {
    if (autosaveStatus === 'error') return '#b91c1c'
    if (autosaveStatus === 'dirty') return '#b45309'
    if (autosaveStatus === 'saving') return '#1d4ed8'
    return '#15803d'
  }

  const pre$ = { position: 'relative', display: 'flex', alignItems: 'center' }
  const pre$Sign = { position: 'absolute', left: '7px', fontSize: '11px', color: 'var(--muted)', pointerEvents: 'none', userSelect: 'none' }

  return (
    <div className="grid" style={{ maxWidth: '1300px' }}>
      {quoteModal && (
        <QuoteDropModal
          onFile={file => uploadQuote(quoteModal.sectionKey, quoteModal.itemKey, file)}
          onClose={() => setQuoteModal(null)}
        />
      )}
      <div className="page-header">
        <div className="split">
          <div>
            <h1>Estimate — {project.name}</h1>
            <p className="muted">{project.client_name} · {project.internal_job_no || project.estimate_no || ''}</p>
          </div>
          <div className="toolbar" style={{ alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: autosaveColor(), minWidth: '140px', textAlign: 'right' }} title="Drafts are kept in your browser. Click Save & close to commit changes.">
              {autosaveLabel()}
            </span>
            <Link href={`/projects/${project.id}`}><button>Cancel</button></Link>
            <a href={`/print/estimate/${project.id}`} target="_blank" rel="noreferrer">
              <button type="button">Export PDF</button>
            </a>
            <button className="primary" onClick={() => save(true)} disabled={saving}>{saving ? 'Saving...' : 'Save & close'}</button>
          </div>
        </div>
      </div>

      {error && <div className="notice danger">{error}</div>}

      {/* Estimate summary — drives the estimate */}
      <section className="panel">
        <div className="split" style={{ marginBottom: '12px' }}>
          <h2>Estimate summary</h2>
          <button className="small primary" onClick={addSection}>+ Add area</button>
        </div>

        {sections.length === 0 && (
          <p className="muted" style={{ fontSize: '13px', padding: '12px 0' }}>No areas yet — click <strong>+ Add area</strong> to begin.</p>
        )}

        {sections.length > 0 && (
          <>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '20px 52px 1fr 110px 32px', gap: '8px', padding: '4px 0 6px', borderBottom: '2px solid var(--line)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em' }}>
              <span />
              <span>Area</span><span>Title</span><span style={{ textAlign: 'right' }}>Total</span><span />
            </div>

            {sections.map((s, idx) => {
              const sTotal = s.items.reduce((t, i) => t + calcItemTotal(i), 0)
              const isDragging  = dragIdx === idx
              const isOver      = dragOverIdx === idx && dragIdx !== idx
              return (
                <div
                  key={s._key}
                  draggable
                  onDragStart={e => handleDragStart(e, idx)}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDrop={e => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: 'grid', gridTemplateColumns: '20px 52px 1fr 110px 32px', gap: '8px', alignItems: 'start',
                    padding: '5px 0', borderBottom: '1px solid var(--line)',
                    opacity: isDragging ? 0.4 : 1,
                    borderTop: isOver ? '2px solid #111' : undefined,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {/* Drag handle */}
                  <div style={{ paddingTop: '8px', cursor: 'grab', color: '#cbd5e1', fontSize: '14px', lineHeight: 1, userSelect: 'none', textAlign: 'center' }} title="Drag to reorder">
                    ⠿
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--muted)', paddingTop: '6px' }}>{idx + 1}</span>
                  <textarea
                    value={s.title}
                    onChange={e => updateSection(s._key, 'title', e.target.value)}
                    placeholder="Area description…"
                    rows={2}
                    style={{ fontSize: '13px', padding: '4px 8px', resize: 'vertical', lineHeight: '1.4', minHeight: '36px', width: '100%', minWidth: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  />
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', textAlign: 'right', fontWeight: 700, fontSize: '13px', cursor: 'pointer', color: sTotal > 0 ? 'inherit' : 'var(--muted)', padding: 0, paddingTop: '6px' }}
                    onClick={() => document.getElementById(`section-${s._key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    title="Jump to section"
                  >
                    {sTotal > 0 ? money(sTotal) : '—'}
                  </button>
                  <button type="button" style={{ background: 'none', color: 'var(--danger)', padding: '2px 6px', fontSize: '15px', border: 'none', cursor: 'pointer', marginTop: '2px' }} onClick={() => removeSection(s._key)}>&#x2715;</button>
                </div>
              )
            })}

            <div className="split" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: '13px' }}>
              <span>Subtotal</span><strong>{money(grandTotal)}</strong>
            </div>
            <div className="split" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: '13px' }}>
              <span>GST ({((parseFloat(project.gst_rate) || 0.05) * 100).toFixed(0)}%)</span><strong>{money(gstAmount)}</strong>
            </div>
            <div className="split" style={{ padding: '12px 0', fontWeight: 700, fontSize: '17px' }}>
              <span>Total incl. GST</span><span>{money(grandTotal + gstAmount)}</span>
            </div>
          </>
        )}
      </section>

      {sections.map((section, si) => {
        const sectionTotal = section.items.reduce((t, i) => t + calcItemTotal(i), 0)
        return (
          <section key={section._key} id={`section-${section._key}`} className="panel">
            <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'flex-start', gap: '12px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '8px', flexShrink: 0 }}>Area {si + 1}</div>
                <textarea
                  value={section.title}
                  onChange={e => updateSection(section._key, 'title', e.target.value)}
                  placeholder="Area description"
                  rows={3}
                  style={{ fontWeight: 600, fontSize: '13px', padding: '8px 10px', lineHeight: '1.5', minHeight: '60px', resize: 'vertical', flex: 1, wordBreak: 'break-word', overflowWrap: 'break-word' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <strong style={{ fontSize: '18px' }}>{money(sectionTotal)}</strong>
                <button type="button" className="small" onClick={() => duplicateSection(section._key)} title="Duplicate this section with all line items">⧉ Copy section</button>
                <button className="small danger" onClick={() => removeSection(section._key)}>Remove section</button>
              </div>
            </div>

            {ITEM_TYPES.map(type => {
              const typeItems = section.items.filter(i => i.type === type)
              if (!typeItems.length) return null

              const inp = { padding: '4px 6px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }
              const th = { padding: '5px 6px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', background: '#f8fafc', letterSpacing: '0.04em', whiteSpace: 'nowrap' }
              const td = { padding: '3px 4px', verticalAlign: 'middle' }

              return (
                <div key={type} style={{ marginBottom: '18px', overflowX: 'auto' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '4px' }}>{type}</div>
                  <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th style={{ ...th, width: '20px' }} />
                        {type === 'Labour' && <>
                          <th style={{ ...th, width: '30%', textAlign: 'left' }}>Role / Description</th>
                          <th style={{ ...th, width: '60px', textAlign: 'center' }}>Days</th>
                          <th style={{ ...th, width: '70px', textAlign: 'center' }}>Reg Hrs</th>
                          <th style={{ ...th, width: '100px', textAlign: 'center' }}>Reg Rate ($)</th>
                          <th style={{ ...th, width: '70px', textAlign: 'center' }}>OT Hrs</th>
                          <th style={{ ...th, width: '100px', textAlign: 'center' }}>OT Rate ($)</th>
                          <th style={{ ...th, width: '90px', textAlign: 'right' }}>Total</th>
                          <th style={{ ...th, width: '28px' }} />
                        </>}
                        {type === 'Equipment' && <>
                          <th style={{ ...th, width: '30%', textAlign: 'left' }}>Equipment</th>
                          <th style={{ ...th, width: '100px', textAlign: 'center' }}>Period</th>
                          <th style={{ ...th, width: '55px', textAlign: 'center' }}>Qty</th>
                          <th style={{ ...th, width: '65px', textAlign: 'center' }}>Units</th>
                          <th style={{ ...th, width: '110px', textAlign: 'center' }}>Rate ($)</th>
                          <th style={{ ...th, width: '70px', textAlign: 'center' }}>Markup %</th>
                          <th style={{ ...th, width: '90px', textAlign: 'right' }}>Total</th>
                          <th style={{ ...th, width: '28px' }} />
                        </>}
                        {type === 'Third Party' && <>
                          <th style={{ ...th, width: '20%', textAlign: 'left' }}>Supplier</th>
                          <th style={{ ...th, textAlign: 'left' }}>Description</th>
                          <th style={{ ...th, width: '120px', textAlign: 'center' }}>Cost ($)</th>
                          <th style={{ ...th, width: '80px', textAlign: 'center' }}>Markup %</th>
                          <th style={{ ...th, width: '90px', textAlign: 'right' }}>Total</th>
                          <th style={{ ...th, width: '100px', textAlign: 'center' }}>Quote</th>
                          <th style={{ ...th, width: '28px' }} />
                        </>}
                      </tr>
                    </thead>
                    <tbody>
                      {typeItems.map((item, itemIdx) => {
                        const isItemOver = itemDragOver?.sectionKey === section._key && itemDragOver?.type === type && itemDragOver?.idx === itemIdx
                        return (
                        <tr
                          key={item._key}
                          draggable
                          onDragStart={e => handleItemDragStart(e, section._key, type, itemIdx)}
                          onDragOver={e => handleItemDragOver(e, section._key, type, itemIdx)}
                          onDrop={e => handleItemDrop(e, section._key, type, itemIdx)}
                          onDragEnd={handleItemDragEnd}
                          style={{ borderBottom: '1px solid var(--line)', borderTop: isItemOver ? '2px solid #111' : undefined }}
                        >
                          <td style={{ ...td, width: '20px', cursor: 'grab', color: '#cbd5e1', fontSize: '14px', textAlign: 'center', userSelect: 'none' }}>⠿</td>
                          {type === 'Labour' && <>
                            <td style={td}>
                              <select style={inp} value={item.rate_id} onChange={e => updateItem(section._key, item._key, 'rate_id', e.target.value)}>
                                <option value="">— Select role —</option>
                                {labourRates.map(r => (
                                  <option key={r.id} value={r.id}>{r.category} {r.personnel}</option>
                                ))}
                              </select>
                            </td>
                            <td style={td}><input style={{ ...inp, textAlign: 'center' }} type="number" step="0.5" min="0" value={item.days} onFocus={e => e.target.select()} onChange={e => updateItem(section._key, item._key, 'days', e.target.value)} /></td>
                            <td style={td}><input style={{ ...inp, textAlign: 'center' }} type="number" step="0.5" min="0" value={item.reg_hours} onFocus={e => e.target.select()} onChange={e => updateItem(section._key, item._key, 'reg_hours', e.target.value)} placeholder="0" /></td>
                            <td style={td}><div style={pre$}><span style={pre$Sign}>$</span><input style={{ ...inp, paddingLeft: '16px', textAlign: 'right' }} type="number" step="0.01" min="0" value={item.reg_rate} onFocus={e => e.target.select()} onChange={e => updateItem(section._key, item._key, 'reg_rate', e.target.value)} placeholder="0.00" /></div></td>
                            <td style={td}><input style={{ ...inp, textAlign: 'center' }} type="number" step="0.5" min="0" value={item.ot_hours} onFocus={e => e.target.select()} onChange={e => updateItem(section._key, item._key, 'ot_hours', e.target.value)} placeholder="0" /></td>
                            <td style={td}><div style={pre$}><span style={pre$Sign}>$</span><input style={{ ...inp, paddingLeft: '16px', textAlign: 'right' }} type="number" step="0.01" min="0" value={item.ot_rate} onFocus={e => e.target.select()} onChange={e => updateItem(section._key, item._key, 'ot_rate', e.target.value)} placeholder="0.00" /></div></td>
                            <td style={{ ...td, textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>{money(calcItemTotal(item))}</td>
                            <td style={{ ...td, textAlign: 'center' }}><button type="button" style={{ background: 'none', color: 'var(--danger)', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px 4px' }} onClick={() => removeItem(section._key, item._key)}>&#x2715;</button></td>
                          </>}
                          {type === 'Equipment' && <>
                            <td style={td}>
                              <select style={inp} value={item.rate_id} onChange={e => updateItem(section._key, item._key, 'rate_id', e.target.value)}>
                                <option value="">— Select equipment —</option>
                                {equipRates.map(r => <option key={r.id} value={r.id}>{r.personnel}</option>)}
                                <option value="__manual">Other</option>
                              </select>
                            </td>
                            <td style={td}>
                              <select style={inp} value={item.equip_period || 'daily'} onChange={e => updateItem(section._key, item._key, 'equip_period', e.target.value)}>
                                <option value="hourly">Hourly</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                              </select>
                            </td>
                            <td style={td}><input style={{ ...inp, textAlign: 'center' }} type="number" step="1" min="0" value={item.qty} onFocus={e => e.target.select()} onChange={e => updateItem(section._key, item._key, 'qty', e.target.value)} /></td>
                            <td style={td}><input style={{ ...inp, textAlign: 'center' }} type="number" step="0.5" min="0" value={item.days} onFocus={e => e.target.select()} onChange={e => updateItem(section._key, item._key, 'days', e.target.value)} /></td>
                            <td style={td}>{(() => { const r = equipRates.find(r => r.id === item.rate_id); const na = r && item.rate_id !== '__manual' && !equipRateForPeriod(r, item.equip_period || 'daily'); return na ? <div style={{ padding: '4px 8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#9ca3af', fontSize: '12px', textAlign: 'center' }}>N/A</div> : <div style={pre$}><span style={pre$Sign}>$</span><input style={{ ...inp, paddingLeft: '16px', textAlign: 'right' }} type="number" step="0.01" min="0" value={item.reg_rate} onFocus={e => e.target.select()} onChange={e => updateItem(section._key, item._key, 'reg_rate', e.target.value)} placeholder="0.00" /></div> })()}</td>
                            <td style={td}><input style={{ ...inp, textAlign: 'center' }} type="number" step="1" min="0" value={item.markup} onFocus={e => e.target.select()} onChange={e => updateItem(section._key, item._key, 'markup', e.target.value)} placeholder="0" /></td>
                            <td style={{ ...td, textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>{money(calcItemTotal(item))}</td>
                            <td style={{ ...td, textAlign: 'center' }}><button type="button" style={{ background: 'none', color: 'var(--danger)', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px 4px' }} onClick={() => removeItem(section._key, item._key)}>&#x2715;</button></td>
                          </>}
                          {type === 'Third Party' && <>
                            <td style={td}><input style={inp} value={item.supplier} onChange={e => updateItem(section._key, item._key, 'supplier', e.target.value)} placeholder="Supplier / vendor" /></td>
                            <td style={td}><input style={inp} value={item.description} onChange={e => updateItem(section._key, item._key, 'description', e.target.value)} placeholder="Description" /></td>
                            <td style={td}><div style={pre$}><span style={pre$Sign}>$</span><input style={{ ...inp, paddingLeft: '16px', textAlign: 'right' }} type="number" step="0.01" min="0" value={item.cost} onFocus={e => e.target.select()} onChange={e => updateItem(section._key, item._key, 'cost', e.target.value)} placeholder="0.00" /></div></td>
                            <td style={td}><input style={{ ...inp, textAlign: 'center' }} type="number" step="1" min="0" value={item.markup} onFocus={e => e.target.select()} onChange={e => updateItem(section._key, item._key, 'markup', e.target.value)} placeholder="0" /></td>
                            <td style={{ ...td, textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>{money(calcItemTotal(item))}</td>
                            <td style={{ ...td, textAlign: 'center' }}>
                              {uploading === item._key ? (
                                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Uploading…</span>
                              ) : item.quote_url ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                                  <div style={{ fontSize: '10px', color: 'var(--muted)', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.quote_filename}>
                                    📎 {item.quote_filename || 'Quote'}
                                  </div>
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <a href={item.quote_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                                      <button type="button" className="small primary" style={{ fontSize: '10px', padding: '2px 8px' }}>View</button>
                                    </a>
                                    <button type="button" style={{ fontSize: '10px', padding: '2px 6px', background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', color: 'var(--muted)' }} onClick={() => { updateItem(section._key, item._key, 'quote_url', ''); updateItem(section._key, item._key, 'quote_filename', '') }}>✕</button>
                                  </div>
                                </div>
                              ) : (
                                <button type="button" style={{ background: 'none', border: '1px dashed #d1d5db', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', color: 'var(--muted)', cursor: 'pointer' }} onClick={() => setQuoteModal({ sectionKey: section._key, itemKey: item._key })}>
                                  📎 Attach
                                </button>
                              )}
                            </td>
                            <td style={{ ...td, textAlign: 'center' }}><button type="button" style={{ background: 'none', color: 'var(--danger)', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px 4px' }} onClick={() => removeItem(section._key, item._key)}>&#x2715;</button></td>
                          </>}
                        </tr>
                        )})}
                    </tbody>
                  </table>
                </div>
              )
            })}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {ITEM_TYPES.map(type => (
                <button key={type} type="button" className="small" onClick={() => addItem(section._key, type)}>+ {type}</button>
              ))}
            </div>
          </section>
        )
      })}



      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <Link href={`/projects/${project.id}`}><button>Cancel</button></Link>
        <button className="primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save estimate'}</button>
      </div>
    </div>
  )
}
