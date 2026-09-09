import path from "path";

import { getTwitchGQLVersion } from "$background/GQL";
import { Queries } from "$lib/GQL";

import pkg from "./package.json";

import { type InitedRes } from "$lib/routerV2";
import WsAdapter from "./lib/routerV2/wsAdapter";
import { API_URL } from "$store/globals";
import { generateGuessrRounds } from "$background/guessr";

import serveCDN from "./lib/cdn";
import router from "$lib/routerV2";

const Router = new router();

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

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});

Bun.serve({
  port: 3000,
  async fetch(req, server) {
    const url = new URL(req.url);

    let initedRes = await Router.initRes(req, server);

    if (initedRes instanceof Response) return initedRes;

    const quickRes = initedRes as InitedRes;

    if (url.pathname == "/health") return new Response("OK", { status: 200 });
    if (url.pathname == "/api-spec.json")
      return quickRes.res
        .body(Bun.file(path.resolve(".", "docs", "api-spec.json")).stream())
        .send();

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

    return await Router.handleRoute(
      req,
      url.pathname.split("/")[1] || "",
      req.method as HTTPMethod,
      server,
    );
  },
  websocket: {
    open(ws) {
      try {
        const data = (ws as any).data || {};
        const adapter = new WsAdapter(ws);
        ws.data = { ...data, adapter };

        const handler = data.handler;
        const req = data.req;
        const res = data.res;

        if (!handler || typeof handler.func != "function") {
          try {
            ws.close();
          } catch {}
          return;
        }

        try {
          handler.func(req, res, adapter);
        } catch (err) {
          console.error(err instanceof Error ? err.stack : err);
          try {
            ws.close();
          } catch {}
        }
      } catch (err) {
        console.error("websocket open error", err);
      }
    },

    message(ws, message) {
      try {
        (ws as any).data?.adapter?.emit("message", { data: message });
      } catch (err) {
        console.error("ws message handler error", err);
      }
    },

      if (url.pathname == "/health") return respond("OK");

      if (url.pathname.startsWith("/docs"))
        return new Response(
          Bun.file(path.resolve(".", "docs", "index.html")).stream(),
        );

      if (url.pathname.startsWith("/seventv"))
        return Response.redirect("https://7tv.app/api/docs", 302);

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
        (ws as any).data?.adapter?.emit("close", { code, reason });
        (ws as any).data.adapter = undefined;
      } catch (err) {}
    },
  },
});

if (!Queries.headers["Client-Version"]) getTwitchGQLVersion();
generateGuessrRounds();

console.log("Ready! Server running at", API_URL);
