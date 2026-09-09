import fs from "fs";
import path from "path";
import getBadge from "./badges";
import type { Res } from "$lib/routerV2";

export default async function serveCDN(res: Res, url: URL): Promise<Response> {
  if (url.pathname === "/")
    return res.json({ message: "Welcome to the CDN" }).send();
  //return new Response(JSON.stringify({ message: "Welcome to the CDN" }));

  // Remove CORS
  res.headers.set("Access-Control-Allow-Origin", "*");

  try {
    const pathname = decodeURIComponent(url.pathname);

    const base = path.resolve(".", "cdn");

    const relativePath = pathname.replace(/^[/\\]+/, "");
    const file_path = path.resolve(base, relativePath);
    if (!file_path.startsWith(base))
      return res.status(403).body("Forbidden").send();
    //return new Response("Forbidden", { status: 403 });

    if (pathname.startsWith("/badges/")) {
      const badgeResponse = await getBadge(url);
      if (badgeResponse) return badgeResponse;
    }

    const file_exists = fs.existsSync(file_path);

    if (file_exists && fs.statSync(file_path).isFile())
      return new Response(await Bun.file(file_path));
  } catch (err: unknown) {
    if (err instanceof Error && "code" in err && err.code != "ENOENT") {
      console.error(
        `CDN request failed: path=${url.pathname} type=${typeof err === "object" && err !== null && "message" in err ? (err as { message: string }).message : String(err)}`,
        err instanceof Error ? err.stack : err,
      );

      return res
        .status(500)
        .json({ message: "Internal CDN Server Error", error: true })
        .send();
      return new Response(
        JSON.stringify({ message: "Internal CDN Server Error", error: true }),
        { status: 500 },
      );
    }
  }

  return res
    .status(404)
    .json({ message: "File not found", error: true })
    .send();
  return new Response(
    JSON.stringify({ message: "File not found", error: true }),
    { status: 404 },
  );
}
