import path from "path";
import { Database } from "bun:sqlite";
import router from "$lib/routerV2";
import { validate } from "$lib/twitch";

const RequestRouter = new router("clipcomp");

const db_path = path.resolve(".", "data", "clipcomp", "data.sqlite");

const db = new Database(db_path, { create: true, strict: true });
db.run("PRAGMA journal_mode = WAL");

db.run(`
  CREATE TABLE IF NOT EXISTS submittions (
    username   TEXT NOT NULL,
    clips      TEXT NOT NULL
  )
`);

const submittions = db.prepare(`
    INSERT INTO submittions (username, clips)
    VALUES (?, ?)
`);

const submit = (username: string, clips: string) =>
  submittions.run(username, clips);

RequestRouter.add("POST", "/", async (req, res) => {
  const token_header = req.headers.get("x-auth-token");
  const content_type = req.headers.get("content-type");

  if (!content_type || content_type != "text/plain")
    return res.status(400).json({
      error: "Bad Request",
      status: 400,
      message: "Content-Type must be text/plain",
    });

  const body = await req?.text();

  if (!body || !body.length)
    return res.status(400).json({
      error: "Bad Request",
      status: 400,
      message: "TEXT body is missing or empty",
    });

  if (!token_header)
    return res.status(400).json({
      error: "Bad Request",
      status: 400,
      message: "Missing x-auth-token header",
    });

  const user_info = await validate(token_header);

  if (!user_info || "error" in user_info || !("login" in user_info))
    return res
      .status(401)
      .json({ error: true, message: "Failed to validate your token!" });

  submit(user_info["login"], body);

  return res.body("OK");
});

RequestRouter.add("GET", "/", async (req, res) => {
  const rows = db.query("SELECT * FROM submittions").all();
  
  return res.json(rows);
});

export default RequestRouter;
