import * as newsletterService from '../lib/services/newsletter.service.js'

/* ── Subscribe ──────────────────────────────────────────────── */
export const subscribe = async (req, res) => {
  try {
    const { email } = req.body
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email is required' })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Already subscribed and active (active = not unsubscribed)
    const existing = await newsletterService.findSubscriberByEmail(normalizedEmail)
    if (existing) {
      if (existing.unsubscribedAt === null) {
        return res.status(409).json({ success: false, message: 'Email already subscribed' })
      }
      // Re-subscribe if previously unsubscribed
      await newsletterService.reactivateSubscriber(normalizedEmail)
      return res.status(200).json({ success: true, message: 'Re-subscribed successfully' })
    }

    const subscriber = await newsletterService.createSubscriber({ email: normalizedEmail })
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
    const subscriber = await newsletterService.findSubscriberByEmail(normalizedEmail)
    if (!subscriber) {
      return res.status(404).json({ success: false, message: 'Email not found' })
    }

    await newsletterService.deactivateSubscriber(normalizedEmail)

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
      newsletterService.countSubscribers(where),
      newsletterService.findSubscribers({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
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
    await newsletterService.deleteSubscriber(id)
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
      newsletterService.countSubscribers(),
      newsletterService.countSubscribers({ isActive: true }),
      newsletterService.countSubscribers({ isActive: false }),
      newsletterService.countSubscribers({ subscribedAt: { gte: sevenDaysAgo } }),
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
