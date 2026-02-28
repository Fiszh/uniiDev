import axios from "axios";

import fs from "fs";
import path from "path";

export const Queries = {
  url: "https://gql.twitch.tv/gql",
  headers: {
    "Client-ID": "ue6666qo983tsx6so1t0vnawi233wa",
    "Client-Version": undefined,
    Referer: "https://twitch.tv/",
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 7.1; Smart Box C1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
    "Content-Type": "application/json",
  } as Record<string, string | undefined>,
};

if (process.env.DEVICE_ID)
  Queries.headers["X-Device-ID"] = process.env.DEVICE_ID;

export function getQuery(query_name: string): string | false {
  const queryPath = path.resolve(".", "GQL", query_name + ".gql");
  if (fs.existsSync(queryPath)) return fs.readFileSync(queryPath, "utf-8");

  return false;
}

export async function sendGQLRequest(GQLbody: Record<string, any>) {
  if (!process.env.CLIENT_VERSION)
    return {
      error: true,
      code: 500,
      message: "Failed, no Client Version",
    };

  Queries.headers["Client-Version"] = process.env.CLIENT_VERSION;

  try {
    const { data } = await axios.post("https://gql.twitch.tv/gql", GQLbody, {
      headers: Queries.headers,
    });

    return { data };
  } catch (error) {
    let status = 500;
    let message = "Internal server error";

    console.log(error);

    // if (error.response) {
    //     status = error.response.status;
    //     message = error.response.data?.message || error.response.statusText || 'Twitch API error';
    // } else if (error.request) {
    //     status = 502;
    //     message = 'No response from Twitch API';
    // }

    //sendWebhookMessage(WEBHOOK_URL, `API ERROR\n${message}`);

    return {
      error: true,
      code: status,
      message,
    };
  }
}
