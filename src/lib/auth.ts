import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import type { Role } from '@prisma/client';

const jwtSecretEnv = process.env.JWT_SECRET;
if (!jwtSecretEnv || jwtSecretEnv.length < 32) {
  throw new Error('JWT_SECRET não definido ou muito curto (mínimo 32 caracteres). Defina a variável de ambiente.');
}
const JWT_SECRET = new TextEncoder().encode(jwtSecretEnv);
const COOKIE_NAME = 'camarpe_token';

export interface JWTPayload {
  sub: string;
  email: string;
  role: Role;
  nome: string;
  exp: number;
}

export async function signToken(payload: Omit<JWTPayload, 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.role !== 'string' ||
      typeof payload.nome !== 'string' ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }
    // A validação runtime acima garante os tipos corretos
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(): Promise<JWTPayload> {
  const session = await getSession();
  if (!session) throw new Error('Não autorizado');
  return session;
}

export function requireRole(session: JWTPayload, allowed: Role[]): void {
  if (!allowed.includes(session.role)) throw new Error('Acesso negado');
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getUserById(id: string) {
  return prisma.usuario.findUnique({
    where: { id },
    select: { id: true, email: true, nome: true, role: true },
  });
}
