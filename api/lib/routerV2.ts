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
  settings?: {
    cors?: boolean;
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

export default class Router {
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
        if (body instanceof Response) return body;

        return new Response(body ?? res.object.body, {
          status: res.object.status,
          headers: res.object.headers,
        });
      },
    };
    return res;
  };

  exec = async (req: Request): Promise<Response> => {
    const method = req.method as HTTPMethod;
    const route = new URL(req.url).pathname;
    const res = this.createRes();

    try {
      if (!method || !route || !this.routes[method]) throw new Error(`Invalid`);

      if (!route_regex.test(route) || !this.routes[method])
        throw new Error(`Invalid route: ${route}`);

      const routeHandler = this.routes[method].find((r) => r.route === route);

      if (!routeHandler)
        throw new Error(`${method} does not exist on ${route}`);
    } catch (err: any) {
      res
        .json(this.CreateError(err.message || "internal_error"))
        .status(err.status || 500);
    } finally {
      return res.send();
    }
  };

  handler<T>(
    route: string,
    func: (req: ResponseParams, res: Res) => Promise<T>,
  ) {
    return this.CreateError("handler");
  }

  add = (method: HTTPMethod, ...args: Parameters<typeof this.handler>) =>
    this.routes[method].push({
      route: args[0],
      func: this.handler(...args),
    });
}
