import { DatabaseSync } from 'node:sqlite';
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { OrderSnapshot } from './schema';
import { developmentCheckoutEnabled } from './payment';
export interface OrderRepository {
  getByNumber(number: string, sessionHash: string): OrderSnapshot | null;
  findRequest(
    sessionHash: string,
    key: string,
  ): { snapshot: OrderSnapshot; requestHash: string } | null;
  reserve(
    snapshot: OrderSnapshot,
    sessionHash: string,
    key: string,
    requestHash: string,
  ): OrderSnapshot;
  save(snapshot: OrderSnapshot, event: string): void;
  claimPayment(orderNumber: string): boolean;
}
function encryptionKey() {
  const configured = process.env.ORDER_ENCRYPTION_KEY;
  if (configured) {
    if (!/^[a-fA-F0-9]{64}$/.test(configured))
      throw Error('ORDER_ENCRYPTION_KEY must contain 64 hexadecimal characters.');
    return Buffer.from(configured, 'hex');
  }
  if (process.env.COMMERCE_MODE !== 'test') throw Error('Order encryption must be configured.');
  const dir = path.resolve('.data');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const keyPath = path.join(dir, 'development-order.key');
  try {
    writeFileSync(keyPath, randomBytes(32), { flag: 'wx', mode: 0o600 });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
  }
  return readFileSync(/* turbopackIgnore: true */ keyPath);
}
function encode(snapshot: OrderSnapshot) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), nonce);
  cipher.setAAD(Buffer.from(snapshot.orderNumber));
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(snapshot), 'utf8'),
    cipher.final(),
  ]);
  return Buffer.concat([nonce, cipher.getAuthTag(), encrypted]);
}
function decode(number: string, blob: Uint8Array) {
  const bytes = Buffer.from(blob);
  const cipher = createDecipheriv('aes-256-gcm', encryptionKey(), bytes.subarray(0, 12));
  cipher.setAuthTag(bytes.subarray(12, 28));
  cipher.setAAD(Buffer.from(number));
  return JSON.parse(
    Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString(),
  ) as OrderSnapshot;
}
class SQLiteOrderRepository implements OrderRepository {
  private db: DatabaseSync;
  constructor() {
    if (!developmentCheckoutEnabled())
      throw Error('The local order repository is available in test mode only.');
    const file = path.resolve(
      /* turbopackIgnore: true */ process.env.ORDER_DATABASE_PATH || '.data/orders.sqlite',
    );
    mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(file);
    chmodSync(file, 0o600);
    this.db.exec(
      `PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS orders (order_number TEXT PRIMARY KEY, session_hash TEXT NOT NULL, idempotency_key TEXT NOT NULL, request_hash TEXT NOT NULL, snapshot BLOB NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(session_hash,idempotency_key)); CREATE TABLE IF NOT EXISTS order_events (id INTEGER PRIMARY KEY, order_number TEXT NOT NULL, type TEXT NOT NULL, created_at TEXT NOT NULL);`,
    );
  }
  getByNumber(number: string, sessionHash: string) {
    const row = this.db
      .prepare('SELECT snapshot FROM orders WHERE order_number = ? AND session_hash = ?')
      .get(number, sessionHash) as { snapshot: Uint8Array } | undefined;
    return row ? decode(number, row.snapshot) : null;
  }
  findRequest(sessionHash: string, key: string) {
    const row = this.db
      .prepare(
        'SELECT order_number,request_hash,snapshot FROM orders WHERE session_hash=? AND idempotency_key=?',
      )
      .get(sessionHash, key) as
      { order_number: string; request_hash: string; snapshot: Uint8Array } | undefined;
    return row
      ? { snapshot: decode(row.order_number, row.snapshot), requestHash: row.request_hash }
      : null;
  }
  reserve(snapshot: OrderSnapshot, sessionHash: string, key: string, requestHash: string) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const existing = this.findRequest(sessionHash, key);
      if (existing) {
        if (existing.requestHash !== requestHash)
          throw Error('This checkout request has changed. Review the cart and try again.');
        this.db.exec('COMMIT');
        return existing.snapshot;
      }
      this.db
        .prepare('INSERT INTO orders VALUES(?,?,?,?,?,?,?)')
        .run(
          snapshot.orderNumber,
          sessionHash,
          key,
          requestHash,
          encode(snapshot),
          snapshot.status,
          snapshot.createdAt,
        );
      this.db
        .prepare('INSERT INTO order_events(order_number,type,created_at) VALUES(?,?,?)')
        .run(snapshot.orderNumber, 'ORDER_CREATED', snapshot.createdAt);
      this.db.exec('COMMIT');
      return snapshot;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }
  save(snapshot: OrderSnapshot, event: string) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const updated = this.db
        .prepare('UPDATE orders SET snapshot=?,status=? WHERE order_number=?')
        .run(encode(snapshot), snapshot.status, snapshot.orderNumber);
      if (updated.changes !== 1) throw Error('The order record could not be found.');
      this.db
        .prepare('INSERT INTO order_events(order_number,type,created_at) VALUES(?,?,?)')
        .run(snapshot.orderNumber, event, new Date().toISOString());
      this.db.exec('COMMIT');
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }
  claimPayment(orderNumber: string) {
    const result = this.db
      .prepare(
        "UPDATE orders SET status='PAYMENT_PROCESSING' WHERE order_number=? AND status IN ('PENDING_PAYMENT','PAYMENT_FAILED')",
      )
      .run(orderNumber);
    return result.changes === 1;
  }
}
let repository: OrderRepository | undefined;
export function orderRepository() {
  return (repository ??= new SQLiteOrderRepository());
}
export function sessionHash(value: string) {
  return createHash('sha256').update(value).digest('hex');
}
