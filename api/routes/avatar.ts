import { getQuery, sendGQLRequest } from "$lib/GQL";
import router from "$lib/router";

const RequestRouter = router();

const avatar_query = getQuery("channel_avatar");

const cache = new Map();
const ttl = 60 * 1000;

RequestRouter.add("GET", "/", async (req, res) => {
  const channelID = req.query.get("id");
  const width = req.query.get("width");

  if (!channelID)
    return res.status(400).json({ error: "Channel id is required" });

  if (isNaN(Number(channelID)))
    return res.status(400).json({ error: "Channel ID must be numeric" });

  if (isNaN(Number(width)))
    return res.status(400).json({ error: "Width must be numeric" });

  const cached = cache.get(channelID);
  if (cached && cached.expires > Date.now())
    return res.status(cached.data.status).json(cached.data.body);

  cache.delete(channelID);

  const GQLbody = [
    {
      query: avatar_query,
      variables: {
        id: channelID,
        width: Number(width) || 70,
      },
    },
  ];

  const GQL_request = await sendGQLRequest(GQLbody);

  if (GQL_request.data[0].errors) {
    res.status(GQL_request.code || 500).json(GQL_request);
  } else if (!GQL_request.data[0].data?.user?.profileImageURL) {
    cache.set(channelID, {
      data: {
        status: 500,
        body: {
          error: `Channel with id of ${channelID} does not exist on Twitch!`,
        },
      },
      expires: Date.now() + ttl,
    });

    res.status(500).json({
      error: `Channel with id of ${channelID} does not exist on Twitch!`,
    });
  } else {
    cache.set(channelID, {
      data: {
        status: 200,
        body: { avatar: GQL_request.data[0].data?.user?.profileImageURL },
      },
      expires: Date.now() + ttl,
    });

    res
      .status(200)
      .json({ avatar: GQL_request.data[0].data?.user?.profileImageURL });
  }
});

export default RequestRouter;
