interface Bucket {
  count: number;
  refilledAt: number;
  lastAccessed: number;
}

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const BUCKET_EXPIRATION_MS = 24 * 60 * 60 * 1000;

export class RateLimiter<TKey> {
  public max: number;
  public refillIntervalSeconds: number;
  private storage = new Map<TKey, Bucket>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(max: number, refillIntervalSeconds: number) {
    this.max = max;
    this.refillIntervalSeconds = refillIntervalSeconds;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, bucket] of this.storage.entries()) {
      if (now - bucket.lastAccessed > BUCKET_EXPIRATION_MS) {
        this.storage.delete(key);
      }
    }
  }

  public startCleanup(): void {
    if (this.cleanupInterval === null) {
      this.cleanupInterval = setInterval(
        () => this.cleanup(),
        CLEANUP_INTERVAL_MS,
      );
    }
  }

  public stopCleanup(): void {
    if (this.cleanupInterval !== null) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  public consume(key: TKey, cost: number): boolean {
    const now = Date.now();
    const bucket = this.storage.get(key) ?? {
      count: this.max,
      refilledAt: now,
      lastAccessed: now,
    };

    const refillAmount = Math.floor(
      (now - bucket.refilledAt) / (this.refillIntervalSeconds * 1000),
    );

    if (refillAmount > 0) {
      bucket.count = Math.min(bucket.count + refillAmount, this.max);
      bucket.refilledAt = now;
    }

    bucket.lastAccessed = now;

    if (bucket.count < cost) {
      this.storage.set(key, bucket);
      return false;
    }

    bucket.count -= cost;
    this.storage.set(key, bucket);
    return true;
  }
}
