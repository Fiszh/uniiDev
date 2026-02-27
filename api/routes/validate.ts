import router from "$lib/router";
import { validate } from "$lib/twitch";

const RequestRouter = router();

import { read } from "$lib/userSettings";

RequestRouter.add("GET", "/", async (req, res) => {
  const token_header = req.headers.get("x-auth-token");

  if (!token_header)
    return res.status(400).json({
      error: "Bad Request",
      status: 400,
      message: "Missing x-auth-token header",
    });

  const user_info = await validate(token_header);

  if (!user_info || "error" in user_info)
    return res
      .status(401)
      .json({ error: true, message: "Failed to validate your token!" });

  let settings = null;

  if (user_info["user_id"]) {
    const result = await read(user_info["user_id"]);

    if (result.result) settings = result.result;
  }

  if (user_info) {
    return res.json({
      ...user_info,
      settings,
    });
  } else {
    return res
      .status(401)
      .json({ error: true, message: "Failed to validate your token!" });
  }
});

export default RequestRouter;
