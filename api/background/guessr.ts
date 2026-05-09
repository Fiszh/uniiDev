import fs, { fsync } from "fs";
import path from "path";
import Fuse from "fuse.js";

const videos = JSON.parse(
  fs.readFileSync(path.resolve(".", "data", "guessr", "videos.json"), "utf-8"),
) as Video[];

const unique = [...new Map(videos.map((v) => [v.url, v])).values()];

fs.writeFileSync(
  path.resolve(".", "data", "guessr", "videos.json"),
  JSON.stringify(unique),
  "utf-8",
);

const fuse = new Fuse(unique, { keys: ["title"], threshold: 0.6 });

interface Video {
  thumbnail: string;
  title: string;
  url: string;
}

interface Videos {
  thumbnail: string;
  titles: string[];
  url: string;
}

function getOptions(count = 5): Videos[] {
  const videoMap = [...Array(count)].map((index) => {
    const randomVideo = videos[
      Math.floor(Math.random() * videos.length)
    ] as Video;

    const similar = fuse
      .search(randomVideo.title)
      .map((r) => r.item)
      .filter((v) => v.url !== randomVideo.url)
      .slice(0, 3);

    if (similar.length < 3) {
      const existing = new Set([randomVideo.url, ...similar.map((v) => v.url)]);
      const pool = videos.filter((v) => !existing.has(v.url));
      const shuffled = pool.sort(() => Math.random() - 0.5);
      similar.push(...shuffled.slice(0, 3 - similar.length));
    }

    return {
      thumbnail: randomVideo.thumbnail,
      titles: [...similar, randomVideo]
        .flatMap((vid) => vid.title)
        .sort(() => Math.random() - 0.5),
      correct: randomVideo.title,
      url: randomVideo.url,
    };
  });

  return videoMap;
}

export function generateGuessrRounds() {
  const options = getOptions();

  fs.writeFileSync(
    path.resolve(".", "data", "guessr", "rounds.json"),
    JSON.stringify(options),
    "utf-8",
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const now = new Date();
  const msUntilReset = tomorrow.getTime() - now.getTime();

  setTimeout(generateGuessrRounds, msUntilReset);
}
