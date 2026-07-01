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

export default class Router {
  private routes: Record<HTTPMethod, RouteHandler[]> = {
    GET: [], POST: [], PUT: [], DELETE: [],
    PATCH: [], OPTIONS: [], HEAD: [], CONNECT: [], TRACE: [],
  };

  add(method: HTTPMethod, ...args: Parameters<typeof handler>) {
    this.routes[method].push({ route: args[0], func: handler(...args) });
  };

}