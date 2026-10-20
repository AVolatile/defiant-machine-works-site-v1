'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { cartSchema, type BuildConfiguration, type CartItem } from '@/lib/commerce/schema';
import { isMerchandise } from '@/lib/commerce/eligibility';
import { currentCatalogVersion } from '@/data/catalog-version';
import {
  cartEnvelopeSchema,
  cartStorageKey,
  legacyCartStorageKey,
  emptyCart,
  type CartEnvelope,
} from '@/lib/commerce/cart-envelope';
const initial = { ...emptyCart(), ready: false, message: '' };
let snapshot = initial,
  loadVersion = 0;
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((fn) => fn());
}
function persist() {
  const { schemaVersion, catalogVersion, items, needsReview, acceptedSubtotalCents } = snapshot;
  localStorage.setItem(
    cartStorageKey,
    JSON.stringify({ schemaVersion, catalogVersion, items, needsReview, acceptedSubtotalCents }),
  );
}
function publish(items: CartItem[], message: string, update: Partial<CartEnvelope> = {}) {
  snapshot = { ...snapshot, items, ready: true, message, acceptedSubtotalCents: null, ...update };
  try {
    persist();
  } catch {
    snapshot = {
      ...snapshot,
      message: message + ' Browser storage is unavailable; this cart will not survive a refresh.',
    };
  }
  emit();
}
async function load() {
  const token = ++loadVersion;
  try {
    const stored = localStorage.getItem(cartStorageKey),
      legacy = localStorage.getItem(legacyCartStorageKey);
    let envelope = emptyCart(),
      message = '';
    if (stored) {
      const parsed = cartEnvelopeSchema.safeParse(JSON.parse(stored));
      if (parsed.success) {
        envelope = parsed.data;
        if (envelope.catalogVersion !== currentCatalogVersion) {
          envelope.needsReview = true;
          message =
            'Some build details changed. Review your build and current prices before checkout.';
        }
      } else
        message = 'An outdated or damaged cart was retired. Please configure your items again.';
    } else if (legacy) {
      const { migrateLegacyCart } = await import('@/lib/commerce/cart-migration');
      const migrated = migrateLegacyCart(JSON.parse(legacy));
      envelope = migrated.envelope;
      message = migrated.message;
    }
    if (token !== loadVersion) return;
    snapshot = { ...envelope, ready: true, message };
    if (legacy && !stored) {
      persist();
      localStorage.removeItem(legacyCartStorageKey);
    }
    emit();
  } catch {
    if (token !== loadVersion) return;
    snapshot = {
      ...initial,
      ready: true,
      message: 'Saved cart storage could not be read. You can configure a new cart in this tab.',
    };
    emit();
  }
}
export function CommerceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void load();
    const changed = (event: StorageEvent) => {
      if (event.key === cartStorageKey || event.key === legacyCartStorageKey) void load();
    };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);
  return <>{children}</>;
}
export function useCart() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => snapshot,
    () => initial,
  );
}
export const cartActions = {
  saveBuild(build: BuildConfiguration) {
    const parsed = cartSchema.safeParse([
      ...snapshot.items.filter((i) => i.id !== build.id),
      { id: build.id, kind: 'build', build },
    ]);
    if (!parsed.success)
      throw Error('Your cart is full or the build is incomplete. Remove an item and try again.');
    publish(parsed.data, 'Build saved to your cart.');
  },
  addProduct(productId: string, quantity = 1) {
    if (!isMerchandise(productId)) throw Error('This item requires a direct inquiry.');
    const existing = snapshot.items.find((i) => i.kind === 'product' && i.productId === productId);
    const items = existing
      ? snapshot.items.map((i) =>
          i.id === existing.id && i.kind === 'product'
            ? { ...i, quantity: Math.min(20, i.quantity + quantity) }
            : i,
        )
      : [
          ...snapshot.items,
          { kind: 'product' as const, id: crypto.randomUUID(), productId, quantity },
        ];
    const parsed = cartSchema.safeParse(items);
    if (!parsed.success) throw Error('Your cart is full. Remove an item before adding another.');
    publish(parsed.data, 'Product added to your cart.');
  },
  remove(id: string) {
    publish(
      snapshot.items.filter((i) => i.id !== id),
      'Item removed from your cart.',
    );
  },
  duplicate(id: string) {
    const item = snapshot.items.find((i) => i.id === id);
    if (!item || item.kind !== 'build') return;
    const newId = crypto.randomUUID();
    const duplicated = {
      ...item,
      id: newId,
      build: { ...item.build, id: newId, createdAt: new Date().toISOString() },
    };
    const parsed = cartSchema.safeParse([...snapshot.items, duplicated]);
    if (!parsed.success) throw Error('Your cart is full.');
    publish(parsed.data, 'Build duplicated.');
  },
  quantity(id: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return;
    publish(
      snapshot.items.map((i) => (i.id === id && i.kind === 'product' ? { ...i, quantity } : i)),
      'Quantity updated.',
    );
  },
  reviewPrices(total: number) {
    publish(snapshot.items, 'Current build details and subtotal reviewed.', {
      needsReview: false,
      catalogVersion: currentCatalogVersion,
      acceptedSubtotalCents: total,
    });
  },
  purchased(ids: string[]) {
    publish(
      snapshot.items.filter((i) => !ids.includes(i.id)),
      'Test order saved. Purchased items were removed from this cart.',
    );
  },
};
