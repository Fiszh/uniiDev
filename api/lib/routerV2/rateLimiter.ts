interface RateLimit {
  requests: number;
  last: number;
  timeout: ReturnType<typeof setTimeout>;
}

export default class rateLimiter {
  requests: number;
  timeout: number;
  store: Map<string, RateLimit>;
  defaultValue: Omit<RateLimit, "timeout">;

  constructor({ requests, timeout }: { requests: number; timeout: number }) {
    this.requests = requests;
    this.timeout = timeout;
    this.store = new Map();

    this.defaultValue = {
      requests: 0,
      last: Date.now(),
    };
  }

  private setIP(ip: string): RateLimit {
    const starter_value = {
      ...this.defaultValue,
      last: Date.now(),
      timeout: setTimeout(() => this.store.delete(ip), this.timeout),
    };

    this.store.set(ip, starter_value);

    return this.getIP(ip);
  }

  public getIP(ip: string): RateLimit {
    const already_exists = this.store.get(ip);

    if (already_exists) return already_exists;

    return this.setIP(ip);
  }

  private increment(ip: string) {
    const key_data = this.getIP(ip);

    this.store.set(ip, {
      ...key_data,
      requests: key_data.requests + 1,
    });
  }

  public isAllowed(ip: string): boolean {
    const key_data = this.getIP(ip);

    this.increment(ip);

    return key_data.requests < this.requests;
  }
}
