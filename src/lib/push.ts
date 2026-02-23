import webPush from 'web-push';
import { prisma } from '@/lib/prisma';
import type { Role } from '@prisma/client';

const vapidPublic = process.env.VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

if (vapidPublic && vapidPrivate) {
  webPush.setVapidDetails(
    'mailto:sistema@camarpe.local',
    vapidPublic,
    vapidPrivate
  );
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<boolean> {
  if (!vapidPublic || !vapidPrivate) return false;
  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload),
      { TTL: 86400 }
    );
    return true;
  } catch (e) {
    // 410 Gone / 404 = subscription invalid, caller can remove from DB
    if (e && typeof e === 'object' && 'statusCode' in e) {
      const code = (e as { statusCode: number }).statusCode;
      if (code === 410 || code === 404) throw e;
    }
    return false;
  }
}

export async function getSubscriptionsForRoles(roles: Role[]) {
  return prisma.pushSubscription.findMany({
    where: { user: { role: { in: roles }, ativo: true } },
    select: { endpoint: true, p256dh: true, auth: true, id: true, userId: true },
  });
}

export async function sendPushToRoles(
  roles: Role[],
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  const subs = await getSubscriptionsForRoles(roles);
  let sent = 0;
  let failed = 0;
  const toRemove: string[] = [];
  for (const sub of subs) {
    try {
      const ok = await sendPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      );
      if (ok) sent++;
      else failed++;
    } catch {
      toRemove.push(sub.id);
      failed++;
    }
  }
  if (toRemove.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: toRemove } } });
  }
  return { sent, failed };
}
