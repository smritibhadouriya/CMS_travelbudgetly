import prisma from '../config/prisma.js'

/* ── Subscribe ──────────────────────────────────────────────── */
export const subscribe = async (req, res) => {
  try {
    const { email } = req.body
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email is required' })
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || ''
    const normalizedEmail = email.toLowerCase().trim()

    // Already subscribed and active
    const existing = await prisma.newsletter.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      if (existing.isActive) {
        return res.status(409).json({ success: false, message: 'Email already subscribed' })
      }
      // Re-subscribe if previously unsubscribed
      await prisma.newsletter.update({
        where: { email: normalizedEmail },
        data:  { isActive: true, unsubscribedAt: null, subscribedAt: new Date() },
      })
      return res.status(200).json({ success: true, message: 'Re-subscribed successfully' })
    }

    const subscriber = await prisma.newsletter.create({ data: { email: normalizedEmail, ip } })
    return res.status(201).json({
      success: true,
      message: 'Subscribed successfully',
      data:    { id: subscriber.id, email: subscriber.email },
    })
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ success: false, message: 'Email already subscribed' })
    }
    console.error('Newsletter subscribe error:', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

/* ── Unsubscribe ────────────────────────────────────────────── */
export const unsubscribe = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' })

    const normalizedEmail = email.toLowerCase().trim()
    const subscriber = await prisma.newsletter.findUnique({ where: { email: normalizedEmail } })
    if (!subscriber) {
      return res.status(404).json({ success: false, message: 'Email not found' })
    }

    await prisma.newsletter.update({
      where: { email: normalizedEmail },
      data:  { isActive: false, unsubscribedAt: new Date() },
    })

    return res.status(200).json({ success: true, message: 'Unsubscribed successfully' })
  } catch (err) {
    console.error('Newsletter unsubscribe error:', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

/* ── Get All (Admin) ────────────────────────────────────────── */
export const getAllSubscribers = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query

    const where = {}
    if (status === 'active')   where.isActive = true
    if (status === 'inactive') where.isActive = false

    const [total, subscribers] = await Promise.all([
      prisma.newsletter.count({ where }),
      prisma.newsletter.findMany({
        where,
        orderBy: { subscribedAt: 'desc' },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        select:  { id: true, email: true, isActive: true, subscribedAt: true, unsubscribedAt: true, ip: true, createdAt: true },
      }),
    ])

    return res.status(200).json({
      success: true,
      data: {
        subscribers,
        total,
        page:       Number(page),
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (err) {
    console.error('Newsletter getAll error:', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

/* ── Delete (Admin) ─────────────────────────────────────────── */
export const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.newsletter.delete({ where: { id } })
    return res.status(200).json({ success: true, message: 'Deleted successfully' })
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ success: false, message: 'Subscriber not found' })
    console.error('Newsletter delete error:', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

/* ── Stats (Admin) ──────────────────────────────────────────── */
export const getStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [total, active, inactive, newThisWeek] = await Promise.all([
      prisma.newsletter.count(),
      prisma.newsletter.count({ where: { isActive: true } }),
      prisma.newsletter.count({ where: { isActive: false } }),
      prisma.newsletter.count({ where: { subscribedAt: { gte: sevenDaysAgo } } }),
    ])

    return res.status(200).json({
      success: true,
      data: { total, active, inactive, newThisWeek },
    })
  } catch (err) {
    console.error('Newsletter stats error:', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}
