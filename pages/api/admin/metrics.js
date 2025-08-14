// pages/api/admin/metrics.js
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { withApiSession } from '@/lib/session'

function getStartDate(range) {
  const now = Date.now()
  switch (range) {
    case '24h':
      return new Date(now - 24 * 60 * 60 * 1000)
    case '3d':
      return new Date(now - 3 * 24 * 60 * 60 * 1000)
    case '1w':
      return new Date(now - 7 * 24 * 60 * 60 * 1000)
    case '1m':
      return new Date(now - 30 * 24 * 60 * 60 * 1000)
    default:
      return null
  }
}

async function handler(req, res) {
  // Optional: method guard
  if (req.method !== 'GET') return res.status(405).end()

  // Auth guard
  if (!req.session?.user?.role || req.session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const r = Array.isArray(req.query.range) ? req.query.range[0] : req.query.range
    const startDate = getStartDate(r)

    const totalSessionsPromise = supabaseAdmin
      .from('sessions')
      .select('*', { count: 'exact', head: true })

    const totalLeadsPromise = supabaseAdmin
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .not('email', 'is', null)
      .neq('email', '')

    let inRangeSessionsPromise = null
    let inRangeLeadsPromise = null

    if (startDate) {
      inRangeSessionsPromise = supabaseAdmin
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())

      inRangeLeadsPromise = supabaseAdmin
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .not('email', 'is', null)
        .neq('email', '')
    }

    const [totalSessionsRes, totalLeadsRes, inRangeSessionsRes, inRangeLeadsRes] = await Promise.all([
      totalSessionsPromise,
      totalLeadsPromise,
      inRangeSessionsPromise,
      inRangeLeadsPromise,
    ])

    res.status(200).json({
      range: r || null,
      totals: {
        sessionsAllTime: totalSessionsRes?.count || 0,
        leadsAllTime: totalLeadsRes?.count || 0,
      },
      inRange: startDate
        ? {
            sessions: (inRangeSessionsRes && inRangeSessionsRes.count) || 0,
            leads: (inRangeLeadsRes && inRangeLeadsRes.count) || 0,
            startDate: startDate.toISOString(),
          }
        : null,
    })
  } catch (err) {
    console.error('metrics error', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

export default withApiSession(handler)
