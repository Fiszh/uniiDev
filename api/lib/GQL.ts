import axios from "axios";

import fs from "fs";
import path from "path";

export let Queries = {
  url: "https://gql.twitch.tv/gql",
  headers: {
    "Client-ID": "ue6666qo983tsx6so1t0vnawi233wa",
    "Client-Version": "0454d470-1fab-4caf-abcd-03c327da38ac",
    "X-Device-ID": process.env.DEVICE_ID,
    Referer: "https://twitch.tv/",
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 7.1; Smart Box C1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
    "Content-Type": "application/json",
  },
};

export function getQuery(query_name: string): string | false {
  const queryPath = path.join(process.cwd(), "GQL", query_name + ".gql");
  if (fs.existsSync(queryPath)) return fs.readFileSync(queryPath, "utf-8");

  return false;
}

export async function sendGQLRequest(GQLbody: Record<string, any>) {
  console.log(process.env.DEVICE_ID);
  if (!Queries.headers["Client-Version"])
    return {
      error: true,
      code: 500,
      message: "Failed, no Client Version",
    };

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
