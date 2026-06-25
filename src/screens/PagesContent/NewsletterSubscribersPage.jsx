'use client';
import { useState, useEffect, useCallback } from 'react'
import {
  getNewsletterSubscribers,
  getNewsletterStats,
  deleteNewsletterSubscriber,
} from '../../service/newsletter.service'

/* ── Stat Card ──────────────────────────────────────────────── */
const StatCard = ({ label, value, color }) => (
  <div className={`rounded-2xl p-5 flex flex-col gap-1 ${color}`}>
    <span className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</span>
    <span className="text-3xl font-black">{value ?? '—'}</span>
  </div>
)

/* ── Email Detail Modal ─────────────────────────────────────── */
const EmailModal = ({ subscriber, onClose, onDelete }) => {
  if (!subscriber) return null

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-xl">
            {subscriber.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-900 break-all">{subscriber.email}</p>
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
              subscriber.isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-600'
            }`}>
              {subscriber.isActive ? 'Active' : 'Unsubscribed'}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3 text-sm border-t border-gray-100 pt-4">
          <Row label="Subscribed At"    value={fmt(subscriber.subscribedAt)} />
          <Row label="Unsubscribed At"  value={fmt(subscriber.unsubscribedAt)} />
          <Row label="IP Address"       value={subscriber.ip || '—'} />
          <Row label="Record Created"   value={fmt(subscriber.createdAt)} />
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(subscriber.id)}
          className="mt-6 w-full py-2.5 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition"
        >
          Delete Subscriber
        </button>
      </div>
    </div>
  )
}

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4">
    <span className="text-gray-400 font-medium shrink-0">{label}</span>
    <span className="text-gray-800 font-semibold text-right break-all">{value}</span>
  </div>
)

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export const NewsletterSubscribersPage = () => {
  const [subscribers, setSubscribers] = useState([])
  const [stats,       setStats]       = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [selected,    setSelected]    = useState(null)   // for modal
  const [status,      setStatus]      = useState('')     // filter: '' | 'active' | 'inactive'
  const [page,        setPage]        = useState(1)
  const [totalPages,  setTotalPages]  = useState(1)
  const [total,       setTotal]       = useState(0)
  const [search,      setSearch]      = useState('')

  const LIMIT = 15

  /* ── Fetch ── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [subRes, statRes] = await Promise.all([
        getNewsletterSubscribers({ page, limit: LIMIT, status }),
        getNewsletterStats(),
      ])
      setSubscribers(subRes.data.data.subscribers)
      setTotalPages(subRes.data.data.totalPages)
      setTotal(subRes.data.data.total)
      setStats(statRes.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => { fetchData() }, [fetchData])

  /* ── Delete ── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subscriber permanently?')) return
    try {
      await deleteNewsletterSubscriber(id)
      setSelected(null)
      fetchData()
    } catch (err) {
      alert('Delete failed. Try again.')
    }
  }

  /* ── Client-side search filter ── */
  const visible = search.trim()
    ? subscribers.filter(s => s.email.toLowerCase().includes(search.toLowerCase()))
    : subscribers

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }) : '—'

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Newsletter Subscribers</h1>
        <p className="text-sm text-gray-500 mt-1">Manage all newsletter subscriptions</p>
      </div>

      {/* Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total"        value={stats.total}       color="bg-blue-50   text-blue-800" />
          <StatCard label="Active"       value={stats.active}      color="bg-green-50  text-green-800" />
          <StatCard label="Unsubscribed" value={stats.inactive}    color="bg-red-50    text-red-800" />
          <StatCard label="This Week"    value={stats.newThisWeek} color="bg-violet-50 text-violet-800" />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" />
          </svg>
          <input
            type="text"
            placeholder="Search email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-400 transition"
          />
        </div>

        {/* Status Filter */}
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:border-blue-400 transition"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Unsubscribed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm font-medium">No subscribers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Subscribed</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visible.map((sub, idx) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    onClick={() => setSelected(sub)}
                  >
                    <td className="px-5 py-4 text-gray-400 font-medium">
                      {(page - 1) * LIMIT + idx + 1}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-sm shrink-0">
                          {sub.email.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800 truncate max-w-[200px]">
                          {sub.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        sub.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sub.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                        {sub.isActive ? 'Active' : 'Unsubscribed'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{fmt(sub.subscribedAt)}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(sub.id) }}
                        className="text-red-400 hover:text-red-600 transition p-1 rounded-lg hover:bg-red-50"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 disabled:opacity-40 hover:border-blue-400 hover:text-blue-600 transition"
              >
                ← Prev
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 disabled:opacity-40 hover:border-blue-400 hover:text-blue-600 transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Email Detail Modal */}
      <EmailModal
        subscriber={selected}
        onClose={() => setSelected(null)}
        onDelete={handleDelete}
      />
    </div>
  )
}

export default NewsletterSubscribersPage