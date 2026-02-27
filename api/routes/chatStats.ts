import { getQuery, sendGQLRequest } from "$lib/GQL";
import router from "$lib/router";

const RequestRouter = router();

const chatStats_query = getQuery("chat_stats");

RequestRouter.add("GET", "/", async (req, res) => {
  const channelNames = req.query.getAll("name");
  const key = req.query.get("key");

  if (!key || key != process.env.CHAT_STATS_API_KEY)
    return res.status(500).json({
      error: "Invalid key!",
    });

  if (!channelNames.length)
    return res.status(500).json({
      error: "No channel names provided!",
    });

  const GQLbody = [
    {
      query: chatStats_query,
      variables: { logins: channelNames },
    },
  ];

  const GQL_request = await sendGQLRequest(GQLbody);

  if (GQL_request.data.errors)
    return res.status(GQL_request.code || 500).json(GQL_request);

  console.log(GQL_request);

  if (!GQL_request?.data[0]?.data?.users) {
    return res.status(500).json({
      error: `Channels ${channelNames.join(",")} does not exist on Twitch!`,
    });
  } else {
    return res.status(200).json(GQL_request.data[0].data.users);
  }
});

export default RequestRouter;
