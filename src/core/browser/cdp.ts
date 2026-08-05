type Pending = {
  resolve: (value: Record<string, unknown>) => void;
  reject: (reason: Error) => void;
  timer: Timer;
};

type CDPMessage = {
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: { message: string };
};

const TIMEOUT = 120_000;

export default class CDP {
  #ws: WebSocket;
  #id = 0;
  #pending = new Map<number, Pending>();
  #events = new Map<string, Set<(params: Record<string, unknown>) => void>>();

  private constructor(ws: WebSocket) {
    this.#ws = ws;
    this.#ws.addEventListener("message", (event) => {
      const msg = JSON.parse(String(event.data)) as CDPMessage;
      if (msg.id !== undefined) {
        const pending = this.#pending.get(msg.id);
        if (!pending) return;
        this.#pending.delete(msg.id);
        clearTimeout(pending.timer);
        if (msg.error) pending.reject(new Error(msg.error.message));
        else pending.resolve(msg.result ?? {});
      } else if (msg.method) {
        this.#events.get(msg.method)?.forEach((cb) => {
          cb(msg.params ?? {});
        });
      }
    });
    this.#ws.addEventListener("close", () => {
      this.#pending.forEach((pending) => {
        clearTimeout(pending.timer);
        pending.reject(new Error("browser connection closed"));
      });
      this.#pending.clear();
    });
  }

  static connect(url: string) {
    return new Promise<CDP>((resolve, reject) => {
      const ws = new WebSocket(url);
      ws.addEventListener("open", () => resolve(new CDP(ws)));
      ws.addEventListener("error", () =>
        reject(new Error(`unable to reach the browser on ${url}`)),
      );
    });
  }

  send(
    method: string,
    params: Record<string, unknown> = {},
    sessionId?: string,
  ) {
    this.#id += 1;
    const id = this.#id;
    return new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#pending.delete(id);
        reject(new Error(`${method} timed out`));
      }, TIMEOUT);
      this.#pending.set(id, { resolve, reject, timer });
      this.#ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }

  on(event: string, cb: (params: Record<string, unknown>) => void) {
    if (!this.#events.has(event)) this.#events.set(event, new Set());
    this.#events.get(event)?.add(cb);
    return () => {
      this.#events.get(event)?.delete(cb);
    };
  }

  once(event: string) {
    return new Promise<Record<string, unknown>>((resolve) => {
      const off = this.on(event, (params) => {
        off();
        resolve(params);
      });
    });
  }

  close() {
    this.#ws.close();
  }
}
