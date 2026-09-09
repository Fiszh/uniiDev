export class WsAdapter {
  raw: any;
  listeners: Map<string, Set<Function>>;

  constructor(raw: any) {
    this.raw = raw;
    this.listeners = new Map();
  }

  addEventListener(event: string, cb: Function) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
  }

  removeEventListener = (event: string, cb: Function) =>
    this.listeners.get(event)?.delete(cb);

  emit(event: string, ev: any) {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const cb of Array.from(set)) {
      try {
        const result = cb(ev);
        if (result instanceof Promise) {
          result.catch((err) =>
            console.error("ws adapter async listener error", err),
          );
        }
      } catch (err) {
        console.error("ws adapter listener error", err);
      }
    }
  }

  send(data: any) {
    try {
      if (typeof data === "string" || data instanceof Uint8Array)
        this.raw.send(data);
      else this.raw.send(JSON.stringify(data));
    } catch (err) {
      console.error("ws send error", err);
    }
  }

  close(code?: number, reason?: string) {
    try {
      if (typeof this.raw.close === "function") this.raw.close(code, reason);
    } catch (err) {
      console.error("ws close error", err);
    }
  }
}

export default WsAdapter;
