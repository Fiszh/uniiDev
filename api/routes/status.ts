import router from "$lib/router";
import { validate } from "$lib/twitch";

const RequestRouter = router();

const admins = ["528761326"];

import fs from "fs";
import path from "path";

interface StatusJSON {
  message: string;
  color: string;
  till: number;
}

const data_path = path.resolve(".", "data");
if (!fs.existsSync(data_path))
  fs.mkdirSync(path.resolve(data_path), { recursive: true });

const file_path = path.resolve(data_path, "status.json");
if (!fs.existsSync(file_path))
  fs.writeFileSync(
    file_path,
    JSON.stringify(
      {
        message: "",
        color: "",
        till: 0,
      },
      null,
      2,
    ),
    "utf8",
  );

function getStatus(message: string, color: string, till: number): void;
function getStatus(): StatusJSON;
function getStatus(
  message?: string,
  color?: string,
  till?: number,
): void | StatusJSON {
  if (message) {
    fs.writeFileSync(
      file_path,
      JSON.stringify({ message, color, till }, null, 2),
      "utf-8",
    );
    return;
  }

  return JSON.parse(fs.readFileSync(file_path, "utf-8")) as StatusJSON;
}

RequestRouter.add("POST", "/", async (req, res) => {
  const token_header = req.headers.get("x-auth-token");
  const message = (req.headers.get("message") as string) || null;

  if (!token_header)
    return res.status(400).json({
      error: "Bad Request",
      status: 400,
      message: "Missing x-auth-token header",
    });

  if (!message)
    return res.status(400).json({
      error: "Bad Request",
      status: 400,
      message: "Missing message header",
    });

  const user_info = await validate(token_header);

  if (!user_info || "error" in user_info)
    return res
      .status(401)
      .json({ error: true, message: "Failed to validate your token!" });

  if (admins.includes(user_info["user_id"])) {
    const status_message: StatusJSON = {
      message,
      color: (req.headers.get("color") as string) || "#FFFFFF",
      till: Number(req.headers.get("till") as string) || Date.now(),
    };

    getStatus(
      status_message.message,
      status_message.color,
      status_message.till,
    );

    return res.status(200).json({ error: false, message: "Message set!" });
  } else {
    return res
      .status(401)
      .json({ error: true, message: "Token is not valid." });
  }
});

RequestRouter.add("GET", "/", async (req, res) => {
  const status_message = getStatus();

  if (status_message) {
    return res.status(200).json(status_message);
  } else {
    return res.status(404).json({ error: true, message: "No message." });
  }
});

export default RequestRouter;
