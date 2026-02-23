import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

const { prisma } = await import('@/lib/prisma');

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.mocked(prisma.$queryRaw).mockReset();
  });

  it('retorna 200 e { ok: true } quando o banco responde', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ '?column?': 1 }]);
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
  });

  it('retorna 503 quando o banco falha', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('Connection refused'));
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Database unavailable');
  });
});
