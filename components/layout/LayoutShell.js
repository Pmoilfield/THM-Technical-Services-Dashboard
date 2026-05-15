'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

const MIN_W = 180
const MAX_W = 380
const DEFAULT_W = 240

export default function LayoutShell({ sidebar, children }) {
  const [width, setWidth] = useState(DEFAULT_W)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(0)
  const [hovering, setHovering] = useState(false)

  // Load saved width
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-width')
    if (saved) setWidth(Number(saved))
  }, [])

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar wrapper — overrides the fixed width from CSS */}
      <div style={{ width, minWidth: width, flexShrink: 0, position: 'relative' }}>
        <div style={{ width, position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100, overflow: 'hidden' }}>
          {sidebar}
          {/* Drag handle */}
          <div
            onMouseDown={onMouseDown}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '5px',
              height: '100%',
              cursor: 'col-resize',
              zIndex: 101,
              background: hovering ? 'rgba(185,28,28,0.25)' : 'transparent',
              transition: 'background 0.15s',
            }}
          />
        </div>
      </div>
      {/* Main content — margin driven by width */}
      <main className="main-content" style={{ marginLeft: 0, flex: 1 }}>
        {children}
      </main>
    </div>
  )
}
