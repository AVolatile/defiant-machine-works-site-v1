import { NextRequest, NextResponse } from 'next/server';
import { buildSchema, contactSchema } from '@/lib/validation';
const requests = new Map<string, { count: number; until: number }>();
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  let validOrigin = true;
  try {
    if (origin) validOrigin = new URL(origin).host === request.headers.get('host');
  } catch {
    validOrigin = false;
  }
  if (!validOrigin)
    return NextResponse.json(
      { error: 'Please submit this form from the Defiant website.' },
      { status: 403 },
    );
  if (Number(request.headers.get('content-length') || 0) > 20000)
    return NextResponse.json(
      { error: 'Your message is too large. Please shorten it and try again.' },
      { status: 413 },
    );
  let data;
  try {
    const text = await request.text();
    if (text.length > 20000) throw new Error();
    data = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: 'We could not read your request. Please try again.' },
      { status: 400 },
    );
  }
  if (data.website)
    return NextResponse.json(
      { error: 'Your request could not be accepted. Please contact us by email.' },
      { status: 400 },
    );
  const parsed =
    data.kind === 'build' ? buildSchema.safeParse(data) : contactSchema.safeParse(data);
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Please check the highlighted fields.', fields: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const now = Date.now();
  for (const [k, v] of requests) if (v.until < now) requests.delete(k);
  if (requests.size > 10000)
    return NextResponse.json(
      {
        error:
          'We are receiving a high volume of inquiries. Please email sales@defiantmachineworks.com.',
      },
      { status: 503 },
    );
  const entry = requests.get(key) || { count: 0, until: now + 60000 };
  entry.count++;
  requests.set(key, entry);
  if (entry.count > 5)
    return NextResponse.json(
      { error: 'Please wait one minute before sending another inquiry.' },
      { status: 429 },
    );
  if (data.kind === 'build' && data.preferred === 'Phone' && !data.phone)
    return NextResponse.json(
      {
        error: 'Enter a phone number so we can call you.',
        fields: { phone: ['Enter a phone number so we can call you.'] },
      },
      { status: 422 },
    );
  const endpoint = process.env.FORM_ENDPOINT;
  if (!endpoint || !endpoint.startsWith('https://'))
    return NextResponse.json(
      {
        error:
          'Online delivery is not available yet. Your inquiry has not been sent. Email sales@defiantmachineworks.com or call 931-266-2422.',
      },
      { status: 503 },
    );
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.FORM_ENDPOINT_TOKEN
          ? { Authorization: `Bearer ${process.env.FORM_ENDPOINT_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ kind: data.kind === 'build' ? 'build' : 'contact', ...parsed.data }),
      signal: AbortSignal.timeout(12000),
      redirect: 'error',
    });
    if (!response.ok) throw new Error();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      {
        error:
          'We could not deliver your inquiry. Your information is still here. Please try again or email sales@defiantmachineworks.com.',
      },
      { status: 502 },
    );
  }
}
