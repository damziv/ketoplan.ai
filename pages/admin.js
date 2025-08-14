// pages/admin.js
import { useEffect, useMemo, useState } from 'react'
import { withPageSession } from '@/lib/session'

const RANGES = [
  { key: '24h', label: '24h' },
  { key: '3d', label: '3 days' },
  { key: '1w', label: '1 week' },
  { key: '1m', label: '1 month' },
]

export default function AdminPage() {
  const [range, setRange] = useState('24h')
  const [metrics, setMetrics] = useState(null)
  const [emails, setEmails] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(100)
  const [loading, setLoading] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  async function guardedFetch(url) {
    const res = await fetch(url)
    if (res.status === 401) {
      // Session expired or not logged in
      window.location.href = '/admin/login'
      return Promise.reject(new Error('Unauthorized'))
    }
    return res
  }

  async function fetchMetrics(selected) {
    const r = selected || range
    const res = await guardedFetch(`/api/admin/metrics?range=${r}`)
    const json = await res.json()
    setMetrics(json)
  }

  async function fetchEmails(selected, p, ps) {
    const r = selected || range
    const pageParam = p || page
    const sizeParam = ps || pageSize
    setLoading(true)
    try {
      const res = await guardedFetch(`/api/admin/emails?range=${r}&page=${pageParam}&pageSize=${sizeParam}`)
      const json = await res.json()
      setEmails(json.emails || [])
      setTotal(json.total || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics(range)
    fetchEmails(range, 1, pageSize)
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  function exportCsv() {
    const header = 'email,created_at\n'
    const rows = emails.map((e) => `${JSON.stringify(e.email || '')},${e.created_at}`).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `emails_${range}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function logout() {
    try {
      setLoggingOut(true)
      await fetch('/api/admin/logout', { method: 'POST' })
      window.location.href = '/admin/login'
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with Logout */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button
            onClick={logout}
            disabled={loggingOut}
            className="px-3 py-1.5 rounded-md border bg-white hover:bg-gray-100 text-sm disabled:opacity-60"
          >
            {loggingOut ? 'Logging out…' : 'Logout'}
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Quiz activity and leads from Supabase. Use the quick range filters below.
        </p>

        {/* Range Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 rounded-full border text-sm ${
                range === r.key ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-100 border-gray-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Quiz Takers" value={metrics?.totals?.sessionsAllTime ?? '—'} hint="All-time" />
          <StatCard
            title="Quiz Takers (Range)"
            value={metrics?.inRange?.sessions ?? '—'}
            hint={metrics?.inRange?.startDate ? `Since ${new Date(metrics.inRange.startDate).toLocaleString()}` : 'Select range'}
          />
          <StatCard title="Total Leads" value={metrics?.totals?.leadsAllTime ?? '—'} hint="All-time" />
          <StatCard
            title="Leads (Range)"
            value={metrics?.inRange?.leads ?? '—'}
            hint={metrics?.inRange?.startDate ? `Since ${new Date(metrics.inRange.startDate).toLocaleString()}` : 'Select range'}
          />
        </div>

        {/* Emails Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Emails ({total.toLocaleString()})</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Page size</label>
            <select
              className="border rounded-md px-2 py-1 text-sm"
              value={pageSize}
              onChange={(e) => {
                const ps = parseInt(e.target.value, 10)
                setPageSize(ps)
                setPage(1)
                fetchEmails(range, 1, ps)
              }}
            >
              {[50, 100, 200, 500, 1000].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button onClick={exportCsv} className="px-3 py-1.5 rounded-md border bg-white hover:bg-gray-100 text-sm">
              Export CSV
            </button>
          </div>
        </div>

        {/* Emails Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-700">Email</th>
                  <th className="px-4 py-2 font-medium text-gray-700">Created</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-500" colSpan="2">
                      Loading…
                    </td>
                  </tr>
                ) : emails.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-500" colSpan="2">
                      No emails found.
                    </td>
                  </tr>
                ) : (
                  emails.map((row, idx) => (
                    <tr key={idx} className={idx % 2 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-2 font-mono">{row.email}</td>
                      <td className="px-4 py-2 text-gray-600">{new Date(row.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <span className="text-xs text-gray-600">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 rounded-md border bg-white disabled:opacity-50"
                disabled={page <= 1 || loading}
                onClick={() => {
                  const p = Math.max(1, page - 1)
                  setPage(p)
                  fetchEmails(range, p)
                }}
              >
                Prev
              </button>
              <button
                className="px-3 py-1.5 rounded-md border bg-white disabled:opacity-50"
                disabled={page >= totalPages || loading}
                onClick={() => {
                  const p = Math.min(totalPages, page + 1)
                  setPage(p)
                  fetchEmails(range, p)
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <footer className="text-xs text-gray-500 mt-8">
          Protected with a session. If you’re logged out or the session expires, you’ll be redirected to the login page.
        </footer>
      </div>
    </div>
  )
}

function StatCard({ title, value, hint }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-3xl font-semibold mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {hint ? <div className="text-xs text-gray-500 mt-1">{hint}</div> : null}
    </div>
  )
}

// SSR auth guard: redirect to /admin/login if not authenticated
export const getServerSideProps = withPageSession(async ({ req }) => {
  if (!req.session?.user?.role || req.session.user.role !== 'admin') {
    return { redirect: { destination: '/admin/login', permanent: false } }
  }
  return { props: {} }
})
