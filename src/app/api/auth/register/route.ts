import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { checkOrigin, jsonError } from '@/lib/server/response';
import { createSession, attachSessionCookie, hashPassword } from '@/lib/server/auth';
import { eq } from 'drizzle-orm';
import { DEFAULT_REGION, REGIONS } from '@/lib/constants/access-control';
import type { Region, UserRole } from '@/lib/constants/access-control';

export async function POST(request: NextRequest) {
  try {
    const originBlock = checkOrigin(request);
    if (originBlock) return originBlock;

    const body = await request.json();
    const {
      name,
      email,
      password,
      avatarUrl,
      region,
    }: {
      name?: string;
      email?: string;
      password?: string;
      avatarUrl?: string;
      region?: string;
    } = body ?? {};

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'name is required', code: 'MISSING_NAME' }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'email is required', code: 'MISSING_EMAIL' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'email format is invalid', code: 'INVALID_EMAIL' }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'password must be at least 8 characters', code: 'INVALID_PASSWORD' },
        { status: 400 }
      );
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'email already registered', code: 'EMAIL_IN_USE' },
        { status: 409 }
      );
    }

    const regionValue = (region ?? DEFAULT_REGION).trim();
    if (!REGIONS.includes(regionValue as Region)) {
      return NextResponse.json({ error: 'region is invalid', code: 'INVALID_REGION' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();

    const [newUser] = await db
      .insert(users)
      .values({
        name: name.trim(),
        role: 'user' as UserRole,
        region: regionValue as Region,
        email: normalizedEmail,
        passwordHash,
        avatarUrl: avatarUrl ?? null,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      })
      .returning();

    const session = await createSession(newUser.id);

    const response = NextResponse.json(
      {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          avatarUrl: newUser.avatarUrl,
          role: newUser.role as UserRole,
          region: newUser.region as Region,
        },
      },
      { status: 201 }
    );

    attachSessionCookie(response, session.token, session.expiresAt);

    return response;
  } catch (error) {
    console.error('POST /api/auth/register error:', error);
    return jsonError(request, error, 500);
  }
}
