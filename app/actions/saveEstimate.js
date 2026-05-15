'use server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function saveEstimate(projectId, sections, grandTotal, gstAmount) {
  const supabase = createAdminSupabase()

  for (const [sectionIdx, section] of sections.entries()) {
    const sectionNumber = sectionIdx + 1
    let sectionId = section._id || section.id

    if (!sectionId) {
      const { data, error: err } = await supabase.from('estimate_sections').insert({
        project_id: projectId,
        number: sectionNumber,
        title: section.title || null,
        sort_order: sectionNumber,
      }).select().single()
      if (err) return { error: err.message }
      sectionId = data.id
    } else {
      const { error: updateErr } = await supabase.from('estimate_sections').update({
        number: sectionNumber,
        title: section.title || null,
        sort_order: sectionNumber
      }).eq('id', sectionId)
      if (updateErr) return { error: updateErr.message }
    }

    await supabase.from('estimate_items').delete().eq('section_id', sectionId)

    const lineItems = section.items.map((item, idx) => ({
      section_id: sectionId,
      type: item.type,
      description: item.description || null,
      supplier: item.supplier || null,
      qty: parseFloat(item.qty) || null,
      days: parseFloat(item.days) || null,
      reg_hours: parseFloat(item.reg_hours) || null,
      reg_rate: parseFloat(item.reg_rate) || null,
      ot_hours: parseFloat(item.ot_hours) || null,
      ot_rate: parseFloat(item.ot_rate) || null,
      cost: parseFloat(item.cost) || null,
      markup: item.markup ? parseFloat(item.markup) / 100 : null,
      rate_id: item.rate_id || null,
      category: item.category || null,
      equip_period: item.type === 'Equipment' ? (item.equip_period || 'daily') : null,
      quote_url: item.quote_url || null,
      quote_filename: item.quote_filename || null,
      sort_order: idx,
    }))

    if (lineItems.length) {
      const { error: itemErr } = await supabase.from('estimate_items').insert(lineItems)
      if (itemErr) return { error: itemErr.message }
    }
  }

  const { error: projErr } = await supabase.from('projects').update({
    estimate_subtotal: grandTotal,
    gst_amount: gstAmount,
    total_including_tax: grandTotal + gstAmount,
    updated_at: new Date().toISOString(),
  }).eq('id', projectId)

  if (projErr) return { error: projErr.message }

  revalidatePath('/', 'layout')
  return { success: true }
}
