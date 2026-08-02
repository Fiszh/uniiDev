import fs from "fs";
import path from "path";
import getBadge from "./badges";

export default async function serveCDN(url: URL): Promise<Response> {
  if (url.pathname === "/")
    return new Response(JSON.stringify({ message: "Welcome to the CDN" }));

  try {
    const pathname = decodeURIComponent(url.pathname);

    const base = path.resolve(".", "cdn");

    let file_path = path.resolve(base, "." + pathname);

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

      return new Response(
        JSON.stringify({ message: "Internal CDN Server Error", error: true }),
        { status: 500 },
      );
    }
  }

  return new Response(
    JSON.stringify({ message: "File not found", error: true }),
    { status: 404 },
  );
}
