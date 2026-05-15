import Link from 'next/link'
import VendorForm from '@/components/vendors/VendorForm'

export default function NewVendorPage() {
  return (
    <div className="grid">
      <div className="page-header">
        <div>
          <p className="muted" style={{ marginBottom: '4px' }}><Link href="/vendors">← Vendors</Link></p>
          <h1>Add vendor</h1>
        </div>
      </div>
      <VendorForm />
    </div>
  )
}
