import fs, { readdirSync } from "fs";
import path from "path";

import { getTwitchGQLVersion } from "$background/GQL";
import { Queries } from "$lib/GQL";

import pkg from "./package.json";

import { RateLimiter } from "ts-rate-limiter";
import { queueMessage } from "$lib/discord";
import { setSecurityHeaders } from "$lib/router";
import { allowed_sites } from "$store/globals";

const routes_path = path.resolve(".", "routes");
console.log(routes_path);
const routes = readdirSync(routes_path);
const findRoute = (route_name: string) =>
  routes.find((route) => route.split(".")[0] == route_name);

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

const CreateErrorResponse = (msg: string, status: number = 500) =>
  new Response(JSON.stringify({ message: msg, status, error: true }), {
    status,
  });

// This might be a shitty way to do this, im not a js expert tho...
async function handleRoute(
  req: Request,
  found_route: string,
  method: HTTPMethod,
) {
  const url = new URL(req.url);

  try {
    const module = await import(path.resolve(routes_path, found_route));

    if (typeof module.default["exec"] === "function") {
      const result = await module.default["exec"](method, req);

      if (!result)
        return CreateErrorResponse(
          `No ${method.toUpperCase()} found on ${url.pathname}`,
          404,
        );

      if (result.error && result.router)
        return CreateErrorResponse("Router error: " + result.type);

      if (result instanceof Response) return result;

      req.headers.set(
        "Content-Type",
        typeof result == "object" ? "application/json" : "application/text",
      );

      return new Response(
        typeof result == "object" ? JSON.stringify(result) : result,
      );
    } else if (module.default[method].error) {
      throw new Error(
        `Router failed!\nRouter Error Type: ${module.default[method].type}`,
      );
    }

    return CreateErrorResponse(
      `No ${method.toUpperCase()} found on ${url.pathname}`,
      404,
    );
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "type" in err
          ? (err as any).type
          : String(err);

    console.error(
      `Route error: path=${url.pathname} method=${method} type=${msg}`,
    );

    return CreateErrorResponse(
      "Failed to load route! Please contact if issue persist...",
    );
  }
}

const welcomePage = `
        <html>
          <body style="font-size: 1.5rem; background-color:#000; color:#fff; font-family:sans-serif; padding:2rem; text-align:center;">
            <h1>Welcome to the API</h1>
            <p><strong>Warning:</strong> Abuse will result in an immediate IP ban and permanent blacklist.</p>
            <p><strong>Notice:</strong> Your IP is logged for abuse prevention purposes.</p>
            <p><a href="https://api.unii.dev/badges" style="color:#4ea1ff;" target="_blank">Access Badge Data</a></p>
            <p><a href="https://api.unii.dev/docs" style="color:#4ea1ff;" target="_blank">Read the Documentation</a></p>
            <p>If you believe you been blocked from the API by accident please contact the discord user with id of: 703639905691238490</p>
            <p><em>Version: ${pkg.version}</em></p>
          </body>
        </html>
      `;

const limiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
});

// i will prob make this whole router better
// u can do it too tho :3
Bun.serve({
  port: 3000,
  async fetch(req, server) {
    const url = new URL(req.url);
    const host = url.host;

    const forwardedFor = req.headers.get("x-forwarded-for");
    const cfIP = req.headers.get("cf-connecting-ip");
    const serverIP = server.requestIP(req)?.address;

    if (!forwardedFor && cfIP) {
      req.headers.set("x-forwarded-for", cfIP);
    } else if (!forwardedFor && serverIP) {
      req.headers.set("x-forwarded-for", serverIP.replace("::ffff:", ""));
    }

    const ip = req.headers.get("x-forwarded-for");

    const limiterResponse = await limiter.middleware()(req);

    const origin = req.headers.get("Origin");

    if (limiterResponse) {
      const alertMessage = `⚠️ Rate limit exceeded by IP: [${ip}](<https://ipinfo.io/${ip}>) on path: ${url.pathname}`;

      if (process.env.RATELIMIT_LOGS)
        queueMessage(process.env.RATELIMIT_LOGS, alertMessage, 2000);

      return limiterResponse;
    }

    if (host.startsWith("api.localhost") || host.startsWith("api.unii.dev")) {
      let res = new Response();

      res = setSecurityHeaders(res) as Response;

      // CORS
      if (
        origin &&
        !allowed_sites.includes(origin) &&
        url.pathname != "/badges"
      ) {
        if (process.env.CORS_LOGS)
          queueMessage(
            process.env.CORS_LOGS,
            `path: ${url.pathname}\norigin: <${origin}>\nIP: [${ip}](<https://ipinfo.io/${ip}>)`,
            2000,
          );

        return new Response(null, {
          status: 403,
        });
      }

      res.headers.set("Access-Control-Allow-Origin", origin || "*");

      res.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, DELETE",
      );

      const respond = (body: any) => {
        return new Response(body, {
          headers: res.headers,
        });
      };

      if (req.method == "OPTIONS")
        return new Response(null, { headers: res.headers });
      const pathSegments = url.pathname.split("/").filter(Boolean);

      if (url.pathname.length < 2 || !pathSegments[0]) {
        res.headers.set("Content-Type", "text/html; charset=utf-8");
        return respond(welcomePage);
      }

      if (url.pathname == "/health") return respond("OK");

      if (url.pathname.startsWith("/docs"))
        return new Response(
          Bun.file(path.resolve(".", "docs", "index.html")).stream(),
        );

      if (url.pathname.startsWith("/seventv"))
        return new Response(
          Bun.file(path.resolve(".", "docs", "sevenTV.html")).stream(),
        );

      if (url.pathname == "/api-spec.json")
        return new Response(
          Bun.file(path.resolve(".", "docs", "api-spec.json")).stream(),
        );

      if (url.pathname.startsWith("/robots.txt"))
        return new Response(Bun.file(path.resolve(".", "robots.txt")).stream());

      const found_route = findRoute(pathSegments[0]);

      if (found_route)
        return handleRoute(req, found_route, req.method as HTTPMethod);
    } else if (
      host.startsWith("cdn.localhost") ||
      host.startsWith("cdn.unii.dev")
    ) {
      try {
        const pathname = decodeURIComponent(url.pathname);

        const base = path.resolve(".", "cdn");

        let file_path = path.resolve(base, "." + pathname);

        if (pathname.startsWith("/badges/"))
          file_path = path.resolve("." + pathname);

        const file_exists = fs.existsSync(file_path);

        if (file_exists) {
          let isFile = fs.statSync(file_path).isFile();

          if (isFile) return new Response(Bun.file(file_path).stream());
        }
      } catch {}
    }

    return CreateErrorResponse("Route not found!", 404);
  },
});

//if (!Queries.headers["Client-Version"]) getTwitchGQLVersion();
