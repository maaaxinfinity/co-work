import { NextResponse } from 'next/server';

// Server-side helpers for API routes: error shaping and basic origin checks

export function jsonError(request: Request, error: unknown, status = 500) {
  const isProd = process.env.NODE_ENV === 'production';
  const requestId = safeRequestId(request);

  const message = isProd
    ? 'An unexpected error occurred'
    : (error instanceof Error ? error.message : String(error));

  return NextResponse.json(
    {
      error: message,
      code: status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : 'INTERNAL_ERROR',
      requestId,
    },
    { status }
  );
}

export function safeRequestId(request: Request): string {
  const fromHeader = request.headers.get('x-request-id');
  if (fromHeader && fromHeader.length <= 128) return fromHeader;
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

// Basic CSRF/Origin allowlist for mutating requests. Returns a NextResponse if blocked, else null.
export function checkOrigin(request: Request): NextResponse | null {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return null;

  const origin = request.headers.get('origin');
  const allowed = process.env.NEXT_PUBLIC_APP_URL;

  // If no configured allowlist or Origin header missing (e.g., curl), allow by default in dev.
  if (!allowed || !origin) {
    return process.env.NODE_ENV === 'production'
      ? NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
      : null;
  }

  try {
    const allowedUrl = new URL(allowed);
    const originUrl = new URL(origin);
    if (originUrl.protocol === allowedUrl.protocol && originUrl.host === allowedUrl.host) {
      return null;
    }
  } catch {
    // If configuration is malformed, fail closed on production.
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }
    return null;
  }

  return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
}
