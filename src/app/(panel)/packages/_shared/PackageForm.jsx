'use client';
// src/screens/PagesContent/PackageForm.jsx
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { getPackages, createPackage, updatePackage } from '@/client-api/api';
import { Input, Textarea, Toggle, SectionCard, Divider, Grid2 } from '@/components/ui/UI.jsx';
import { SeoSection } from '@/components/ui/Sections.jsx';
import ImagePicker from '@/components/ui/ImagePicker.jsx';

const mapImg = (raw) => ({ url: (raw?.src || raw?.url || ""), file: null, _preview: null, alt: raw?.alt || "", title: raw?.title || "" });
const cleanImg = (i) => ({ src: (i?.file instanceof File) ? "" : (i?.url || ""), alt: i?.alt || "", title: i?.title || "" });

const blankSeo = () => ({
  metaTitle: "", metaDescription: "", metaKeywords: [], canonicalUrl: "",
  index: true, follow: true, image: { url: "", file: null, _preview: null, alt: "", title: "" },
  h1: "", jsonSchema: {},
});

const blank = () => ({
  title: "", slug: "", location: "", duration: "",
  allDestinations: "", destinations: [],
  price: "", originalPrice: "", discountPercent: "", currency: "INR",
  badge: [], packageType: "", tourCategory: "", difficulty: "",
  rating: "", reviewCount: "",
  imageUrls: [],
  itinerary: [],
  inclusions: [], exclusions: [], tags: [],
  mealsIncluded: false, hotelIncluded: true, transferIncluded: true,
  externalUrl: "", externalId: "",
  isPublished: false, isFeatured: false, isSpecialOffer: false, isSpritual: false,
  order: "",
  seo: blankSeo(),
});

// CSV join/split helpers for array <-> comma-separated text
const arrToCsv = (a) => Array.isArray(a) ? a.join(", ") : "";
const csvToArr = (s) => (s || "").split(",").map(x => x.trim()).filter(Boolean);

export default function PackageForm() {
  const { id }   = useParams();
  const router = useRouter();
  const isEdit   = Boolean(id) && id !== "new";

  const [data, setData]   = useState(blank());
  // gallery: array of ImagePicker values { url, file, _preview, alt, title }
  const [gallery, setGallery] = useState([]);
  const [saving, setSaving]   = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit);

  const set = (k, v) => setData(p => ({ ...p, [k]: v }));

  /* ── Load for edit (no get-by-id endpoint → list + find) ── */
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        setPageLoading(true);
        const r = await getPackages({ limit: 500 });
        if (cancelled) return;
        const arr = Array.isArray(r?.data?.data) ? r.data.data : [];
        const p = arr.find(x => x.id === id || String(x.id) === String(id));
        if (!p) { toast.error("Package not found"); setPageLoading(false); return; }
        setData({
          title:           p.title           || "",
          slug:            p.slug            || "",
          location:        p.location        || "",
          duration:        p.duration        || "",
          allDestinations: p.allDestinations || "",
          destinations:    Array.isArray(p.destinations) ? p.destinations : [],
          price:           p.price          ?? "",
          originalPrice:   p.originalPrice  ?? "",
          discountPercent: p.discountPercent ?? "",
          currency:        p.currency        || "INR",
          badge:           Array.isArray(p.badge) ? p.badge : [],
          packageType:     p.packageType     || "",
          tourCategory:    p.tourCategory    || "",
          difficulty:      p.difficulty      || "",
          rating:          p.rating         ?? "",
          reviewCount:     p.reviewCount    ?? "",
          imageUrls:       Array.isArray(p.imageUrls) ? p.imageUrls : [],
          itinerary:       Array.isArray(p.itinerary)
                             ? p.itinerary.map(it => ({ day: it?.day ?? "", title: it?.title || "", description: it?.description || "" }))
                             : [],
          inclusions:      Array.isArray(p.inclusions) ? p.inclusions : [],
          exclusions:      Array.isArray(p.exclusions) ? p.exclusions : [],
          tags:            Array.isArray(p.tags) ? p.tags : [],
          mealsIncluded:    Boolean(p.mealsIncluded),
          hotelIncluded:    p.hotelIncluded    !== false,
          transferIncluded: p.transferIncluded !== false,
          externalUrl:     p.externalUrl     || "",
          externalId:      p.externalId      || "",
          isPublished:     Boolean(p.isPublished),
          isFeatured:      Boolean(p.isFeatured),
          isSpecialOffer:  Boolean(p.isSpecialOffer),
          isSpritual:      Boolean(p.isSpritual),
          order:           p.order          ?? "",
          seo: {
            metaTitle:       p.seo?.metaTitle       || "",
            metaDescription: p.seo?.metaDescription || "",
            metaKeywords:    Array.isArray(p.seo?.metaKeywords) ? p.seo.metaKeywords : [],
            canonicalUrl:    p.seo?.canonicalUrl    || "",
            index:           p.seo?.index  !== false,
            follow:          p.seo?.follow !== false,
            image:           mapImg(p.seo?.image),
            h1:              p.seo?.h1      || "",
            jsonSchema:      p.seo?.jsonSchema || {},
          },
        });
        setGallery(Array.isArray(p.images) ? p.images.map(img => mapImg(typeof img === 'string' ? { src: img } : img)) : []);
      } catch {
        if (!cancelled) toast.error("Failed to load package");
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  /* ── destinations (string list) ── */
  const setDest    = (i, v) => setData(p => { const a = [...p.destinations]; a[i] = v; return { ...p, destinations: a }; });
  const addDest    = ()     => set("destinations", [...data.destinations, ""]);
  const removeDest = (i)    => set("destinations", data.destinations.filter((_, j) => j !== i));

  /* ── itinerary ── */
  const setItin    = (i, k, v) => setData(p => { const a = [...p.itinerary]; a[i] = { ...a[i], [k]: v }; return { ...p, itinerary: a }; });
  const addItin    = ()        => set("itinerary", [...data.itinerary, { day: data.itinerary.length + 1, title: "", description: "" }]);
  const removeItin = (i)       => set("itinerary", data.itinerary.filter((_, j) => j !== i));

  /* ── imageUrls (extra url list) ── */
  const setUrl    = (i, v) => setData(p => { const a = [...p.imageUrls]; a[i] = v; return { ...p, imageUrls: a }; });
  const addUrl    = ()     => set("imageUrls", [...data.imageUrls, ""]);
  const removeUrl = (i)    => set("imageUrls", data.imageUrls.filter((_, j) => j !== i));

  /* ── gallery ── */
  const setGal    = (i, v) => setGallery(prev => prev.map((g, j) => j === i ? v : g));
  const addGal    = ()     => setGallery(prev => [...prev, { url: "", file: null, _preview: null, alt: "", title: "" }]);
  const removeGal = (i)    => setGallery(prev => prev.filter((_, j) => j !== i));

  const handleSave = async () => {
    if (!data.title?.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const payload = {
        title:           data.title.trim(),
        slug:            data.slug?.trim() || "",
        location:        data.location?.trim() || "",
        duration:        data.duration?.trim() || "",
        allDestinations: data.allDestinations?.trim() || "",
        destinations:    data.destinations.map(d => (d || "").trim()).filter(Boolean),
        price:           data.price          === "" ? null : Number(data.price),
        originalPrice:   data.originalPrice  === "" ? null : Number(data.originalPrice),
        discountPercent: data.discountPercent === "" ? null : Number(data.discountPercent),
        currency:        data.currency || "INR",
        badge:           data.badge,
        packageType:     data.packageType || "",
        tourCategory:    data.tourCategory || "",
        difficulty:      data.difficulty || "",
        rating:          data.rating       === "" ? null : Number(data.rating),
        reviewCount:     data.reviewCount  === "" ? null : Number(data.reviewCount),
        images:          gallery.filter(g => !(g.file instanceof File)).map(g => g.url).filter(Boolean),
        imageUrls:       data.imageUrls.map(u => (u || "").trim()).filter(Boolean),
        itinerary:       data.itinerary.map(it => ({
                           day:         it.day === "" ? null : Number(it.day),
                           title:       it.title || "",
                           description: it.description || "",
                         })),
        inclusions:      data.inclusions,
        exclusions:      data.exclusions,
        tags:            data.tags,
        mealsIncluded:    data.mealsIncluded,
        hotelIncluded:    data.hotelIncluded,
        transferIncluded: data.transferIncluded,
        externalUrl:     data.externalUrl?.trim() || "",
        externalId:      data.externalId?.trim() || "",
        isPublished:     data.isPublished,
        isFeatured:      data.isFeatured,
        isSpecialOffer:  data.isSpecialOffer,
        isSpritual:      data.isSpritual,
        order:           data.order === "" ? null : Number(data.order),
        seo: {
          metaTitle:       data.seo.metaTitle       || "",
          metaDescription: data.seo.metaDescription || "",
          metaKeywords:    Array.isArray(data.seo.metaKeywords) ? data.seo.metaKeywords : [],
          canonicalUrl:    data.seo.canonicalUrl    || "",
          index:           data.seo.index  !== false,
          follow:          data.seo.follow !== false,
          image:           cleanImg(data.seo.image),
          h1:              data.seo.h1      || "",
          jsonSchema:      data.seo.jsonSchema && typeof data.seo.jsonSchema === "object" ? data.seo.jsonSchema : {},
        },
      };

      const fd = new FormData();
      fd.append("data", JSON.stringify(payload));
      // gallery file uploads → backend appends every "images" file to gallery
      gallery.forEach(g => { if (g.file instanceof File) fd.append("images", g.file); });
      // seo image upload
      if (data.seo.image?.file instanceof File) fd.append("seoImage", data.seo.image.file);

      if (isEdit) await updatePackage(id, fd);
      else        await createPackage(fd);
      toast.success(`Package ${isEdit ? "updated" : "created"} successfully!`);
      router.push("/packages");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/packages")} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
          <h1 className="text-base font-bold text-gray-900">{isEdit ? "Edit Package" : "New Package"}</h1>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50">
          {saving ? "Saving…" : isEdit ? "Update" : "Create"}
        </button>
      </div>

      <div className="p-6 space-y-4 max-w-5xl mx-auto">

        {/* Basic Info */}
        <SectionCard icon="📋" title="Basic Info" defaultOpen={true}>
          <Input label="Title" required value={data.title} onChange={e => set("title", e.target.value)} placeholder="Package title" />
          <Grid2>
            <Input label="Slug" value={data.slug} onChange={e => set("slug", e.target.value)} placeholder="Leave blank to auto-generate" hint="Optional — generated from title if empty" />
            <Input label="Location" value={data.location} onChange={e => set("location", e.target.value)} placeholder="e.g. Goa, India" />
          </Grid2>
          <Grid2>
            <Input label="Duration" value={data.duration} onChange={e => set("duration", e.target.value)} placeholder="e.g. 5 Days / 4 Nights" />
            <Input label="All Destinations" value={data.allDestinations} onChange={e => set("allDestinations", e.target.value)} placeholder="e.g. Delhi, Agra, Jaipur" />
          </Grid2>
        </SectionCard>

        {/* Destinations (string list) */}
        <SectionCard icon="📍" title="Destinations (cities)" defaultOpen={false}>
          {data.destinations.map((d, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <input value={d} onChange={e => setDest(i, e.target.value)} placeholder={`City #${i + 1}`} className="cms-input flex-1" />
              <button type="button" onClick={() => removeDest(i)} className="text-red-400 hover:text-red-600 text-sm font-bold px-2 py-1 rounded-lg hover:bg-red-50">✕</button>
            </div>
          ))}
          <button type="button" onClick={addDest} className="text-sm text-indigo-600 font-semibold hover:underline">+ Add destination</button>
        </SectionCard>

        {/* Pricing */}
        <SectionCard icon="💰" title="Pricing" defaultOpen={false}>
          <Grid2>
            <Input label="Price" type="number" value={data.price} onChange={e => set("price", e.target.value)} placeholder="0" />
            <Input label="Original Price" type="number" value={data.originalPrice} onChange={e => set("originalPrice", e.target.value)} placeholder="0" />
          </Grid2>
          <Grid2>
            <Input label="Discount %" type="number" value={data.discountPercent} onChange={e => set("discountPercent", e.target.value)} placeholder="0" />
            <Input label="Currency" value={data.currency} onChange={e => set("currency", e.target.value)} placeholder="INR" />
          </Grid2>
        </SectionCard>

        {/* Classification */}
        <SectionCard icon="🏷️" title="Classification" defaultOpen={false}>
          <Input label="Badges (comma-separated)" value={arrToCsv(data.badge)} onChange={e => set("badge", csvToArr(e.target.value))} placeholder="Bestseller, New" />
          <Grid2>
            <Input label="Package Type" value={data.packageType} onChange={e => set("packageType", e.target.value)} placeholder="e.g. Honeymoon" />
            <Input label="Tour Category" value={data.tourCategory} onChange={e => set("tourCategory", e.target.value)} placeholder="e.g. Beach" />
          </Grid2>
          <Grid2>
            <Input label="Difficulty" value={data.difficulty} onChange={e => set("difficulty", e.target.value)} placeholder="e.g. Easy" />
            <Input label="Order" type="number" value={data.order} onChange={e => set("order", e.target.value)} placeholder="0" />
          </Grid2>
          <Grid2>
            <Input label="Rating (0–5)" type="number" value={data.rating} onChange={e => set("rating", e.target.value)} placeholder="4.5" />
            <Input label="Review Count" type="number" value={data.reviewCount} onChange={e => set("reviewCount", e.target.value)} placeholder="0" />
          </Grid2>
        </SectionCard>

        {/* Gallery Images */}
        <SectionCard icon="🖼️" title="Gallery Images" defaultOpen={false}>
          {gallery.map((g, i) => (
            <div key={i} className="mb-4 border border-gray-200 rounded-xl p-3 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600">Image #{i + 1}</span>
                <button type="button" onClick={() => removeGal(i)} className="text-red-400 hover:text-red-600 text-sm font-bold px-2 py-1 rounded-lg hover:bg-red-50">✕ Remove</button>
              </div>
              <ImagePicker value={g} onChange={v => setGal(i, v)} fieldName="images" uploadEndpoint="api/upload/image" />
            </div>
          ))}
          <button type="button" onClick={addGal} className="text-sm text-indigo-600 font-semibold hover:underline">+ Add image</button>
        </SectionCard>

        {/* Extra image URLs */}
        <SectionCard icon="🔗" title="Extra Image URLs" defaultOpen={false}>
          {data.imageUrls.map((u, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <input value={u} onChange={e => setUrl(i, e.target.value)} placeholder="https://example.com/image.jpg" className="cms-input flex-1" />
              <button type="button" onClick={() => removeUrl(i)} className="text-red-400 hover:text-red-600 text-sm font-bold px-2 py-1 rounded-lg hover:bg-red-50">✕</button>
            </div>
          ))}
          <button type="button" onClick={addUrl} className="text-sm text-indigo-600 font-semibold hover:underline">+ Add URL</button>
        </SectionCard>

        {/* Itinerary */}
        <SectionCard icon="🗓️" title="Itinerary" defaultOpen={false}>
          {data.itinerary.map((it, i) => (
            <div key={i} className="mb-4 border border-gray-200 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600">Item #{i + 1}</span>
                <button type="button" onClick={() => removeItin(i)} className="text-red-400 hover:text-red-600 text-sm font-bold px-2 py-1 rounded-lg hover:bg-red-50">✕</button>
              </div>
              <Grid2>
                <Input label="Day" type="number" value={it.day} onChange={e => setItin(i, "day", e.target.value)} placeholder="1" />
                <Input label="Title" value={it.title} onChange={e => setItin(i, "title", e.target.value)} placeholder="Arrival" />
              </Grid2>
              <Textarea label="Description" rows={3} value={it.description} onChange={e => setItin(i, "description", e.target.value)} placeholder="What happens on this day..." />
            </div>
          ))}
          <button type="button" onClick={addItin} className="text-sm text-indigo-600 font-semibold hover:underline">+ Add itinerary item</button>
        </SectionCard>

        {/* Inclusions / Exclusions / Tags */}
        <SectionCard icon="✅" title="Inclusions / Exclusions / Tags" defaultOpen={false}>
          <Textarea label="Inclusions (comma-separated)" rows={2} value={arrToCsv(data.inclusions)} onChange={e => set("inclusions", csvToArr(e.target.value))} placeholder="Breakfast, Airport transfer" />
          <Textarea label="Exclusions (comma-separated)" rows={2} value={arrToCsv(data.exclusions)} onChange={e => set("exclusions", csvToArr(e.target.value))} placeholder="Airfare, Personal expenses" />
          <Textarea label="Tags (comma-separated)" rows={2} value={arrToCsv(data.tags)} onChange={e => set("tags", csvToArr(e.target.value))} placeholder="beach, family, budget" />
        </SectionCard>

        {/* What's Included toggles */}
        <SectionCard icon="🎒" title="What's Included" defaultOpen={false}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Toggle label="Meals Included" checked={data.mealsIncluded} onChange={v => set("mealsIncluded", v)} />
            <Toggle label="Hotel Included" checked={data.hotelIncluded} onChange={v => set("hotelIncluded", v)} />
            <Toggle label="Transfer Included" checked={data.transferIncluded} onChange={v => set("transferIncluded", v)} />
          </div>
        </SectionCard>

        {/* External */}
        <SectionCard icon="🌐" title="External Booking" defaultOpen={false}>
          <Grid2>
            <Input label="External URL" value={data.externalUrl} onChange={e => set("externalUrl", e.target.value)} placeholder="https://partner.com/book" />
            <Input label="External ID" value={data.externalId} onChange={e => set("externalId", e.target.value)} placeholder="PKG-123" />
          </Grid2>
        </SectionCard>

        {/* Visibility */}
        <SectionCard icon="👁️" title="Visibility" defaultOpen={false}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Toggle label="Published" checked={data.isPublished} onChange={v => set("isPublished", v)} />
            <Toggle label="Featured" checked={data.isFeatured} onChange={v => set("isFeatured", v)} />
            <Toggle label="Special Offer" checked={data.isSpecialOffer} onChange={v => set("isSpecialOffer", v)} />
            <Toggle label="Spiritual" checked={data.isSpritual} onChange={v => set("isSpritual", v)} />
          </div>
        </SectionCard>

        {/* SEO */}
        <SectionCard icon="🔍" title="SEO Settings" defaultOpen={false}>
          <SeoSection
            data={data.seo}
            onChange={v => set("seo", { ...data.seo, ...v })}
            siteUrl="https://www.TravelBudgetly.com/packages"
          />
        </SectionCard>

      </div>
    </div>
  );
}