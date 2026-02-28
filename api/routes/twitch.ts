import { getQuery, sendGQLRequest } from "$lib/GQL";
import router from "$lib/router";

const RequestRouter = router();

const name_query = getQuery("twitch_name");

const cache = new Map();
const ttl = 60 * 60 * 1000;

RequestRouter.add("GET", "/:userid", async (req, res) => {
  const channelID = req.params["userid"];

  if (isNaN(Number(channelID)))
    return res.status(400).json({ error: "Channel ID must be numeric" });

  const cached = cache.get(channelID);
  if (cached && cached.expires > Date.now())
    return typeof cached.data == "string"
      ? res.redirect(cached.data + "?cached=true")
      : res.status(404).json(cached.data);

  cache.delete(channelID);

  const GQLbody = [
    {
      query: name_query,
      variables: {
        id: channelID,
      },
    },
  ];

  const GQL_request = await sendGQLRequest(GQLbody);

  if (GQL_request?.data) {
    const username = GQL_request?.data?.[0]?.data?.user?.login;

    let cacheData: Record<string, any> | string = {
      message: "Twitch Username not found",
      success: false,
      error: null,
    };

    if (username) {
      cacheData = `https://twitch.tv/${username}`;
      res.redirect(`https://twitch.tv/${username}`);
    } else {
      res.status(404).json(cacheData);
    }

    cache.set(channelID, {
      data: cacheData,
      expires: Date.now() + ttl,
    });
  } else {
    res.status(500).json(GQL_request);
  }
});

export default RequestRouter;
