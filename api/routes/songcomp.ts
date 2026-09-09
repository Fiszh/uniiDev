import router from "$lib/routerV2";
import { validate } from "$lib/twitch";

const RequestRouter = new router("songcomp");

import fs, { readFileSync, writeFileSync } from "fs";
import path from "path";

interface SongCompEntry {
  id: number;
  username: string;
  link: string;
  timestamp: string;
  notes?: string;
}

const data_path = path.resolve(".", "data", "songcomp");
if (!fs.existsSync(data_path))
  fs.mkdirSync(path.resolve(data_path), { recursive: true });

async function saveEntries(data: SongCompEntry[]) {
  const entrys_path = path.resolve(
    data_path,
    String(new Date().getMonth() + 1) + ".json",
  );

  await writeFileSync(entrys_path, JSON.stringify(data), "utf-8");
}

async function getEntries(): Promise<SongCompEntry[]> {
  const entrys_path = path.resolve(
    data_path,
    String(new Date().getMonth() + 1) + ".json",
  );
  if (!fs.existsSync(entrys_path)) {
    await saveEntries([]);
    return [];
  }

  return JSON.parse(
    await readFileSync(entrys_path, "utf-8"),
  ) as SongCompEntry[];
}

async function getEntry(userid: number) {
  const entryData = await getEntries();

  return entryData.find((e) => e["id"] == userid);
}

async function saveEntry(entry: SongCompEntry) {
  const entryData = await getEntries();

  const data = [...entryData.filter((e) => e["id"] != entry["id"]), entry];

  await saveEntries(data);
}

RequestRouter.add(
  "GET",
  "/",
  async (req, res) => {
    const entrys = await getEntries();

    return entrys
      ? res.status(200).json(entrys)
      : res.status(404).json({ error: true, message: "No entrys." });
  },
  { cors: false },
);

RequestRouter.add(
  "GET",
  "/:userid",
  async (req, res) => {
    const userid = req.params["userid"];

    const entry = await getEntry(Number(userid));

    return entry
      ? res.status(200).json(entry)
      : res.status(404).json({ error: true, message: "No entry." });
  },
  { cors: false },
);

RequestRouter.add(
  "POST",
  "/:userid",
  async (req, res) => {
    const userid = req.params["userid"];
    const token_header = req.headers.get("x-auth-token");

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

    const aviableValues = ["link" in body, "timestamp" in body];

    if (aviableValues.includes(false))
      return res.status(400).json({
        error: "Bad Request",
        status: 400,
        message: "Invalid body!",
      });

    if (!token_header)
      return res.status(400).json({
        error: "Bad Request",
        status: 400,
        message: "Missing x-auth-token header",
      });

    const validatedToken = await validate(token_header);

    console.log(token_header);
    console.log(validatedToken);

    if (!validatedToken || "error" in validatedToken)
      return res.status(401).json({
        error: "Invalid Token",
        status: 401,
        message: "Failed to validate your token!",
      });

    if (validatedToken["user_id"] != userid)
      return res.status(401).json({
        error: "Invalid Token",
        status: 401,
        message: "Token doesn't match userid!",
      });

    try {
      const data: SongCompEntry = {
        id: Number(validatedToken["user_id"]),
        username: validatedToken["login"],
        ...body,
      };

      await saveEntry(data);
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({
        error: "Save Error",
        status: 400,
        message: "Failed to save your data, please retry!",
      });
    }

    return res.status(200).body("OK");
  },
  { cors: false },
);

export default RequestRouter;
