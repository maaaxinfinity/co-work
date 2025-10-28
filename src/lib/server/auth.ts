import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, pbkdf2 as pbkdf2Callback, timingSafeEqual as cryptoTimingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { db } from '@/db';
import { sessions, users } from '@/db/schema';
import { and, eq, gt } from 'drizzle-orm';
import type { Region, UserRole } from '@/lib/constants/access-control';

const pbkdf2 = promisify(pbkdf2Callback);

const PASSWORD_ITERATIONS = 120_000;
const PASSWORD_KEYLEN = 64;
const PASSWORD_DIGEST = 'sha512';

const SESSION_COOKIE = 'cw_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 天

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  region: Region;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = await pbkdf2(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEYLEN, PASSWORD_DIGEST);
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = await pbkdf2(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEYLEN, PASSWORD_DIGEST);
  return timingSafeEqual(hash, derived.toString('hex'));
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  return cryptoTimingSafeEqual(bufA, bufB);
}

export async function createSession(userId: number) {
  const token = randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
  });

  return { token, expiresAt };
}

export function attachSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
  });
}

export function getSessionTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(SESSION_COOKIE)?.value ?? null;
}

export async function getSessionTokenFromCookies(): Promise<string | null> {
  try {
    const store = await cookies();
    return store.get(SESSION_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const token = getSessionTokenFromRequest(request);
  if (!token) return null;
  return findValidSessionByToken(token);
}

export async function getSessionUserFromCookies(): Promise<SessionUser | null> {
  const token = await getSessionTokenFromCookies();
  if (!token) return null;
  return findValidSessionByToken(token);
}

export async function revokeSessionByToken(token: string) {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function updateUserLoginMetadata(userId: number) {
  await db
    .update(users)
    .set({ updatedAt: new Date(), lastLoginAt: new Date() })
    .where(eq(users.id, userId));
}

async function findValidSessionByToken(token: string): Promise<SessionUser | null> {
  const now = new Date();
  const result = await db
    .select({
      sessionId: sessions.id,
      token: sessions.token,
      expiresAt: sessions.expiresAt,
      userId: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      role: users.role,
      region: users.region,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
    .limit(1);

  if (result.length === 0) {
    await revokeSessionByToken(token);
    return null;
  }

  const row = result[0];
  return {
    id: row.userId,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatarUrl,
    role: row.role as UserRole,
    region: row.region as Region,
  };
}
