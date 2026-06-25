import prisma from '@/config/prisma';

/* The Newsletter model has NO `isActive` column. A subscriber is "active"
   while `unsubscribedAt` is null, and "inactive" once it is set. These helpers
   translate that logical state to/from the real schema so callers (controller
   + UI) can keep using `isActive` exactly as before. */
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

export const deleteSubscriber = (id) =>
  prisma.newsletter.delete({ where: { id } });
