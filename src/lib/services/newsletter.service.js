import prisma from '@/config/prisma';

/* The Newsletter model has NO `isActive` column. A subscriber is "active"
   while `unsubscribedAt` is null, and "inactive" once it is set. These helpers
   translate that logical state to/from the real schema so callers (the API
   routes + UI) can keep using `isActive` exactly as before. */
const activeWhere   = { unsubscribedAt: null };
const inactiveWhere = { unsubscribedAt: { not: null } };

// Translate a logical `{ isActive }` filter into the real schema field.
const mapActiveFilter = ({ isActive, ...rest } = {}) => {
  if (isActive === true)  return { ...rest, ...activeWhere };
  if (isActive === false) return { ...rest, ...inactiveWhere };
  return rest;
};

// Attach derived `isActive` so the admin UI keeps rendering unchanged.
const withIsActive = (row) =>
  row ? { ...row, isActive: row.unsubscribedAt === null } : row;

/* reusable select for admin subscriber listing (real columns only) */
export const SUBSCRIBER_LIST_SELECT = {
  id: true, email: true, subscribedAt: true, unsubscribedAt: true, createdAt: true,
};

export const findSubscriberByEmail = (email) =>
  prisma.newsletter.findUnique({ where: { email } });

export const reactivateSubscriber = (email) =>
  prisma.newsletter.update({
    where: { email },
    data:  { unsubscribedAt: null, subscribedAt: new Date() },
  });

export const createSubscriber = ({ email }) =>
  prisma.newsletter.create({ data: { email } });

export const deactivateSubscriber = (email) =>
  prisma.newsletter.update({
    where: { email },
    data:  { unsubscribedAt: new Date() },
  });

export const countSubscribers = (where = {}) =>
  prisma.newsletter.count({ where: mapActiveFilter(where) });

export const findSubscribers = async ({ where, skip, take }) => {
  const rows = await prisma.newsletter.findMany({
    where: mapActiveFilter(where),
    orderBy: { subscribedAt: 'desc' },
    skip,
    take,
    select: SUBSCRIBER_LIST_SELECT,
  });
  return rows.map(withIsActive);
};

/* Admin paginated listing — returns the exact `data` shape the admin
   subscribers list needs. isActive→unsubscribedAt translation and
   pagination are inherited from countSubscribers/findSubscribers. */
export const getSubscribersPage = async ({ page = 1, limit = 20, status } = {}) => {
  const where = {};
  if (status === 'active')   where.isActive = true;
  if (status === 'inactive') where.isActive = false;

  const [total, subscribers] = await Promise.all([
    countSubscribers(where),
    findSubscribers({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
  ]);

  return {
    subscribers,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

/* Admin stats — returns the exact `data` shape the admin stats endpoint needs. */
export const getSubscriberStats = async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [total, active, inactive, newThisWeek] = await Promise.all([
    countSubscribers(),
    countSubscribers({ isActive: true }),
    countSubscribers({ isActive: false }),
    countSubscribers({ subscribedAt: { gte: sevenDaysAgo } }),
  ]);
  return { total, active, inactive, newThisWeek };
};

export const deleteSubscriber = (id) =>
  prisma.newsletter.delete({ where: { id } });
