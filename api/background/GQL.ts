import axios from "axios";

import { Queries } from "$lib/GQL";

const getRandomInterval = (minMinutes = 40, maxMinutes = 60) =>
  Math.floor(Math.random() * (maxMinutes - minMinutes) * 60000) +
  minMinutes * 60000;

export async function getTwitchGQLVersion() {
  let success = false;
  let failMsg = null;

  try {
    const response = await axios.get(
      "https://static.twitchcdn.net/config/manifest.json?v=1",
    );

    if (response.status === 200) {
      const buildId =
        response.data?.channels?.[0]?.releases?.[0]?.buildId || null;
      Queries.headers["Client-Version"] = buildId;

      console.log("GQL Version:", buildId);
      const waitTime = getRandomInterval();

      console.log(buildId);

      //sendWebhookMessage(WEBHOOK_URL, `Fetched new GQL Version: ${buildId}\nNext fetch will happen: <t:${Math.floor((Date.now() + waitTime) / 1000)}>`, "embed", 0x00ff00);

      setTimeout(getTwitchGQLVersion, waitTime);
    } else {
      throw new Error("Failed to fetch data. Status: " + response.status);
    }
  } catch (error) {
    failMsg = "Error fetching GQL Version: " + (error || error);
    console.error(failMsg);

    const waitTime = getRandomInterval(2, 5);

    //sendWebhookMessage(WEBHOOK_URL, failMsg + `\nNext fetch will happen: <t:${Math.floor((Date.now() + waitTime) / 1000)}>`, "embed", 0xff0000);

    setTimeout(getTwitchGQLVersion, waitTime);
  }

  if (!failMsg) success = true;

  return { success, failMsg };
}
