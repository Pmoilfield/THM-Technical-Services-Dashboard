'use client'
import { useState } from 'react'
import { deleteProject } from '@/app/actions/deleteProject'

export default function DeleteProjectButton({ projectId, projectName }) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    if (confirm.trim().toLowerCase() !== projectName.trim().toLowerCase()) return
    setLoading(true)
    setError('')
    const result = await deleteProject(projectId)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    window.location.href = '/projects'
  }

  const matches = confirm.trim().toLowerCase() === projectName.trim().toLowerCase()

  return (
    <>
      <button
        className="danger"
        onClick={() => { setOpen(true); setConfirm(''); setError('') }}
        style={{ opacity: 0.8, borderRadius: '8px' }}
      >
        Delete
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginBottom: '8px', color: '#b91c1c' }}>Delete project?</h2>
            <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '20px', lineHeight: 1.5 }}>
              This will permanently delete <strong>{projectName}</strong> and all associated estimate sections, line items, field tickets, purchase orders, and invoices. This cannot be undone.
            </p>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Type <strong>{projectName}</strong> to confirm
            </label>
            <input
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder={projectName}
              autoFocus
              style={{ width: '100%', marginBottom: '16px', borderColor: confirm && !matches ? '#b91c1c' : undefined }}
              onKeyDown={e => e.key === 'Enter' && matches && !loading && handleDelete()}
            />
            {error && <p style={{ color: '#b91c1c', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setOpen(false)} disabled={loading}>Cancel</button>
              <button className="danger" onClick={handleDelete} disabled={!matches || loading}>
                {loading ? 'Deleting…' : 'Delete project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
