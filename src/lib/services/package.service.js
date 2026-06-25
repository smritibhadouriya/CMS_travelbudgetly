import prisma from '@/config/prisma';

/* ── List packages (paginated) ── */
export const listPackages = async ({ where, skip, take }) =>
  prisma.package.findMany({
    where,
    orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
    skip,
    take,
  });

/* ── Count packages ── */
export const countPackages = async (where) =>
  prisma.package.count({ where });

/* ── Find one package by slug ── */
export const findPackageBySlug = async (slug) =>
  prisma.package.findUnique({ where: { slug } });

/* ── Create a package ── */
export const createPackage = async (data) =>
  prisma.package.create({ data });

/* ── Update a package by id ── */
export const updatePackage = async (id, data) =>
  prisma.package.update({ where: { id }, data });

/* ── Delete a package by id ── */
export const deletePackage = async (id) =>
  prisma.package.delete({ where: { id } });
