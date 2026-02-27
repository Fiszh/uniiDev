import { queueMessage } from "$lib/discord";
import { getQuery, sendGQLRequest } from "$lib/GQL";
import router from "$lib/router";
import { read } from "$lib/userSettings";
import { UChat_Testers } from "$store/globals";

const RequestRouter = router();

const name_query = getQuery("channel_login");
const id_query = getQuery("channel_id");

const name_regex = /^[a-zA-Z0-9_]{1,25}$/;

const cache = new Map();
const ttl = 60 * 1000;

RequestRouter.add("GET", "/", async (req, res) => {
  const referer = req.headers.get("referer") ?? "No referer";
  const ip = req.headers.get("x-forwarded-for");
  const overlayVersion = req.headers.get("version") ?? "Unknown";
  const agent = req.headers.get("User-Agent");

  if (!ip)
    return res
      .status(500)
      .json({ error: "Server error, if continues please contact." });

  const channelName = req.query.get("name");
  const channelID = req.query.get("id");
  const noCache = req.query.get("noCache");

  const webhookMessage = [
    {
      name: "Channel",
      value: `${channelName ? `[${channelName}](https://twitch.tv/${channelName})` : `[${channelID}](https://api.unii.dev/twitch/${channelID})`}`,
    },
    {
      name: "Overlay version",
      value: overlayVersion,
    },
    {
      name: "Refer",
      value: referer,
    },
    {
      name: "Agent",
      value: agent,
    },
    {
      name: "IP",
      value: `[${ip}](https://ipinfo.io/${ip})`,
    },
    {
      name: "No cache",
      value: Boolean(noCache),
    },
  ];

  if (!channelName && !channelID)
    return res.status(400).json({ error: "Channel name or id is required" });

  if (channelName && !name_regex.test(channelName))
    return res.status(400).json({ error: "Invalid name" });

  if (channelID && isNaN(Number(channelID)))
    return res.status(400).json({ error: "Channel ID must be numeric" });

  const cacheKey = channelName || channelID;

  const cached = cache.get(cacheKey);
  if (!noCache && cached && cached.expires > Date.now()) {
    webhookMessage.push({
      name: "Cached",
      value: true,
    });
  } else {
    webhookMessage.push({
      name: "Cached",
      value: cached ? "deleted" : false,
    });
  }

  if (process.env.API_LOGS)
    queueMessage(
      process.env.API_LOGS,
      {
        content: webhookMessage
          .flatMap((msg) => msg.name + ": " + msg.value)
          .join("\n"),
      },
      5000,
    );

  if (cached) {
    cache.delete(cacheKey);
    return res.status(200).json(cached.data);
  }

  const GQLbody = {
    query: channelName ? name_query : id_query,
    variables: channelName ? { login: channelName } : { id: channelID },
  };

  const GQL_request = await sendGQLRequest(GQLbody);

  if ("error" in GQL_request) return res.status(500).json(GQL_request);
  if (!GQL_request.data.data.channel_info)
    return res
      .status(500)
      .json({ error: `Channel ${channelName} does not exist on Twitch!` });

  let user_settings = null;

  if (GQL_request?.data?.data?.channel_info?.id) {
    const userid = GQL_request.data.data.channel_info.id;

    if (UChat_Testers.includes(String(userid))) {
      user_settings = await read(userid);

      user_settings = user_settings?.result;
    }
  }

  cache.set(cacheKey, {
    data: { channel: GQL_request.data, user_settings, cached: true },
    expires: Date.now() + ttl,
  });

  return res.status(200).json({ channel: GQL_request.data, user_settings });
});

export default RequestRouter;
