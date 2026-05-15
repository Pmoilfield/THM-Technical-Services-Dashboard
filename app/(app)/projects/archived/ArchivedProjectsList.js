'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate, statusClass } from '@/lib/calculations'

export default function ArchivedProjectsList({ projects }) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return projects
    const q = search.toLowerCase()
    return projects.filter(p => {
      const hay = [p.name, p.client_name, p.estimate_no, p.internal_job_no, p.project_manager].join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [projects, search])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search project, job #…"
          style={{ maxWidth: '280px' }}
        />
        {search && (
          <button className="small" onClick={() => setSearch('')}>Clear</button>
        )}
        <span className="muted" style={{ fontSize: '12px', marginLeft: 'auto' }}>
          {filtered.length} of {projects.length} projects
        </span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Project</th><th>Client</th><th>Status</th><th>Manager</th><th>Last updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? filtered.map(project => (
              <tr key={project.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/projects/${project.id}`)}>
                <td>
                  <strong>{project.name}</strong>
                  <div className="fine-print">{project.estimate_no || project.internal_job_no || ''}</div>
                </td>
                <td>{project.client_name || '—'}</td>
                <td><span className={`status-pill ${statusClass(project.status)}`}>{project.status}</span></td>
                <td>{project.project_manager || '—'}</td>
                <td>{formatDate(project.updated_at)}</td>
              </tr>
            )) : (
              <tr><td colSpan="5" className="empty">No projects match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
