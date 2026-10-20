import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
export const sessionCookie = 'dmw_order_session';
export function trustedOrigin(request: NextRequest) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = request.headers.get('origin');
  if (!origin) return request.headers.get('content-type')?.split(';')[0] === 'application/json';
  try {
    return new URL(origin).host === request.headers.get('host');
  } catch {
    return false;
  }
}
export async function limitedJson(request: NextRequest) {
  const reader = request.body?.getReader();
  if (!reader) throw Error('A request body is required.');
  const decoder = new TextDecoder();
  let size = 0,
    text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 64000) {
      await reader.cancel();
      throw Error('This request is too large. Remove some cart items and try again.');
    }
    text += decoder.decode(value, { stream: true });
  }
  return JSON.parse(text + decoder.decode());
}
export function privateResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}
export function getSession(request: NextRequest) {
  const existing = request.cookies.get(sessionCookie)?.value;
  return existing && /^[a-f0-9]{64}$/.test(existing) ? existing : randomBytes(32).toString('hex');
}
export function attachSession(response: NextResponse, request: NextRequest, session: string) {
  response.cookies.set(sessionCookie, session, {
    httpOnly: true,
    sameSite: 'lax',
    secure:
      request.headers.get('x-forwarded-proto') === 'https' || request.nextUrl.protocol === 'https:',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return response;
}
const attempts = new Map<string, { count: number; expires: number }>();
export function allowAttempt(session: string) {
  const now = Date.now();
  for (const [key, v] of attempts) if (v.expires < now) attempts.delete(key);
  if (attempts.size > 10000) return false;
  const entry = attempts.get(session) || { count: 0, expires: now + 60000 };
  entry.count++;
  attempts.set(session, entry);
  return entry.count <= 30;
}
