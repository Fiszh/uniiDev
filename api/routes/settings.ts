import router from "$lib/router";
import { validate } from "$lib/twitch";

const RequestRouter = router();

import { save, read, del } from "$lib/userSettings";
import { UChat_Testers } from "$store/globals";

RequestRouter.add("GET", "/:userid", async (req, res) => {
  if (!req.params["userid"])
    return res.status(500).json({
      message: "No params",
      success: false,
      error: "userid is missing",
    }); // <-- NGL THIS MIGHT BE USELESS

  const result = await read(req.params["userid"]);

  if (!result.success)
    return res
      .status(500)
      .json({ message: "Read failed", success: false, error: "Unknown error" });

  if (!result.result)
    return res
      .status(404)
      .json({ message: "User not found", success: false, error: null });

  return res.json({ settings: result.result, success: true, error: null });
});

RequestRouter.add("POST", "/", async (req, res) => {
  const token_header = req.headers.get("x-auth-token");

  if (!token_header)
    return res.status(400).json({
      error: "Bad Request",
      status: 400,
      message: "Missing x-auth-token header",
    });

  if (
    !req.headers.get("content-type") ||
    req.headers.get("content-type") != "application/json"
  )
    return res.status(400).json({
      error: "Bad Request",
      status: 400,
      message: "Content-Type must be application/json",
    });

  const body = await req?.json();

  if (!body || !Object.keys(body).length)
    return res.status(400).json({
      error: "Bad Request",
      status: 400,
      message: "JSON body is missing or empty",
    });

  const validatedToken = await validate(token_header);

  if (!validatedToken || "error" in validatedToken)
    return res.status(401).json({
      error: "Invalid Token",
      status: 400,
      message: "Failed to validate your token!",
    });

  if (!UChat_Testers.includes(validatedToken.user_id))
    return res.status(403).json({
      message: "Save failed",
      success: false,
      error: "Not in test group!",
    });

  const saved = await save(validatedToken.user_id, body);

  if (!saved.success)
    return res
      .status(500)
      .json({ message: "Save failed", success: false, error: "Unknown error" });

  return res.json({
    message: "Saved successfully",
    success: true,
    error: null,
  });
});

RequestRouter.add("DELETE", "/", async (req, res) => {
  const token_header = req.headers.get("x-auth-token");

  if (!token_header)
    return res.status(400).json({
      error: "Bad Request",
      status: 400,
      message: "Missing x-auth-token header",
    });

  const validatedToken = await validate(token_header);

  if (!validatedToken || "error" in validatedToken)
    return res.status(401).json({
      error: "Invalid Token",
      status: 400,
      message: "Failed to validate your token!",
    });

  if (!UChat_Testers.includes(validatedToken.user_id))
    return res.status(403).json({
      message: "Deletion failed",
      success: false,
      error: "Not in test group!",
    });

  const deleted = await del(validatedToken.user_id);

  if (!deleted.success)
    return res.status(500).json({
      message: "Deletion failed",
      success: false,
      error: "Unknown error",
    });

  return res.json({
    message: "Deleted successfully",
    success: true,
    error: null,
  });
});

export default RequestRouter;
