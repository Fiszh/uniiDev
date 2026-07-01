const route_regex = /^\/[a-zA-Z0-9-_:]*$/;

globalThis.allowedOrigins = [
  "http://localhost:5173",
  "https://unii.dev",
  "https://chat.unii.dev",
  "https://api.unii.dev",
  "https://dev.unii.dev",
];

type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD"
  | "CONNECT"
  | "TRACE";

type RouteHandler = {
  route: string;
  func: Function | { error: boolean; type: string };
  settings?: {
    cors?: boolean | string[];
    cache?: number;
  };
};

interface Res {
  object: {
    status: number;
    body?: BodyInit;
    redirect?: string;
    headers: Headers;
  };
  headers: {
    set: (header: string, value: string) => Res;
    delete: (header: string) => Res;
    get: (header: string) => string | null;
  };
  status: (s: Res["object"]["status"]) => Res;
  body: (body: any) => Res;
  json: (body: Record<any, any>) => Res;
  redirect: (url: string) => Res;
  send: (body?: BodyInit | Response) => Response;
}

interface ResponseParams extends Response {
  params: Record<string, string>;
  query: URLSearchParams;
}

interface parsedRouteParam {
  param: string;
  index: number;
}

export default class Router {
  routeName: string;

  constructor(routeName: string) {
    this.routeName = routeName;
  }

  private routes: Record<HTTPMethod, RouteHandler[]> = {
    GET: [],
    POST: [],
    PUT: [],
    DELETE: [],
    PATCH: [],
    OPTIONS: [],
    HEAD: [],
    CONNECT: [],
    TRACE: [],
  };

  CreateError = (type: string) => {
    return { error: true, router: true, type };
  };

  createRes = (): Res => {
    const res: Res = {
      object: {
        status: 200,
        headers: new Headers(),
      },
      headers: {
        set: (header, value) => {
          res.object.headers.set(header, value);
          return res;
        },
        delete: (header) => {
          res.object.headers.delete(header);
          return res;
        },
        get: (header) => {
          return res.object.headers.get(header);
        },
      },
      status: (s) => {
        res.object.status = s;
        return res;
      },
      body: (body) => {
        res.object.body = body;
        return res;
      },
      json: (body) => {
        res.object.body = JSON.stringify(body);
        res.object.headers.set("Content-Type", "application/json");
        return res;
      },
      redirect: (url) => {
        res.object.redirect = url;
        return res;
      },
      send: (body) => {
        if (res.object.redirect)
          return Response.redirect(res.object.redirect, 302);
        if (body instanceof Response) return body;

        return new Response(body ?? res.object.body, {
          status: res.object.status,
          headers: res.object.headers,
        });
      },
    };
    return res;
  };

  sanitizeObject(
    obj: string | any[] | Record<string, any>,
  ): string | any[] | Record<string, any> {
    if (typeof obj === "string") {
      return obj
        .replace(/[<>"']/g, "")
        .trim()
        .slice(0, 100);
    } else if (Array.isArray(obj)) {
      return obj.map(this.sanitizeObject);
    } else if (obj && typeof obj === "object") {
      const sanitized: Record<string, any> = {}; // <--- index signature
      for (const key in obj) {
        sanitized[key] = this.sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  }

  async exec(
    initReq: Request,
    server: Bun.Server<undefined>,
  ): Promise<Response> {
    const method = initReq.method as HTTPMethod;
    const router_url = new URL(initReq.url);
    const route = router_url.pathname;
    const res = this.createRes();
    const req = Object.assign(initReq, { query: new URLSearchParams() }) as Request & { query: URLSearchParams };

    try {
      // CHECK FOR IP ADDRESS AND SET X-FORWARDED-FOR HEADER
      const forwardedFor = req.headers.get("x-forwarded-for");
      const cfIP = req.headers.get("cf-connecting-ip");
      const serverIP = server.requestIP(req)?.address;

      if (!forwardedFor && (cfIP || serverIP))
        req.headers.set(
          "x-forwarded-for",
          cfIP ?? serverIP?.replace("::ffff:", "") ?? "unknown",
        );

      // ADD QUERY PARAMS TO REQUEST OBJECT
      const rawQuery = new URLSearchParams(router_url.search);
      const sanitizedQuery = new URLSearchParams();

      for (const [key, value] of rawQuery.entries())
        sanitizedQuery.set(key, this.sanitizeObject(value) as string);

      req.query = sanitizedQuery;

      // CHECK FOR VALID METHOD AND ROUTE
      if (!method || !route || !this.routes[method]) throw new Error(`Invalid`);

      if (!route_regex.test(route) || !this.routes[method])
        throw new Error(`Invalid route: ${route}`);

      const routeHandler = this.routes[method].find((r) => r.route === route);

      console.log(this.routes[method]);

      if (!routeHandler)
        throw new Error(`${method} does not exist on ${route}`);

      res.headers.set("Access-Control-Allow-Methods", method);

      // CHECK CORS SETTINGS
      const origin = req.headers.get("Origin");
      if (!origin) {
        res.headers.set("Access-Control-Allow-Origin", "*");
      } else if (origin && routeHandler.settings?.cors) {
        if (typeof routeHandler.settings.cors === "boolean") {
          if (routeHandler.settings.cors) {
            res.headers.set("Access-Control-Allow-Origin", "*");
          } else {
            res.headers.set(
              "Access-Control-Allow-Origin",
              globalThis.allowedOrigins?.includes(origin) ? origin : "null",
            );
          }
        } else if (routeHandler.settings.cors.includes(new URL(origin).host)) {
          res.headers.set("Access-Control-Allow-Origin", origin);
        }
      }

      // HANDLE REQUEST
      if (routeHandler.func instanceof Function) {
        return await routeHandler
          .func(req, res)
          .then(() => res.send())
          .catch((err: any) => {
            throw new Error(err.message || "internal_error");
          });
      } else {
        throw new Error(`Invalid route handler for ${method} ${route}`);
      }
    } catch (err: any) {
      console.error(err instanceof Error ? err.stack : err);
      res
        .json(this.CreateError(err.message || "internal_error"))
        .status(err.status || 500);
    } finally {
      return res.send();
    }
  }

  handler<T>(
    route: string,
    func: (req: ResponseParams, res: Res) => Promise<T>,
    settings?: RouteHandler["settings"],
  ) {
    if (!route_regex.test(route)) throw new Error(`Invalid route: ${route}`);

    return func;
  }

  add = (method: HTTPMethod, ...args: Parameters<typeof this.handler>) =>
    this.routes[method].push({
      route: args[0] + this.routeName,
      func: this.handler(...args),
      settings: args[2] as RouteHandler["settings"],
    });
}
