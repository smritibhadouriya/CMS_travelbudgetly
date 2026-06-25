// backend/controllers/author.controller.js
import * as authorService from '../lib/services/author.service.js';
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
      const exists = await authorService.findAuthorByEmail(email.toLowerCase());
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

    const author = await authorService.createAuthor({
      name:        name.trim(),
      slug:        await authorService.uniqueAuthorSlug(name.trim()),
      // ✅ null instead of empty string — Postgres unique allows many NULLs
      email:       email ? email.toLowerCase() : null,
      bio:         bio?.trim()         || "",
      designation: designation?.trim() || "",
      image,
      socialLinks: parseJSON(req.body.socialLinks) || {},
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
    const author = await authorService.findAuthorById(req.params.id);
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
      const dup = await authorService.findDuplicateEmail(incomingEmail.toLowerCase(), author.id);
      if (dup) {
        return res.status(409).json({ success: false, message: "Email already in use" });
      }
    }

    /* ── unique slug ── */
    let slug = author.slug;
    if (req.body.name?.trim()) {
      slug = await authorService.uniqueAuthorSlug(req.body.name.trim(), author.id);
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

    const updated = await authorService.updateAuthor(author.id, updates);

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

    const authors = await authorService.findAuthors(where);
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
    const author = await authorService.findAuthorById(req.params.id);
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
    const author = await authorService.findAuthorBySlug(req.params.slug);
    if (!author) {
      return res.status(404).json({ success: false, message: "Author not found" });
    }

    const blogs = await authorService.findPublishedBlogsByAuthor(author.id);

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
    await authorService.deleteAuthor(req.params.id);
    res.json({ success: true, message: "Author deleted" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ success: false, message: "Author not found" });
    }
    console.error("Delete author error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
