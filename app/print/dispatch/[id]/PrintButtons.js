'use client'

export default function PrintButtons({ projectId }) {
  return (
    <div className="no-print" style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 999, display: 'flex', gap: '8px' }}>
      <button
        onClick={() => window.history.back()}
        style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
      >
        ← Back
      </button>
      <button
        onClick={() => window.print()}
        style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', background: '#111', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
      >
        🖨 Print / Save PDF
      </button>
    </div>
  )
}
