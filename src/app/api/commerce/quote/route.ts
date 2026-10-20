import { NextRequest } from 'next/server';
import { cartSchema } from '@/lib/commerce/schema';
import { quoteCart } from '@/lib/commerce/pricing';
import { developmentCheckoutEnabled } from '@/lib/commerce/payment';
import { catalogVersion } from '@/lib/commerce/catalog';
import {
  attachSession,
  getSession,
  limitedJson,
  privateResponse,
  trustedOrigin,
} from '@/lib/commerce/http';
export async function POST(request: NextRequest) {
  if (!trustedOrigin(request))
    return privateResponse({ error: 'Please use the checkout on this website.' }, 403);
  try {
    const payload = await limitedJson(request);
    const result = cartSchema.safeParse(payload?.items);
    if (!result.success)
      return privateResponse(
        { error: 'Your cart contains incomplete or invalid selections.' },
        422,
      );
    if (payload.catalogVersion !== catalogVersion)
      return privateResponse(
        {
          error: 'Some build details changed. Review your build before checkout.',
          catalogVersion,
          quote: quoteCart(result.data),
        },
        409,
      );
    return attachSession(
      privateResponse({
        quote: quoteCart(result.data),
        mode: developmentCheckoutEnabled() ? 'test' : 'unavailable',
      }),
      request,
      getSession(request),
    );
  } catch {
    return privateResponse(
      { error: 'We could not read your cart. Please review it and try again.' },
      400,
    );
  }
}
