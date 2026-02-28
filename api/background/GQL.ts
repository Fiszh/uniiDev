import axios from "axios";

import { Queries } from "$lib/GQL";
import { queueMessage } from "$lib/discord";

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
      //Queries.headers["Client-Version"] = buildId;

      console.log("GQL Version:", buildId);
      const waitTime = getRandomInterval();

      console.log(buildId);

      const webhookMessage = [
        {
          name:
            process.env.CLIENT_VERSION == buildId
              ? "Fetched GQL Version"
              : "Fetched new GQL Version",
          value: buildId,
        },
        {
          name: "Next fetch will happen",
          value: `<t:${Math.floor((Date.now() + waitTime) / 1000)}>`,
        },
      ];

      process.env.CLIENT_VERSION = buildId;

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

      setTimeout(getTwitchGQLVersion, waitTime);
    } else {
      throw new Error("Failed to fetch data. Status: " + response.status);
    }
  } catch (error) {
    failMsg = "Error fetching GQL Version: " + (error || error);
    console.error(failMsg);

    const waitTime = getRandomInterval(2, 5);

    const webhookMessage = [
      {
        name: "Failed!",
        value: failMsg,
      },
      {
        name: "Next fetch will happen",
        value: `<t:${Math.floor((Date.now() + waitTime) / 1000)}>`,
      },
    ];

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

    setTimeout(getTwitchGQLVersion, waitTime);
  }

  if (!failMsg) success = true;

  return { success, failMsg };
}
