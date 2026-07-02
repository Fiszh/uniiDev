import fs, { readdirSync } from "fs";
import path from "path";

import { getTwitchGQLVersion } from "$background/GQL";
import { Queries } from "$lib/GQL";

import pkg from "./package.json";

import { queueMessage } from "$lib/discord";
import { setSecurityHeaders } from "$lib/routerV2";
import { allowed_sites } from "$store/globals";
import { generateGuessrRounds } from "$background/guessr";

const routes_path = path.resolve(".", "routes");

const CreateErrorResponse = (msg: string, status: number = 500) => {
  let res = new Response(
    JSON.stringify({ message: msg, status, error: true }),
    {
      status,
    },
  );

  return setSecurityHeaders(res) as Response;
};

// This might be a shitty way to do this, im not a js expert tho...
async function handleRoute(
  req: Request,
  found_route: string,
  method: HTTPMethod,
  server: Bun.Server<undefined>,
) {
  const url = new URL(req.url);

  try {
    const module = await import(path.resolve(routes_path, found_route));

    if (
      module &&
      module.default &&
      typeof module.default["exec"] === "function"
    ) {
      const res = await module.default["exec"](req, server);

      console.log(res);

      if (res instanceof Response) return res;
      return new Response(typeof res == "object" ? JSON.stringify(res) : res);
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
Add rate limiting
Add security headers to quick responses
*/

const badgeSizes: Record<string, number> = {
  "1x": 18,
  "2x": 36,
  "3x": 54,
  "4x": 72,
};

Bun.serve({
  port: 3000,
  async fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname == "/health") return new Response("OK", { status: 200 });

    if (url.host.startsWith("cdn.")) {
      if (url.pathname === "/")
        return new Response(JSON.stringify({ message: "Welcome to the CDN" }));

      try {
        const pathname = decodeURIComponent(url.pathname);

        const base = path.resolve(".", "cdn");

        let file_path = path.resolve(base, "." + pathname);

        if (pathname.startsWith("/badges/")) {
          const badgeMatch = url.pathname.match(
            /^\/badges\/(?<project>[^\/]+)\/(?<id>[^\/]+)\/(?<variant>[^\/]+)\/(?<filename>[^\/]+)\.(?<ext>[a-zA-Z0-9]+)$/,
          );

          if (badgeMatch && badgeMatch.groups) {
            const badgeInfo = { ...badgeMatch.groups };

            if (badgeInfo["filename"] && typeof badgeSizes[badgeInfo["filename"]] == "number") {
              const badge_file_path = path.resolve(
                ".",
                "badges",
                Object.values(badgeInfo).slice(0, -2).join("/"),
                "badge.webp",
              );

              const badgeSize = badgeSizes[badgeInfo["filename"]];

              const blob = await Bun.file(badge_file_path)
                .image()
                .resize(badgeSize!)
                .webp()
                .blob()
                .catch((e) => {
                  throw e;
                });

              return new Response(blob);
            }
          }
        }

        const file_exists = fs.existsSync(file_path);

        if (file_exists && fs.statSync(file_path).isFile())
          return new Response(Bun.file(file_path).stream());
      } catch {}

      return new Response(
        JSON.stringify({ message: "Not found", error: true }),
        { status: 404 },
      );
    }

    if (url.pathname === "/")
      return new Response(welcomePage, {
        headers: {
          "Content-Type": "text/html",
        },
      });

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
