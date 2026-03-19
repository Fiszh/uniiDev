import router from "$lib/router";

const RequestRouter = router();

import { getModdedChannels, validateUser } from "$lib/twitch";

import os from "os";
import fs from "fs";
import path from "path";

interface dataState {
  stat_name: string;
  row: number;
  data: {
    name: string;
    count: number;
    at: number;
    url?: string;
  }[];
}

interface longestMessage {
  message: string;
  sent_on: number;
  sent_by: string;
}

type statsDataValue =
  | string
  | number
  | boolean
  | dataState
  | longestMessage
  | string[];

type statsData = Record<string, statsDataValue>;

interface Err {
  status: number;
  message: string;
}

const chatStatsData_path = path.resolve(os.homedir(), "chatStatsData");

function parseDMY(dateStr: string): Date {
  const [dd, mm, yyyy]: number[] = dateStr.split("-").map(Number);
  if (!yyyy || !mm || !dd) return new Date(Date.now());
  return new Date(yyyy, mm - 1, dd);
}

async function isMod(channel: string, token?: string | null) {
  if (!token) return false;
  const user_info = await validateUser(token);

  if (!user_info || "error" in user_info) return false;

  if (user_info.user_id == "528761326") return true;
  if (user_info.login == channel) return true;

  const moddedChannels = await getModdedChannels(
    token,
    user_info.client_id,
    user_info.user_id,
  );

  console.log(moddedChannels);

  if (!moddedChannels || "error" in moddedChannels) return false;

  return moddedChannels.data.find((c) => c.broadcaster_login == channel);
}

RequestRouter.add("GET", "/:channel", async (req, res) => {
  let results = {};

  try {
    const channel = req.params["channel"];

    const startDate = req.query.get("start");
    const endDate = req.query.get("end");

    const API_key = req.query.get("key");
    const twitch_token = req.query.get("token");

    if (!channel) throw { status: 401, message: "Channel not provided" };

    const isChannelMod = await isMod(channel, twitch_token);

    if (
      (!API_key ||
        !process.env.CHAT_STATS_V4_KEY ||
        API_key != process.env.CHAT_STATS_V4_KEY) &&
      !isChannelMod
    )
      throw { status: 401, message: "Invalid API key" };

    if (!fs.existsSync(chatStatsData_path))
      throw { status: 401, message: "Chat stats data does not exists!" };

    const channel_path = path.resolve(chatStatsData_path, channel);

    if (!fs.existsSync(channel_path))
      throw { status: 401, message: `${channel} does not exist in the data!` };

    if (!startDate && !endDate && fs.existsSync(channel_path))
      return res.json({ message: `${channel} exists!`, error: false });

    if (!startDate) throw { status: 401, message: "Start not provided" };
    if (!endDate) throw { status: 401, message: "End not provided" };

    const start = performance.now();

    const timeFrameStart = parseDMY(startDate);
    const timeFrameEnd = parseDMY(endDate);

    const files: string[] = (await fs.promises.readdir(channel_path)).filter(
      (name: string) => {
        const baseName = name.replace(/\.json$/, ""); // remove extension
        const date = parseDMY(baseName);
        return date >= timeFrameStart && date <= timeFrameEnd;
      },
    );

    if (!files.length)
      throw { status: 401, message: "No files in given timestamp" };

    console.log(files);

    const read_data = files.flatMap<statsData>((json) => {
      return {
        json_name: json,
        ...JSON.parse(
          fs.readFileSync(path.resolve(channel_path, json), "utf-8"),
        ),
      };
    });

    //console.log(read_data);

    const merge_data = read_data.flatMap<{
      key: string;
      value: statsDataValue;
    }>((data) =>
      Object.entries(data).map(([key, value]) => {
        return {
          key,
          value,
        };
      }),
    );

    //console.log(merge_data);

    function mergeDataState(
      new_data: dataState["data"],
      old_data?: dataState["data"],
    ): dataState["data"] {
      if (!old_data) return new_data;

      return old_data.flatMap((data) => {
        const found_data = new_data.find(
          (new_data_part) => new_data_part.name == data.name,
        );

        if (found_data) data.count += found_data.count;

        return data;
      });
    }

    const non_mergeable = ["streamer_id"];
    const blocked_keys = ["json_name"];
    const merged_data = merge_data.reduce<statsData>((acc, stats_data) => {
      const key = stats_data.key;
      const value = stats_data.value;

      if (!blocked_keys.includes(key)) {
        if (typeof value == "string") acc[key] = value;
        if (typeof value == "number")
          acc[key] =
            (!non_mergeable.includes(key) && typeof acc[key] == "number"
              ? acc[key]
              : 0) + value;
        if (typeof value == "object" && "data" in value)
          acc[key] = {
            ...value,
            data: mergeDataState(
              value["data"],
              typeof acc[key] == "object" && "data" in acc[key]
                ? acc[key]["data"]
                : undefined,
            ),
          };
      }

      if (key == "json_name" && typeof value == "string")
        acc["files"] = [
          ...(Array.isArray(acc["files"]) ? acc["files"] : []),
          value,
        ];

      return acc;
    }, {});

    const end = performance.now();

    merged_data["path"] = channel_path;
    merged_data["time_taken"] = end - start;

    fs.writeFileSync(
      path.resolve(".", "merged.json"),
      JSON.stringify(merged_data),
      "utf-8",
    );

    console.log("Elapsed:", end - start, "ms");

    results = merged_data;
  } catch (err) {
    console.error(err);
    return res
      .status((err as Err).status ?? 500)
      .json({ message: (err as Err).message ?? "Server error", error: true });
  }

  return res.json(results);
});

export default RequestRouter;
