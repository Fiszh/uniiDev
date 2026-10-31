import router from "$lib/routerV2";

const RequestRouter = new router("v4");

import { getModdedChannels, validateUser } from "$lib/twitch";

import {
  categories,
  channelIdQ,
  channelQuery,
  emoteQuery,
  getMonths,
  statsQuery,
  topEmotesQ,
  topQ,
} from "$lib/chatStatsQueries";

interface StatMetadata {
  name: string;
  row?: number;
}

const statsMetadata: Record<string, StatMetadata> = {
  new_chatters: {
    name: "New Chatters",
  },
  unique_chatters: {
    name: "Unique Chatters",
  },
  online_messages: {
    name: "Online Messages",
  },
  offline_messages: {
    name: "Offline Messages",
  },
  overall_messages: {
    name: "Overall Messages",
  },
  avg_messages_per_chatter: {
    name: "Average Messages per Chatter",
  },
  // LIST
  message_count_online: {
    name: "Online",
    row: 1,
  },
  message_count_offline: {
    name: "Offline",
    row: 1,
  },
  message_count_overall: {
    name: "Overall",
    row: 1,
  },
  top_linkers: {
    name: "Top linkers",
    row: 2,
  },
  top_emoters: {
    name: "Top Emoters",
    row: 2,
  },
  at_streamer: {
    name: "@streamer",
    row: 2,
  },
  "7TV_emotes": {
    name: "7TV - Emotes",
    row: 3,
  },
  FFZ_emotes: {
    name: "FFZ - Emotes",
    row: 3,
  },
  BTTV_emotes: {
    name: "BTTV - Emotes",
    row: 3,
  },
  "TTV_emotes": {
    name: "TTV - Emotes",
    row: 3,
  },
};

async function isMod(channel: string, token?: string | null) {
  if (!token) return false;
  const user_info = await validateUser(token);

  if (!user_info || "error" in user_info) return false;

  if (user_info.login == channel || user_info.user_id == "528761326")
    return true;

  const moddedChannels = await getModdedChannels(
    token,
    user_info.client_id,
    user_info.user_id
  );

  //console.log(moddedChannels);

  if (!moddedChannels || "error" in moddedChannels) return false;

  return moddedChannels.data.find((c) => c.broadcaster_login == channel);
}

RequestRouter.add("GET", "/channels", async (req, res) => {
  Promise.resolve(channelQuery)
    .then((result) => {
      const usernames = result.all(10);

      return res.status(200).json(usernames);
    })
    .catch((err) => {
      return res.status(500).json({
        error: "Failed, please try again later!",
      });
    });
});

RequestRouter.add("GET", "/months/:channel", async (req, res) => {
  const channel = req.params["channel"];

  if (!channel)
    return res.status(500).json({
      error: "No channel!",
    });

  const aviable_months = await getMonths(channel);

  if (aviable_months) {
    return res.status(200).json(aviable_months);
  } else {
    return res.status(500).json({
      error: "Failed, please try again later!",
    });
  }
});

RequestRouter.add("GET", "/months/:channel/:date", async (req, res) => {
  const channel = req.params["channel"];
  const date = req.params["date"];

  let limit = Number(req.query.get("limit") ?? NaN);
  limit = Math.max(0, Math.min(25, !isNaN(limit) ? limit : 10));

  let start = req.query.get("start");
  let end = req.query.get("end");

  const API_key = req.query.get("key");
  const token_header = req.headers.get("x-auth-token");

  //console.log(limit);

  if (!channel)
    return res.status(500).json({
      error: "No channel!",
    });

  if (!date)
    return res.status(500).json({
      error: "No date!",
    });

  const aviable_months = await getMonths(channel);

  const is_mod = token_header ? await isMod(channel, token_header) : false;
  const is_key = API_key == process.env.CHAT_STATS_V4_KEY;

  if (!aviable_months) {
    return res.status(500).json({
      error: "Failed, please try again later!",
    });
  }

  if (
    !aviable_months.includes(date) &&
    !is_mod &&
    !(is_mod && date != "custom") &&
    !is_key
  ) {
    return res.status(404).json({
      error: "Date unavailable!",
    });
  }

  const row = channelIdQ.get(channel) as { channel_id: string } | null;
  if (!row) return null;

  //console.log(start, end);

  const from = (is_mod || is_key) && date == "custom" && start ? start : `${date}-01`;
  const to = (is_mod || is_key) && date == "custom" && end ? end : `${date}-31`;
  const id = row.channel_id;

  //console.log(from, to);

  const emoteTypes = emoteQuery.values(id, from, to).flat();

  const topEmotes = Object.fromEntries(
    emoteTypes.map((type) => [
      `${type}_emotes`,
      topEmotesQ.all(id, type, from, to, limit),
    ])
  );

  const data = {
    ...statsQuery.all(id, from, to)[0]!,
    ...Object.fromEntries(
      categories.map((c) => [c, topQ[c]!.all(id, from, to, limit)])
    ),
    ...topEmotes,
  };

  //FIXME: ADD TYPES
  const mapped = Object.entries(data).reduce<Record<string, any>>(
    (acc, [key, stat]) => {
      if (statsMetadata[key]) {
        acc[key] = {
          ...statsMetadata[key],
          data: stat,
        };
      } else {
        acc[key] = stat;
      }

      return acc;
    },
    {}
  );

  //console.log(mapped);

  return res.status(200).json(mapped);
});

export default RequestRouter;
