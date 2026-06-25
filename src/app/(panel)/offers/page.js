import OfferAdmin from '@/screens/PagesContent/OfferAdmin.jsx';
import { listOffers } from '@/lib/services/offer.service';

// Live admin list — render per request, never statically prerender / cache.
export const dynamic = 'force-dynamic';

export default async function Page() {
  // Same query the old GET /api/offers (no params) returned: where={},
  // orderBy createdAt desc, response array. Mutations stay client-side.
  const initialOffers = await listOffers({});
  return <OfferAdmin initialOffers={initialOffers} />;
}
