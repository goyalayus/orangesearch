import { headers } from "next/headers";
import { RateLimiter } from "./rate-limit";

export async function getClientIp(): Promise<string | null> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const vercelIp = headersList.get("x-vercel-forwarded-for");
  if (vercelIp) {
    return vercelIp.split(",")[0].trim();
  }
  const realIp = headersList.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return null;
}

export const globalBucket = new RateLimiter<string>(100, 1);

export async function globalGETRateLimit(): Promise<boolean> {
  const clientIP = await getClientIp();
  if (clientIP === null) return true;

  return globalBucket.consume(clientIP, 1);
}

export async function globalPOSTRateLimit(): Promise<boolean> {
  const clientIP = await getClientIp();
  if (clientIP === null) return true;

  return globalBucket.consume(clientIP, 3);
}
