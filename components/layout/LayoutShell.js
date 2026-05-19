'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

const MIN_W = 180
const MAX_W = 380
const DEFAULT_W = 240

export default function LayoutShell({ sidebar, children }) {
  const [width,     setWidth]     = useState(DEFAULT_W)
  const [collapsed, setCollapsed] = useState(false)
  const [hovering,  setHovering]  = useState(false)
  const [btnHover,  setBtnHover]  = useState(false)
  const dragging = useRef(false)
  const startX   = useRef(0)
  const startW   = useRef(0)

  // Load saved prefs
  useEffect(() => {
    const savedW = localStorage.getItem('sidebar-width')
    const savedC = localStorage.getItem('sidebar-collapsed')
    if (savedW) setWidth(Number(savedW))
    if (savedC === 'true') setCollapsed(true)
  }, [])

  function toggleSidebar() {
    setCollapsed(c => {
      const next = !c
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    startW.current = width
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
  }, [width])

  useEffect(() => {
    function onMouseMove(e) {
      if (!dragging.current) return
      const delta = e.clientX - startX.current
      setWidth(Math.min(MAX_W, Math.max(MIN_W, startW.current + delta)))
    }
    function onMouseUp() {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      setWidth(w => { localStorage.setItem('sidebar-width', String(w)); return w })
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const sidebarW = collapsed ? 0 : width

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar wrapper */}
      <div style={{ width: sidebarW, minWidth: sidebarW, flexShrink: 0, position: 'relative', transition: 'width 0.22s ease, min-width 0.22s ease' }}>
        <div style={{ width, position: 'fixed', top: 0, left: collapsed ? -width : 0, height: '100vh', zIndex: 100, overflow: 'hidden', transition: 'left 0.22s ease' }}>
          {sidebar}
          {/* Drag handle */}
          {!collapsed && (
            <div
              onMouseDown={onMouseDown}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              style={{ position: 'absolute', top: 0, right: 0, width: '5px', height: '100%', cursor: 'col-resize', zIndex: 101, background: hovering ? 'rgba(185,28,28,0.25)' : 'transparent', transition: 'background 0.15s' }}
            />
          )}
        </div>
      </div>

      {/* Hamburger toggle button */}
      <button
        onClick={toggleSidebar}
        onMouseEnter={() => setBtnHover(true)}
        onMouseLeave={() => setBtnHover(false)}
        title={collapsed ? 'Show sidebar' : 'Hide sidebar'}
        style={{
          position: 'fixed',
          top: '18px',
          left: sidebarW + 10,
          zIndex: 200,
          width: '30px',
          height: '30px',
          borderRadius: '6px',
          border: '1px solid var(--line)',
          background: btnHover ? '#f4f4f5' : '#fff',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          padding: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          transition: 'left 0.22s ease, background 0.15s',
          flexShrink: 0,
        }}
      >
        {[0,1,2].map(i => (
          <span key={i} style={{ display: 'block', width: '14px', height: '2px', background: '#374151', borderRadius: '1px' }} />
        ))}
      </button>

      {/* Main content */}
      <main className="main-content" style={{ marginLeft: 0, flex: 1, transition: 'margin 0.22s ease' }}>
        {children}
      </main>
    </div>
  )
}
