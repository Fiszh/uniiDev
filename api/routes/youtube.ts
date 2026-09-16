import { sendAPILog } from "$lib/APILog";
import router from "$lib/routerV2";
import { Innertube } from "youtubei.js";

const yt = await Innertube.create();

const RequestRouter = new router("youtube");

const cache = new Map();
const ttl = 60 * 1000;

RequestRouter.add("GET", "/resolve/:handle", async (req, res) => {
  const handle = req.params["handle"];

  const referer = req.headers.get("referer") ?? "No referer";
  const ip = req.headers.get("x-forwarded-for");

  if (!handle || !decodeURIComponent(handle).startsWith("@"))
    return res.status(400).json({
      error: "Bad Request",
      status: 400,
      message: "Invalid handle!",
    });

  const cacheKey = handle.replace(/@/g, "").toLowerCase();

  const cached = cache.get(cacheKey);

  if (cached) {
    if (cached.expires < Date.now()) {
      cache.delete(cacheKey);
    } else {
      return res.body(cached.data);
    }
  }

  const webhookMessage = [
    {
      name: "Resolving Handle",
      value: decodeURIComponent(handle),
    },
    {
      name: "Refer",
      value: referer,
    },
    {
      name: "IP",
      value: `[${ip}](https://ipinfo.io/${ip})`,
    },
  ];

  const resolved = await yt.resolveURL(
    "https://www.youtube.com/" + decodeURIComponent(handle),
  );

  sendAPILog("Resolving Channel", webhookMessage);

  if (
    !resolved ||
    !("payload" in resolved) ||
    !("browseId" in resolved["payload"])
  )
    return res.status(401).json({ error: true, message: "Failed to resolve!" });

  const browseId = resolved["payload"]["browseId"];

  cache.set(cacheKey, {
    data: browseId,
    expires: Date.now() + ttl,
  });

  return res.body(browseId);
});

export default RequestRouter;
