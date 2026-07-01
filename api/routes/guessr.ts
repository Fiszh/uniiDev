import fs from "fs";
import path from "path";

const roundsJson = path.resolve("data", "guessr", "rounds.json");

import router from "$lib/routerV2";

const RequestRouter = new router("guessr");

interface Videos {
  thumbnail: string;
  titles: string[];
  correct: string;
  url: string;
}

RequestRouter.add("GET", "/rounds", async (req, res) => {
  const videos = JSON.parse(fs.readFileSync(roundsJson, "utf-8")) as Videos[];

  return res
    .status(200)
    .json(videos.map(({ thumbnail, titles }) => ({ thumbnail, titles })));
});

RequestRouter.add("GET", "/guess", async (req, res) => {
  const index = req.query.get("index");

  if (!index) return res.status(400).json({ error: "index is required" });

  const levelIndex = Number(index);

  if (levelIndex < 0 || levelIndex > 4)
    return res.status(400).json({ error: "index is not correct" });

  const videos = JSON.parse(fs.readFileSync(roundsJson, "utf-8")) as Videos[];

  if (videos[levelIndex]) {
    const level = videos[levelIndex];
    return res.status(200).json({ title: level.correct, url: level.url });
  } else {
    return res.status(400).json({ error: "index not found" });
  }
});

export default RequestRouter;
