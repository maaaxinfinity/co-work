import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { checkOrigin, jsonError } from '@/lib/server/response';
import {
  attachSessionCookie,
  createSession,
  getSessionTokenFromRequest,
  revokeSessionByToken,
  updateUserLoginMetadata,
  verifyPassword,
} from '@/lib/server/auth';
import { eq } from 'drizzle-orm';
import type { Region, UserRole } from '@/lib/constants/access-control';

export async function POST(request: NextRequest) {
  try {
    const originBlock = checkOrigin(request);
    if (originBlock) return originBlock;

    const body = await request.json();
    const { email, password }: { email?: string; password?: string } = body ?? {};

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'email is required', code: 'MISSING_EMAIL' }, { status: 400 });
    }

    if (!password || password.length < 1) {
      return NextResponse.json({ error: 'password is required', code: 'MISSING_PASSWORD' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const found = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (found.length === 0) {
      return NextResponse.json({ error: 'invalid credentials', code: 'INVALID_CREDENTIALS' }, { status: 401 });
    }

    const user = found[0];
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'invalid credentials', code: 'INVALID_CREDENTIALS' }, { status: 401 });
    }

    const existingToken = getSessionTokenFromRequest(request);
    if (existingToken) {
      await revokeSessionByToken(existingToken);
    }

    const session = await createSession(user.id);
    await updateUserLoginMetadata(user.id);

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          role: user.role as UserRole,
          region: user.region as Region,
        },
      },
      { status: 200 }
    );

    attachSessionCookie(response, session.token, session.expiresAt);

    return response;
  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return jsonError(request, error, 500);
  }
}
