import { createServerSupabase } from '@/lib/supabase-server'
import { numberFmt, blockManDays, disciplineManDays, dateSpanDays } from '@/lib/calculations'
import Link from 'next/link'

export default async function SchedulePage() {
  const supabase = await createServerSupabase()
  const [{ data: blocks }, { data: disciplines }] = await Promise.all([
    supabase.from('schedule_blocks').select('*, projects(name)').order('start_date'),
    supabase.from('schedule_disciplines').select('*'),
  ])

  const blockList = blocks || []
  const discList = disciplines || []

  const totalManDays = blockList.reduce((sum, b) => sum + blockManDays(b, discList), 0)

  return (
    <div className="grid">
      <div className="page-header">
        <div className="split">
          <div><h1>Schedule / Manpower</h1><p className="muted">{blockList.length} schedule blocks Â· {numberFmt(totalManDays, 1)} total man-days</p></div>
        </div>
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Project / Block</th><th>Status</th><th>Start</th><th>End</th><th>Duration</th><th className="numeric">Mech MD</th><th className="numeric">Elec MD</th><th className="numeric">Inst MD</th><th className="numeric">Total MD</th></tr>
            </thead>
            <tbody>
              {blockList.length ? blockList.map(block => {
                const blockDiscs = discList.filter(d => d.block_id === block.id)
                const mech = disciplineManDays(blockDiscs.find(d => d.discipline === 'Mechanical'))
                const elec = disciplineManDays(blockDiscs.find(d => d.discipline === 'Electrical'))
                const inst = disciplineManDays(blockDiscs.find(d => d.discipline === 'Instrumentation'))
                const total = blockManDays(block, discList)
                return (
                  <tr key={block.id}>
                    <td>
                      <strong>{block.name}</strong>
                      <div className="fine-print">{block.projects?.name || 'Unlinked'} {block.job_no ? `Â· ${block.job_no}` : ''}</div>
                    </td>
                    <td><span className={`status-pill status-${block.status}`}>{block.status}</span></td>
                    <td>{block.start_date || 'â€"'}</td>
                    <td>{block.end_date || 'â€"'}</td>
                    <td>{dateSpanDays(block.start_date, block.end_date)} days</td>
                    <td className="numeric">{numberFmt(mech)}</td>
                    <td className="numeric">{numberFmt(elec)}</td>
                    <td className="numeric">{numberFmt(inst)}</td>
                    <td className="numeric"><strong>{numberFmt(total)}</strong></td>
                  </tr>
                )
              }) : (
                <tr><td colSpan="9" className="empty">No schedule blocks yet. Import from your manpower workbook or add manually via a project.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

