import path from "path";

import sharp from "sharp";

const badgeSizes: Record<string, number> = {
  "1x": 18,
  "2x": 36,
  "3x": 54,
  "4x": 72,
};

function isAnimatedWebp(buf: Buffer): boolean {
  if (buf.length < 21) return false;
  if (buf.toString("ascii", 12, 16) !== "VP8X") return false;
  return (buf[20]! & 0x02) !== 0;
}

export default async function getBadge(
  url: URL,
): Promise<Response | undefined> {
  const badgeMatch = url.pathname.match(
    /^\/badges\/(?<project>[^\/]+)\/(?<id>[^\/]+)\/(?<variant>[^\/]+)\/(?<filename>[^\/]+)\.(?<ext>[a-zA-Z0-9]+)$/,
  );

  if (badgeMatch && badgeMatch.groups) {
    const badgeInfo = { ...badgeMatch.groups };

    if (
      badgeInfo["filename"] &&
      typeof badgeSizes[badgeInfo["filename"]] == "number"
    ) {
      const badge_file_path = path.resolve(
        ".",
        "badges",
        Object.values(badgeInfo).slice(0, -2).join("/"),
        "badge.webp",
      );

      const badgeSize = badgeSizes[badgeInfo["filename"]];

      const raw = Buffer.from(await Bun.file(badge_file_path).arrayBuffer());

      const blob = isAnimatedWebp(raw)
        ? new Blob(
            [
              await sharp(raw, { animated: true })
                .resize(badgeSize, badgeSize)
                .webp({ quality: 80 })
                .toBuffer(),
            ],
            { type: "image/webp" },
          )
        : await Bun.file(badge_file_path)
            .image()
            .resize(badgeSize!)
            .webp()
            .blob();

      return new Response(blob);
    }
  }
}
