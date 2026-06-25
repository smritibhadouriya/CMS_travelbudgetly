'use client';
// src/screens/PagesContent/ViewPackage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@/lib/nav';
import { toast } from 'react-toastify';
import { getPackages } from '../../service/api';

const imgSrc = (img) => {
  if (!img) return "";
  if (typeof img === 'string') return img;
  return img.src || img.url || "";
};

const Row = ({ label, value }) => (
  <div className="flex gap-3 py-1.5 border-b border-gray-50 last:border-0">
    <span className="text-xs font-semibold text-gray-400 uppercase w-40 flex-shrink-0">{label}</span>
    <span className="text-sm text-gray-800 break-words">{value ?? <span className="text-gray-300">—</span>}</span>
  </div>
);

const Card = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
      <span className="text-sm font-bold text-gray-800">{title}</span>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Badge = ({ children, color = "bg-gray-100 text-gray-600" }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>{children}</span>
);

const Chips = ({ items }) =>
  Array.isArray(items) && items.length
    ? <div className="flex flex-wrap gap-1.5">{items.map((t, i) => <Badge key={i} color="bg-indigo-50 text-indigo-700">{t}</Badge>)}</div>
    : <span className="text-gray-300 text-sm">—</span>;

export default function ViewPackage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [pkg,     setPkg]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const r = await getPackages({ limit: 500 });
        if (cancelled) return;
        const arr = Array.isArray(r?.data?.data) ? r.data.data : [];
        const found = arr.find(x => x.id === id || String(x.id) === String(id));
        if (!found) { toast.error("Package not found"); }
        setPkg(found || null);
      } catch {
        if (!cancelled) toast.error("Failed to load package");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <p className="text-gray-500 text-sm">Package not found.</p>
        <button onClick={() => navigate("/packages")} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold">← Back to list</button>
      </div>
    );
  }

  const gallery = [
    ...(Array.isArray(pkg.images) ? pkg.images : []),
    ...(Array.isArray(pkg.imageUrls) ? pkg.imageUrls : []),
  ].map(imgSrc).filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/packages")} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
          <h1 className="text-base font-bold text-gray-900 truncate max-w-md">{pkg.title}</h1>
        </div>
        <button onClick={() => navigate(`/packages/edit/${pkg.id}`)}
          className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">
          Edit
        </button>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-4">

        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          <Badge color={pkg.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
            {pkg.isPublished ? "Published" : "Draft"}
          </Badge>
          {pkg.isFeatured && <Badge color="bg-violet-100 text-violet-700">Featured</Badge>}
          {pkg.isSpecialOffer && <Badge color="bg-rose-100 text-rose-700">Special Offer</Badge>}
          {pkg.isSpritual && <Badge color="bg-sky-100 text-sky-700">Spiritual</Badge>}
        </div>

        {/* Gallery */}
        {gallery.length > 0 && (
          <Card title="Gallery">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {gallery.map((src, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={src} alt={`${pkg.title} ${i + 1}`} className="w-full h-full object-cover"
                    onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Basic */}
        <Card title="Basic Info">
          <Row label="Title" value={pkg.title} />
          <Row label="Slug" value={pkg.slug} />
          <Row label="Location" value={pkg.location} />
          <Row label="Duration" value={pkg.duration} />
          <Row label="All Destinations" value={pkg.allDestinations} />
          <Row label="Destinations" value={<Chips items={pkg.destinations} />} />
        </Card>

        {/* Pricing */}
        <Card title="Pricing">
          <Row label="Price" value={pkg.price != null ? `${pkg.currency || 'INR'} ${pkg.price}` : null} />
          <Row label="Original Price" value={pkg.originalPrice != null ? `${pkg.currency || 'INR'} ${pkg.originalPrice}` : null} />
          <Row label="Discount %" value={pkg.discountPercent != null ? `${pkg.discountPercent}%` : null} />
          <Row label="Currency" value={pkg.currency} />
        </Card>

        {/* Classification */}
        <Card title="Classification">
          <Row label="Badges" value={<Chips items={pkg.badge} />} />
          <Row label="Package Type" value={pkg.packageType} />
          <Row label="Tour Category" value={pkg.tourCategory} />
          <Row label="Difficulty" value={pkg.difficulty} />
          <Row label="Rating" value={pkg.rating != null ? `${pkg.rating} / 5` : null} />
          <Row label="Review Count" value={pkg.reviewCount} />
          <Row label="Order" value={pkg.order} />
        </Card>

        {/* Itinerary */}
        <Card title="Itinerary">
          {Array.isArray(pkg.itinerary) && pkg.itinerary.length ? (
            <div className="space-y-3">
              {pkg.itinerary.map((it, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {it?.day != null && <span className="text-indigo-600 mr-2">Day {it.day}</span>}
                    {it?.title || `Item ${i + 1}`}
                  </p>
                  {it?.description && <p className="text-sm text-gray-600 mt-1">{it.description}</p>}
                </div>
              ))}
            </div>
          ) : <span className="text-gray-300 text-sm">—</span>}
        </Card>

        {/* Inclusions / Exclusions / Tags */}
        <Card title="Inclusions / Exclusions / Tags">
          <Row label="Inclusions" value={<Chips items={pkg.inclusions} />} />
          <Row label="Exclusions" value={<Chips items={pkg.exclusions} />} />
          <Row label="Tags" value={<Chips items={pkg.tags} />} />
        </Card>

        {/* What's Included */}
        <Card title="What's Included">
          <Row label="Meals Included" value={pkg.mealsIncluded ? "Yes" : "No"} />
          <Row label="Hotel Included" value={pkg.hotelIncluded !== false ? "Yes" : "No"} />
          <Row label="Transfer Included" value={pkg.transferIncluded !== false ? "Yes" : "No"} />
        </Card>

        {/* External */}
        <Card title="External Booking">
          <Row label="External URL" value={pkg.externalUrl
            ? <a href={pkg.externalUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{pkg.externalUrl}</a>
            : null} />
          <Row label="External ID" value={pkg.externalId} />
        </Card>

        {/* SEO */}
        <Card title="SEO">
          <Row label="Meta Title" value={pkg.seo?.metaTitle} />
          <Row label="Meta Description" value={pkg.seo?.metaDescription} />
          <Row label="Keywords" value={<Chips items={pkg.seo?.metaKeywords} />} />
          <Row label="Canonical URL" value={pkg.seo?.canonicalUrl} />
          <Row label="Index" value={pkg.seo?.index !== false ? "Yes" : "No"} />
          <Row label="Follow" value={pkg.seo?.follow !== false ? "Yes" : "No"} />
        </Card>

      </div>
    </div>
  );
}