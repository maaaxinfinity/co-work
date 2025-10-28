import { NextRequest, NextResponse } from 'next/server';
import { checkOrigin, jsonError } from '@/lib/server/response';
import { clearSessionCookie, getSessionTokenFromRequest, revokeSessionByToken } from '@/lib/server/auth';

export async function POST(request: NextRequest) {
  try {
    const originBlock = checkOrigin(request);
    if (originBlock) return originBlock;

    const token = getSessionTokenFromRequest(request);
    if (token) {
      await revokeSessionByToken(token);
    }

    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error('POST /api/auth/logout error:', error);
    return jsonError(request, error, 500);
  }
}
