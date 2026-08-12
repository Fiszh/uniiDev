import path from "path";

import { getTwitchGQLVersion } from "$background/GQL";
import { Queries } from "$lib/GQL";

import pkg from "./package.json";

import { setSecurityHeaders, type InitedRes } from "$lib/routerV2";
import { API_URL } from "$store/globals";
import { generateGuessrRounds } from "$background/guessr";

import serveCDN from "./lib/cdn";
import router from "$lib/routerV2";

const Router = new router("index");

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

      //console.log(res);

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
            <p><a href="${API_URL}/badges" style="color:#4ea1ff;" target="_blank">Access Badge Data</a></p>
            <p><a href="${API_URL}/docs" style="color:#4ea1ff;" target="_blank">Read the Documentation</a></p>
            <p>If you believe you been blocked from the API by accident please contact the discord user with id of: 703639905691238490</p>
            <p><em>Version: ${pkg.version}</em></p>
          </body>
        </html>
      `;

Bun.serve({
  port: 3000,
  async fetch(req, server) {
    const url = new URL(req.url);

    let initedRes = await Router.initRes(req, server);

    if (initedRes instanceof Response) return initedRes;

    const quickRes = initedRes as InitedRes;

    if (url.pathname == "/health") return new Response("OK", { status: 200 });

    if (url.host.startsWith("cdn.")) return await serveCDN(quickRes.res, url);

    if (url.pathname === "/" && !url.host.startsWith("cdn."))
      return quickRes.res.html(welcomePage).send();

    if (url.pathname.startsWith("/docs"))
      return quickRes.res
        .html(Bun.file(path.resolve(".", "docs", "index.html")).stream())
        .send();

    if (url.pathname.startsWith("/seventv"))
      return quickRes.res.redirect("https://7tv.app/api/docs").send();

    if (url.pathname.startsWith("/robots.txt"))
      return quickRes.res
        .body(Bun.file(path.resolve(".", "robots.txt")).stream())
        .send();

    return await handleRoute(
      req,
      url.pathname.split("/")[1] || "",
      req.method as HTTPMethod,
      server,
    );
  },
});

if (!Queries.headers["Client-Version"]) getTwitchGQLVersion();
generateGuessrRounds();

console.log("Ready! Server running at", API_URL);
