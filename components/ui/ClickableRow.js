'use client'
import { useRouter } from 'next/navigation'

export default function ClickableRow({ href, children, style }) {
  const router = useRouter()
  return (
    <tr style={{ cursor: 'pointer', ...style }} onClick={() => router.push(href)}>
      {children}
    </tr>
  )
}
