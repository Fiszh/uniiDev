import fs, { readdirSync } from "fs";
import path from "path";

import { getTwitchGQLVersion } from "$background/GQL";
import { Queries } from "$lib/GQL";

import pkg from "./package.json";

import { queueMessage } from "$lib/discord";
import { setSecurityHeaders } from "$lib/router";
import { allowed_sites } from "$store/globals";
import { generateGuessrRounds } from "$background/guessr";

const routes_path = path.resolve(".", "routes");

const CreateErrorResponse = (msg: string, status: number = 500) =>
  new Response(JSON.stringify({ message: msg, status, error: true }), {
    status,
  });

// This might be a shitty way to do this, im not a js expert tho...
async function handleRoute(
  req: Request,
  found_route: string,
  method: HTTPMethod,
  server: Bun.Server<undefined>,
) {
  const url = new URL(req.url);

  try {
    const route_path = path.resolve(routes_path, found_route);

    if (fs.existsSync(route_path)) {
      const module = await import(route_path);

      if (
        module &&
        module.default &&
        typeof module.default["exec"] === "function"
      ) {
        const res = await module.default["exec"](req, server);

        console.log(res);

        if (res instanceof Response) return res;
        return new Response(typeof res == "object" ? JSON.stringify(res) : res);
      }
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
      err instanceof Error ? err.stack : err,
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

/* 
// TODO
Add security headers
Add rate limiting
Add cdn
*/

Bun.serve({
  port: 3000,
  async fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/")
      return new Response(welcomePage, {
        headers: {
          "Content-Type": "text/html",
        },
      });

    if (url.pathname == "/health") return new Response("OK", { status: 200 });

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

    return await handleRoute(
      req,
      url.pathname.split("/")[1] || "",
      req.method as HTTPMethod,
      server,
    );
  },
});

if (!Queries.headers["Client-Version"]) getTwitchGQLVersion();
//generateGuessrRounds();

console.log("Ready! Server running at http://localhost:3000");
