import "server-only";

import type { NextRequest } from "next/server";
import { requestLimitSubjectHash } from "@/lib/security/rate-limit";

type Bucket = { count: number; expires: number };
const clients = new Map<string, Bucket>();
let minute: Bucket | undefined;
let day: Bucket | undefined;
const availabilityClients = new Map<string, Bucket>();
let availabilityMinute: Bucket | undefined;

function currentBucket(bucket: Bucket | undefined, now: number, windowMs: number): Bucket {
  return bucket && now < bucket.expires ? bucket : { count: 0, expires: now + windowMs };
}

export function reserveLearningQuestion(request: NextRequest): number {
  const subject = requestLimitSubjectHash(request, "water-learning");
  const now = Date.now();
  minute = currentBucket(minute, now, 60_000);
  day = currentBucket(day, now, 86_400_000);
  for (const [key, bucket] of clients) {
    if (bucket.expires <= now) clients.delete(key);
  }
  const client = currentBucket(clients.get(subject), now, 600_000);
  // Counters are local to the service process and contain only HMACs. Service
  // limits protect the upstream quota even when requests come from many IPs.
  const blockedUntil = Math.max(
    minute.count >= 8 ? minute.expires : 0,
    day.count >= 120 ? day.expires : 0,
    client.count >= 12 ? client.expires : 0,
  );
  if (blockedUntil > now) return Math.ceil((blockedUntil - now) / 1000);
  minute.count += 1;
  day.count += 1;
  client.count += 1;
  clients.set(subject, client);
  return 0;
}

export function reserveLearningAvailability(request: NextRequest): number {
  const subject = requestLimitSubjectHash(request, "resource-learning-availability");
  const now = Date.now();
  if (!availabilityMinute || availabilityMinute.expires <= now) availabilityClients.clear();
  availabilityMinute = currentBucket(availabilityMinute, now, 60_000);
  const client = availabilityClients.get(subject) ?? { count: 0, expires: availabilityMinute.expires };
  if (client.count >= 35 || availabilityMinute.count >= 120) {
    return Math.ceil((availabilityMinute.expires - now) / 1000);
  }
  client.count += 1;
  availabilityMinute.count += 1;
  availabilityClients.set(subject, client);
  return 0;
}
