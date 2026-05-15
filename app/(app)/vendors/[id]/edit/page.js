import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import VendorForm from '@/components/vendors/VendorForm'

export default async function EditVendorPage({ params }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: vendor } = await supabase.from('vendors').select('*').eq('id', id).single()
  if (!vendor) notFound()

  return (
    <div className="grid">
      <div className="page-header">
        <div>
          <p className="muted" style={{ marginBottom: '4px' }}><Link href="/vendors">← Vendors</Link></p>
          <h1>{vendor.name}</h1>
        </div>
      </div>
      <VendorForm vendor={vendor} />
    </div>
  )
}
