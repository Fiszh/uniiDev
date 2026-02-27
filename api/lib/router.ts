import { allowed_sites, security_headers } from "$store/globals";

const route_regex = /^\/[a-zA-Z0-9-_:]*$/;

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
};

const CreateError = (type: string) => {
  return { error: true, router: true, type };
};

function sanitizeObject(
  obj: string | any[] | Record<string, any>,
): string | any[] | Record<string, any> {
  if (typeof obj === "string") {
    return obj
      .replace(/[<>"']/g, "")
      .trim()
      .slice(0, 100);
  } else if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  } else if (obj && typeof obj === "object") {
    const sanitized: Record<string, any> = {}; // <--- index signature
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

function routeToRegex(route: string): RegExp {
  const pattern = route
    .split("/")
    .map((part) =>
      part.startsWith(":") ? "(?<" + part.slice(1) + ">[^/]+)" : part,
    )
    .filter(Boolean)
    .join("/");

  return new RegExp("^" + pattern + "$");
}

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

export function setSecurityHeaders(res: Res | Response): Res | Response {
  if (!res.headers.get("Access-Control-Allow-Origin"))
    res.headers.set("Access-Control-Allow-Origin", "*");

  // Only allow these headers in CORS requests
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Auth-Token, version",
  );

  // Restrict what external resources can be loaded, prevent XSS, unsafe scripts/styles
  res.headers.set("Content-Security-Policy", security_headers.join("; "));

  // Enforce HTTPS, tells browsers to always use secure connections
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );

  // Prevent the site from being framed (clickjacking protection)
  res.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing, enforce declared content-type
  res.headers.set("X-Content-Type-Options", "nosniff");

  // Control what referrer info is sent (privacy/security)
  res.headers.set("Referrer-Policy", "no-referrer");

  // Disallow Flash/Adobe cross-domain policies
  res.headers.set("X-Permitted-Cross-Domain-Policies", "none");

  // Optional: Restrict which features the browser can use
  res.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()",
  );

  // Optional: Disable caching for sensitive endpoints
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );

  // Optional: Hide server info
  res.headers.set("Server", "");

  return res;
}

export default function router() {
  let routes: Record<HTTPMethod, RouteHandler[]> = {
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

  const add = (method: HTTPMethod, ...args: Parameters<typeof handler>) =>
    routes[method].push({ route: args[0], func: handler(...args) });

  async function exec(method: HTTPMethod, req: Response) {
    const res: Res = {
      object: {
        status: 200,
        headers: new Headers(),
      },

      headers: {
        set(header, value) {
          res.object.headers.set(header, value);
          return res;
        },
        delete(header) {
          res.object.headers.delete(header);
          return res;
        },
        get(header) {
          return res.object.headers.get(header);
        },
      },

      status(s) {
        this.object.status = s;
        return this;
      },

      body(body) {
        this.object.body = body;
        return this;
      },

      json(body) {
        this.object.headers.set("content-type", "application/json");
        this.object.body = JSON.stringify(body);
        return this;
      },

      redirect(url) {
        this.object.redirect = url;
        return this;
      },

      send(body) {
        if (this.object.redirect)
          return Response.redirect(this.object.redirect, 302);
        if (body instanceof Response) return body;

        return new Response(body ?? this.object.body, {
          status: this.object.status,
          headers: this.object.headers,
        });
      },
    };

    res.headers.set("Access-Control-Allow-Methods", "GET");

    setSecurityHeaders(res);

    if (!routes[method].length) return CreateError("method_empty");

    const router_path = new URL(req.url);
    const paths = router_path.pathname
      .split("/")
      .filter(Boolean)
      .slice(1)
      .join("/");

    const foundRoute = routes[method].find((route_path) =>
      routeToRegex(route_path.route).test(paths),
    ) as RouteHandler;
    if (!foundRoute)
      return res
        .status(404)
        .json({ message: "Path not found!", error: true })
        .send();

    res.headers.set("Access-Control-Allow-Methods", method.toUpperCase());

    return (await foundRoute) && typeof foundRoute.func == "function"
      ? foundRoute?.func(req, res)
      : CreateError("no_func");
  }

  return {
    add,
    exec,
    routes,
  };
}

interface ResponseParams extends Response {
  params: Record<string, string>;
  query: URLSearchParams;
}

interface parsedRouteParam {
  param: string;
  index: number;
}

function handler<T>(
  route: string,
  func: (req: ResponseParams, res: Res) => Promise<T>,
) {
  if (!route_regex.test(route)) return CreateError("invalid_route");

  const route_paths = route.split("/").filter(Boolean);

  const params: (parsedRouteParam | undefined)[] = route_paths
    .map((path_part, i) => {
      if (path_part.startsWith(":"))
        return {
          param: path_part.slice(1),
          index: i,
        };
    })
    .filter(Boolean);

  return async (req: ResponseParams, res: Res) => {
    try {
      const router_path = new URL(req.url);
      const paths = router_path.pathname.split("/").filter(Boolean).slice(1);

      req.params = Object.fromEntries(
        params
          .filter((param) => typeof param !== "undefined")
          .map((param) => [
            param.param,
            sanitizeObject(paths[param.index] ?? ""),
          ]),
      ) as Record<string, string>;

      const rawQuery = new URLSearchParams(router_path.search);
      const sanitizedQuery = new URLSearchParams();

      for (const [key, value] of rawQuery.entries()) {
        sanitizedQuery.set(key, sanitizeObject(value) as string);
      }

      req.query = sanitizedQuery;

      let isCorrectPath = false;

      // IF ROUTE IS /
      isCorrectPath = !paths && !route_paths;

      // IF ANY OTHER ROUTE
      if (paths && route_paths && paths.length == route_paths.length) {
        const correctPaths = route_paths.filter(
          (part_path, i) => part_path.startsWith(":") || part_path == paths[i],
        );

        isCorrectPath = correctPaths.length == route_paths.length;
      }

      if (isCorrectPath) await func(req, res);

      return res.send();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
}
