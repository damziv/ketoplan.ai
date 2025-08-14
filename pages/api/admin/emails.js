// pages/api/admin/emails.js
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
    const page = parseInt(Array.isArray(req.query.page) ? req.query.page[0] : req.query.page || '1', 10) || 1
    const pageSizeRaw = parseInt(Array.isArray(req.query.pageSize) ? req.query.pageSize[0] : req.query.pageSize || '100', 10) || 100
    const pageSize = Math.min(Math.max(pageSizeRaw, 1), 1000)
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    const startDate = getStartDate(r)

    let query = supabaseAdmin
      .from('sessions')
      .select('email, created_at', { count: 'exact' })
      .not('email', 'is', null)
      .neq('email', '')

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString())
    }

    query = query.order('created_at', { ascending: false }).range(start, end)

    const { data, count, error } = await query
    if (error) throw error

    res.status(200).json({
      range: r || null,
      page,
      pageSize,
      total: count || 0,
      emails: data || [],
    })
  } catch (err) {
    console.error('emails error', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

export default withApiSession(handler)
