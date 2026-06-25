// backend/controllers/author.controller.js
import prisma from "../config/prisma.js";
import { fileUrl } from "../utils/helpers.js";

/* ── helpers ── */
const normalizeImage = (raw = {}) => ({
  mode:  raw?.mode === "url" ? "url" : "upload",
  src:   raw?.src   || "",
  alt:   raw?.alt   || "",
  title: raw?.title || "",
});

const parseJSON = (val) => {
  try {
    return typeof val === "string" ? JSON.parse(val) : val;
  } catch {
    return {};
  }
};

const toSlug = (text = "") =>
  text.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

/* slug ko unique banao — Author table mein collision check */
const uniqueAuthorSlug = async (name, excludeId = null) => {
  const baseSlug = toSlug(name);
  let slug = baseSlug;
  let counter = 1;
  while (
    await prisma.author.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${baseSlug}-${counter++}`;
  }
  return slug;
};

/* ══════════════════════════════════════
   CREATE AUTHOR
══════════════════════════════════════ */
export const createAuthor = async (req, res) => {
  try {
    const { name, bio, designation } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    // ✅ Email optional — only check uniqueness if provided
    const email = req.body.email?.trim() || null;
    if (email) {
      const exists = await prisma.author.findUnique({ where: { email: email.toLowerCase() } });
      if (exists) {
        return res.status(409).json({ success: false, message: "Author with this email already exists" });
      }
    }

    // ✅ separate keys — 'imageData' JSON metadata, 'imageFile' File binary
    const imageData = parseJSON(req.body.imageData);
    const imageFile = req.file || req.files?.find(f => f.fieldname === "imageFile");

    const image = {
      ...normalizeImage(imageData),
      src: imageData?.mode === "url"
        ? (imageData.src || "")
        : imageFile
          ? fileUrl(imageFile.path)
          : "",
    };

    const author = await prisma.author.create({
      data: {
        name:        name.trim(),
        slug:        await uniqueAuthorSlug(name.trim()),
        // ✅ null instead of empty string — Postgres unique allows many NULLs
        email:       email ? email.toLowerCase() : null,
        bio:         bio?.trim()         || "",
        designation: designation?.trim() || "",
        image,
        socialLinks: parseJSON(req.body.socialLinks) || {},
      },
    });

    res.status(201).json({ success: true, author });
  } catch (err) {
    console.error("Create author error:", err);
    if (err.code === "P2002") {
      return res.status(409).json({ success: false, message: "Email already in use" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════
   UPDATE AUTHOR
══════════════════════════════════════ */
export const updateAuthor = async (req, res) => {
  try {
    const author = await prisma.author.findUnique({ where: { id: req.params.id } });
    if (!author) {
      return res.status(404).json({ success: false, message: "Author not found" });
    }

    // ✅ separate keys
    const imageData = req.body.imageData ? parseJSON(req.body.imageData) : null;
    const imageFile = req.file || req.files?.find(f => f.fieldname === "imageFile");

    const parsedSocialLinks = req.body.socialLinks
      ? parseJSON(req.body.socialLinks)
      : author.socialLinks;

    /* ── duplicate email check ── */
    const incomingEmail = req.body.email?.trim() || null;
    if (incomingEmail && incomingEmail.toLowerCase() !== author.email) {
      const dup = await prisma.author.findFirst({
        where: { email: incomingEmail.toLowerCase(), id: { not: author.id } },
        select: { id: true },
      });
      if (dup) {
        return res.status(409).json({ success: false, message: "Email already in use" });
      }
    }

    /* ── unique slug ── */
    let slug = author.slug;
    if (req.body.name?.trim()) {
      slug = await uniqueAuthorSlug(req.body.name.trim(), author.id);
    }

    /* ── build updates ── */
    const updates = {
      name:        req.body.name?.trim()  || author.name,
      slug,
      bio:         req.body.bio         !== undefined ? req.body.bio         : author.bio,
      designation: req.body.designation !== undefined ? req.body.designation : author.designation,
      isActive:    req.body.isActive    !== undefined
                     ? req.body.isActive === "true" || req.body.isActive === true
                     : author.isActive,
      socialLinks: parsedSocialLinks,
    };

    // ✅ email — empty string = remove (null), filled = update, absent = keep existing
    if (req.body.email !== undefined) {
      updates.email = incomingEmail ? incomingEmail.toLowerCase() : null;
    }

    /* ── image update ── */
    if (imageData) {
      const isRemoved =
        imageData.mode !== "upload" &&
        (imageData.src === "" || imageData.src === null);

      updates.image = {
        ...normalizeImage(imageData),
        src: isRemoved
          ? ""
          : imageData.mode === "url"
            ? (imageData.src || "")
            : imageFile
              ? fileUrl(imageFile.path)   // ✅ naya file upload
              : author.image?.src || "",  // ✅ purani image keep karo
      };
    }

    const updated = await prisma.author.update({
      where: { id: author.id },
      data:  updates,
    });

    res.json({ success: true, author: updated });
  } catch (err) {
    console.error("Update author error:", err);
    if (err.code === "P2002") {
      return res.status(409).json({ success: false, message: "Email already in use" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════
   GET ALL AUTHORS
══════════════════════════════════════ */
export const getAllAuthors = async (req, res) => {
  try {
    const where = {};
    if (req.query.active === "true") where.isActive = true;

    const authors = await prisma.author.findMany({ where, orderBy: { createdAt: "desc" } });
    res.json({ success: true, authors });
  } catch (err) {
    console.error("Get authors error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════
   GET AUTHOR BY ID
══════════════════════════════════════ */
export const getAuthorById = async (req, res) => {
  try {
    const author = await prisma.author.findUnique({ where: { id: req.params.id } });
    if (!author) {
      return res.status(404).json({ success: false, message: "Author not found" });
    }
    res.json({ success: true, author });
  } catch (err) {
    console.error("Get author error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════
   GET AUTHOR PROFILE + BLOGS
══════════════════════════════════════ */
export const getAuthorWithBlogs = async (req, res) => {
  try {
    const author = await prisma.author.findUnique({ where: { slug: req.params.slug } });
    if (!author) {
      return res.status(404).json({ success: false, message: "Author not found" });
    }

    const blogs = await prisma.blog.findMany({
      where:   { authorId: author.id, isPublished: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, slug: true, content: true,
        bannerImage: true, image: true, category: true, destination: true,
        tags: true, readtime: true, createdAt: true, publishedDate: true,
      },
    });

    res.json({ success: true, author, blogs });
  } catch (err) {
    console.error("Author profile error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════
   DELETE AUTHOR
══════════════════════════════════════ */
export const deleteAuthor = async (req, res) => {
  try {
    await prisma.author.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Author deleted" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ success: false, message: "Author not found" });
    }
    console.error("Delete author error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
