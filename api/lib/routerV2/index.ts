import { security_headers } from "$store/globals";
import rateLimiter from "./rateLimiter";

const route_regex = /^\/$|^\/(:?[a-zA-Z0-9_-]+)(\/:?[a-zA-Z0-9_-]+)*\/?$/;

const limiter = new rateLimiter({
  requests: 50,
  timeout: 60 * 1000, // 1 minute
});

globalThis.allowedOrigins = [
  "localhost:5173",
  "unii.dev",
  "chat.unii.dev",
  "api.unii.dev",
  "dev.unii.dev",
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

export interface InitedRes {
  method: HTTPMethod;
  router_url: URL;
  route: string;
  res: Res;
  req: reqParsed;
  options_method?: HTTPMethod;
}

export interface Res {
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
  html: (body: string | ReadableStream<Uint8Array<ArrayBuffer>>) => Res;
  json: (body: Record<any, any>) => Res;
  redirect: (url: string) => Res;
  send: (body?: BodyInit | Response) => Response;
}

interface reqParsed extends Request {
  params: Record<string, string>;
  query: URLSearchParams;
}

const securityHeaders: Record<string, string> = {
  // Only allow these headers in CORS requests
  "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, version",

  // Restrict what external resources can be loaded, prevent XSS, unsafe scripts/styles
  "Content-Security-Policy": security_headers.join("; "),

  // Enforce HTTPS, tells browsers to always use secure connections
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",

  // Prevent the site from being framed (clickjacking protection)
  "X-Frame-Options": "DENY",

  // Prevent MIME type sniffing, enforce declared content-type
  "X-Content-Type-Options": "nosniff",

  // Control what referrer info is sent (privacy/security)
  "Referrer-Policy": "no-referrer",

  // Disallow Flash/Adobe cross-domain policies
  "X-Permitted-Cross-Domain-Policies": "none",

  // Optional: Restrict which features the browser can use
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",

  "Cache-Control": "public, max-age=300, s-maxage=300",

  // Optional: Hide server info
  Server: "",
};

export function setSecurityHeaders(res: Res | Response): Res | Response {
  if (!res.headers.get("Access-Control-Allow-Origin"))
    res.headers.set("Access-Control-Allow-Origin", "*");

  for (const [header, value] of Object.entries(securityHeaders))
    res.headers.set(header, value);

  return res;
}

export function getRequestIP(
  initReq: Request,
  server: Bun.Server<undefined>,
): string | null {
  const cfIP = initReq.headers.get("cf-connecting-ip");
  if (cfIP) return cfIP;

  const serverIP = server.requestIP(initReq)?.address;
  return serverIP?.replace("::ffff:", "") ?? null;
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

  private createRes = (): Res => {
    let res: Res = {
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
      html: (body) => {
        res.object.body = body;
        res.object.headers.set("Content-Type", "text/html; charset=utf-8");
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

    res = setSecurityHeaders(res) as Res;

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

  async initRes(
    initReq: Request,
    server: Bun.Server<undefined>,
  ): Promise<InitedRes | Response> {
    const method = initReq.method as HTTPMethod;
    const router_url = new URL(initReq.url);
    const route = router_url.pathname;
    const res = this.createRes();
    const req = Object.assign(initReq, {
      query: new URLSearchParams(),
      params: {},
    }) as reqParsed;

    console.log(initReq);

    let options_method: HTTPMethod | undefined;

    if (method === "OPTIONS") {
      options_method = initReq.headers.get(
        "access-control-request-method",
      ) as HTTPMethod;

      if (!options_method) {
        return res
          .json(this.CreateError("OPTIONS request missing 'method' header"))
          .status(400)
          .send();
      }
    }

    // CHECK FOR IP ADDRESS AND SET X-FORWARDED-FOR HEADER
    const requestIP = getRequestIP(initReq, server);

    if (!requestIP) throw new Error("IP not found");

    const isAllowed = limiter.isAllowed(requestIP);
    console.log(limiter.getIP(requestIP));

    if (!isAllowed)
      return res.json(this.CreateError("Rate limited.")).status(429).send();

    req.headers.set("x-forwarded-for", requestIP);

    // ADD QUERY PARAMS TO REQUEST OBJECT
    const rawQuery = new URLSearchParams(router_url.search);
    const sanitizedQuery = new URLSearchParams();

    for (const [key, value] of rawQuery.entries())
      sanitizedQuery.set(key, this.sanitizeObject(value) as string);

    req.query = sanitizedQuery;

    res.headers.set("Access-Control-Allow-Methods", options_method || method);

    // CHECK CORS SETTINGS
    const origin = req.headers.get("Origin");
    if (!origin) {
      // NO ORIGIN HEADER, ALLOW ALL
      res.headers.set("Access-Control-Allow-Origin", "*");
    } else {
      // ORIGIN HEADER PRESENT, NO CORS SETTINGS
      res.headers.set(
        "Access-Control-Allow-Origin",
        globalThis.allowedOrigins?.includes(new URL(origin).host)
          ? origin
          : "null",
      );
    }

    return {
      method,
      router_url,
      route,
      res,
      req,
      options_method,
    };
  }

  async exec(
    initReq: Request,
    server: Bun.Server<undefined>,
  ): Promise<Response> {
    const initedRes = await this.initRes(initReq, server);

    if (initedRes instanceof Response) return initedRes;

    const { method, route, res, req, options_method } = initedRes;

    try {
      // CHECK FOR VALID METHOD AND ROUTE
      if (
        !route ||
        ((!method || !this.routes[method]) &&
          (!options_method || !this.routes[options_method]))
      )
        throw new Error(`Invalid`);

      if (!route_regex.test(route)) throw new Error(`Invalid route: ${route}`);

      // HANDLE PARAMS
      const routeSegments = route.split("/").filter(Boolean);
      let routeHandler;

      for (const r of this.routes[options_method || method]) {
        if (r.route === route) {
          routeHandler = r;
          break;
        }

        const handlerSegments = r.route.split("/").filter(Boolean);
        if (handlerSegments.length !== routeSegments.length) continue;

        const matched = handlerSegments.filter((seg) => seg.startsWith(":"));
        if (matched) {
          routeHandler = {
            ...r,
            params: handlerSegments.reduce<Record<string, string>>(
              (acc, seg, index) => {
                if (routeSegments[index] && seg.startsWith(":"))
                  acc[seg.slice(1)] = routeSegments[index];

                return acc;
              },
              {},
            ),
          };

          break;
        }
      }

      if (!routeHandler)
        throw new Error(`${method} does not exist on ${route}`);

      if ("params" in routeHandler) req.params = routeHandler.params;

      console.log(options_method);

      // CHECK CORS SETTINGS
      const origin = req.headers.get("Origin");
      if (origin && routeHandler.settings && "cors" in routeHandler.settings) {
        if (!routeHandler.settings.cors) {
          // ORIGIN HEADER PRESENT, CORS SETTINGS DISABLED
          res.headers.set("Access-Control-Allow-Origin", "*");
        } else if (
          Array.isArray(routeHandler.settings.cors) &&
          routeHandler.settings.cors.includes(new URL(origin).host)
        ) {
          // ORIGIN HEADER PRESENT, CORS USE CUSTOM LIST
          res.headers.set("Access-Control-Allow-Origin", origin);
        }
      }

      // console.log(
      //   origin,
      //   routeHandler.settings?.cors,
      //   res.headers.get("Access-Control-Allow-Origin"),
      // );

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

  private handler<T>(
    route: string,
    func: (req: reqParsed, res: Res) => Promise<T>,
    settings?: RouteHandler["settings"],
  ) {
    if (!route_regex.test(route)) throw new Error(`Invalid route: ${route}`);

    return func;
  }

  add = (method: HTTPMethod, ...args: Parameters<typeof this.handler>) =>
    this.routes[method].push({
      route: "/" + this.routeName + args[0],
      func: this.handler(...args),
      settings: args[2] as RouteHandler["settings"],
    });
}
