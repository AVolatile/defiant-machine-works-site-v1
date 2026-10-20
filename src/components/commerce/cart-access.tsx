'use client';
import Link from 'next/link';
import { Icon } from '@/components/ui/icon';
import { useCart } from './cart-store';
export function CartAccess({ close }: { close?: () => void }) {
  const { items } = useCart();
  const count = items.reduce((n, i) => n + (i.kind === 'product' ? i.quantity : 1), 0);
  return (
    <Link
      href="/cart"
      onClick={close}
      className="cart-access"
      aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
    >
      <Icon name="bag" />
      <span className="cart-label">Cart</span>
      <span className="cart-count">{count}</span>
    </Link>
  );
}
